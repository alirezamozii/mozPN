// =============================================
// MozPN - مدیریت WebSocket
// =============================================

import { connect } from 'cloudflare:sockets';
import { parseVlessHeader, formatIdentifier } from '../protocols/vless.js';
import { parseTrojanHeader } from '../protocols/trojan.js';
import { ADDRESS_TYPE, ERROR_MESSAGES } from '../config/constants.js';
import { detectWorkerRegion, sortIPsByRegion } from '../utils/helpers.js';
import { parseAddressAndPort } from '../utils/validators.js';

/**
 * مدیریت درخواست WebSocket
 */
export async function handleWsRequest(request, config) {
    const {
        uuid,
        enableVless,
        enableTrojan,
        trojanPassword,
        fallbackAddress,
        currentRegion,
        socksConfig,
        backupIPs
    } = config;
    
    const wsPair = new WebSocketPair();
    const [clientSock, serverSock] = Object.values(wsPair);
    serverSock.accept();
    
    let remoteConnWrapper = { socket: null };
    let isDnsQuery = false;
    let protocolType = null;
    
    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readable = makeReadableStream(serverSock, earlyData);
    
    readable.pipeTo(new WritableStream({
        async write(chunk) {
            if (isDnsQuery) {
                return await forwardUDP(chunk, serverSock, null);
            }
            
            if (remoteConnWrapper.socket) {
                const writer = remoteConnWrapper.socket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }
            
            if (!protocolType) {
                // تلاش برای VLESS
                if (enableVless && chunk.byteLength >= 24) {
                    const vlessResult = parseVlessHeader(chunk, uuid);
                    if (!vlessResult.hasError) {
                        protocolType = 'vless';
                        const { addressType, port, hostname, rawIndex, version, isUDP } = vlessResult;
                        
                        if (isUDP) {
                            if (port === 53) {
                                isDnsQuery = true;
                            } else {
                                throw new Error(ERROR_MESSAGES.UDP_DNS_ONLY);
                            }
                        }
                        
                        const respHeader = new Uint8Array([version[0], 0]);
                        const rawData = chunk.slice(rawIndex);
                        
                        if (isDnsQuery) {
                            return forwardUDP(rawData, serverSock, respHeader);
                        }
                        
                        await forwardTCP(addressType, hostname, port, rawData, serverSock, respHeader, remoteConnWrapper, config);
                        return;
                    }
                }
                
                // تلاش برای Trojan
                if (enableTrojan && chunk.byteLength >= 56) {
                    const tjResult = await parseTrojanHeader(chunk, uuid, trojanPassword);
                    if (!tjResult.hasError) {
                        protocolType = 'trojan';
                        const { addressType, port, hostname, rawClientData } = tjResult;
                        await forwardTCP(addressType, hostname, port, rawClientData, serverSock, null, remoteConnWrapper, config);
                        return;
                    }
                }
                
                throw new Error('پروتکل نامعتبر یا احراز هویت ناموفق');
            }
        }
    })).catch(() => {});
    
    return new Response(null, { status: 101, webSocket: clientSock });
}

/**
 * ارسال به TCP
 */
async function forwardTCP(addrType, host, portNum, rawData, ws, respHeader, remoteConnWrapper, config) {
    const { fallbackAddress, currentRegion, socksConfig, backupIPs } = config;
    
    async function connectAndSend(address, port, useSocks = false) {
        const remoteSock = useSocks ?
            await establishSocksConnection(addrType, address, port, socksConfig) :
            connect({ hostname: address, port: port });
        
        const writer = remoteSock.writable.getWriter();
        await writer.write(rawData);
        writer.releaseLock();
        return remoteSock;
    }
    
    async function retryConnection() {
        let backupHost, backupPort;
        
        if (fallbackAddress && fallbackAddress.trim()) {
            const parsed = parseAddressAndPort(fallbackAddress);
            backupHost = parsed.address;
            backupPort = parsed.port || portNum;
        } else if (backupIPs && backupIPs.length > 0) {
            const sortedIPs = sortIPsByRegion(currentRegion, backupIPs);
            if (sortedIPs.length > 0) {
                backupHost = sortedIPs[0].domain;
                backupPort = sortedIPs[0].port || portNum;
            }
        }
        
        if (backupHost) {
            try {
                const fallbackSocket = await connectAndSend(backupHost, backupPort, false);
                remoteConnWrapper.socket = fallbackSocket;
                fallbackSocket.closed.catch(() => {}).finally(() => closeSocketQuietly(ws));
                connectStreams(fallbackSocket, ws, respHeader, null);
            } catch {
                closeSocketQuietly(ws);
            }
        } else {
            closeSocketQuietly(ws);
        }
    }
    
    try {
        const initialSocket = await connectAndSend(host, portNum, false);
        remoteConnWrapper.socket = initialSocket;
        connectStreams(initialSocket, ws, respHeader, retryConnection);
    } catch {
        retryConnection();
    }
}

/**
 * ساخت ReadableStream از WebSocket
 */
function makeReadableStream(socket, earlyDataHeader) {
    let cancelled = false;
    
    return new ReadableStream({
        start(controller) {
            socket.addEventListener('message', (event) => {
                if (!cancelled) controller.enqueue(event.data);
            });
            
            socket.addEventListener('close', () => {
                if (!cancelled) {
                    closeSocketQuietly(socket);
                    controller.close();
                }
            });
            
            socket.addEventListener('error', (err) => controller.error(err));
            
            const { earlyData, error } = base64ToArray(earlyDataHeader);
            if (error) {
                controller.error(error);
            } else if (earlyData) {
                controller.enqueue(earlyData);
            }
        },
        cancel() {
            cancelled = true;
            closeSocketQuietly(socket);
        }
    });
}

/**
 * اتصال استریم‌ها
 */
async function connectStreams(remoteSocket, webSocket, headerData, retryFunc) {
    let header = headerData;
    let hasData = false;
    
    await remoteSocket.readable.pipeTo(
        new WritableStream({
            async write(chunk, controller) {
                hasData = true;
                if (webSocket.readyState !== 1) {
                    controller.error(ERROR_MESSAGES.WS_NOT_OPEN);
                }
                
                if (header) {
                    webSocket.send(await new Blob([header, chunk]).arrayBuffer());
                    header = null;
                } else {
                    webSocket.send(chunk);
                }
            },
            abort() {}
        })
    ).catch(() => {
        closeSocketQuietly(webSocket);
    });
    
    if (!hasData && retryFunc) {
        retryFunc();
    }
}

/**
 * ارسال UDP (برای DNS)
 */
async function forwardUDP(udpChunk, webSocket, respHeader) {
    try {
        const tcpSocket = connect({ hostname: '8.8.4.4', port: 53 });
        let header = respHeader;
        
        const writer = tcpSocket.writable.getWriter();
        await writer.write(udpChunk);
        writer.releaseLock();
        
        await tcpSocket.readable.pipeTo(new WritableStream({
            async write(chunk) {
                if (webSocket.readyState === 1) {
                    if (header) {
                        webSocket.send(await new Blob([header, chunk]).arrayBuffer());
                        header = null;
                    } else {
                        webSocket.send(chunk);
                    }
                }
            }
        }));
    } catch {}
}

/**
 * اتصال SOCKS5
 */
async function establishSocksConnection(addrType, address, port, socksConfig) {
    const { username, password, hostname, socksPort } = socksConfig;
    const socket = connect({ hostname, port: socksPort });
    
    const writer = socket.writable.getWriter();
    await writer.write(new Uint8Array(username ? [5, 2, 0, 2] : [5, 1, 0]));
    
    const reader = socket.readable.getReader();
    let res = (await reader.read()).value;
    
    if (res[0] !== 5 || res[1] === 255) {
        throw new Error('متد قابل قبول SOCKS یافت نشد');
    }
    
    if (res[1] === 2) {
        if (!username || !password) {
            throw new Error('سرور SOCKS نیاز به احراز هویت دارد');
        }
        
        const encoder = new TextEncoder();
        const authRequest = new Uint8Array([
            1, username.length, ...encoder.encode(username),
            password.length, ...encoder.encode(password)
        ]);
        
        await writer.write(authRequest);
        res = (await reader.read()).value;
        
        if (res[0] !== 1 || res[1] !== 0) {
            throw new Error('احراز هویت SOCKS ناموفق');
        }
    }
    
    const encoder = new TextEncoder();
    let DSTADDR;
    
    switch (addrType) {
        case ADDRESS_TYPE.IPV4:
            DSTADDR = new Uint8Array([1, ...address.split('.').map(Number)]);
            break;
        case ADDRESS_TYPE.URL:
            DSTADDR = new Uint8Array([3, address.length, ...encoder.encode(address)]);
            break;
        case ADDRESS_TYPE.IPV6:
            DSTADDR = new Uint8Array([4, ...address.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]);
            break;
        default:
            throw new Error(ERROR_MESSAGES.INVALID_ADDR_TYPE);
    }
    
    await writer.write(new Uint8Array([5, 1, 0, ...DSTADDR, port >> 8, port & 255]));
    res = (await reader.read()).value;
    
    if (res[1] !== 0) {
        throw new Error('اتصال SOCKS ناموفق');
    }
    
    writer.releaseLock();
    reader.releaseLock();
    return socket;
}

/**
 * بستن سوکت بدون خطا
 */
function closeSocketQuietly(socket) {
    try {
        if (socket.readyState === 1) {
            socket.close();
        }
    } catch {}
}

/**
 * تبدیل Base64 به آرایه
 */
function base64ToArray(base64Str) {
    if (!base64Str) return { earlyData: null, error: null };
    
    try {
        base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        const binaryStr = atob(base64Str);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return { earlyData: bytes.buffer, error: null };
    } catch (error) {
        return { earlyData: null, error };
    }
}
