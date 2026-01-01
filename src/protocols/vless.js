// =============================================
// MozPN - پروتکل VLESS
// =============================================

import { ADDRESS_TYPE, ERROR_MESSAGES, CF_HTTP_PORTS, CF_HTTPS_PORTS } from '../config/constants.js';

// جدول hex برای تبدیل UUID
const hexTable = Array.from({ length: 256 }, (v, i) => (i + 256).toString(16).slice(1));

/**
 * اعتبارسنجی فرمت UUID
 */
function isValidUUIDFormat(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * تبدیل آرایه بایت به UUID
 */
export function formatIdentifier(arr, offset = 0) {
    const id = (
        hexTable[arr[offset]] + hexTable[arr[offset + 1]] + 
        hexTable[arr[offset + 2]] + hexTable[arr[offset + 3]] + "-" +
        hexTable[arr[offset + 4]] + hexTable[arr[offset + 5]] + "-" +
        hexTable[arr[offset + 6]] + hexTable[arr[offset + 7]] + "-" +
        hexTable[arr[offset + 8]] + hexTable[arr[offset + 9]] + "-" +
        hexTable[arr[offset + 10]] + hexTable[arr[offset + 11]] + 
        hexTable[arr[offset + 12]] + hexTable[arr[offset + 13]] + 
        hexTable[arr[offset + 14]] + hexTable[arr[offset + 15]]
    ).toLowerCase();
    
    if (!isValidUUIDFormat(id)) {
        throw new TypeError(ERROR_MESSAGES.INVALID_ID_STR);
    }
    return id;
}

/**
 * پارس کردن هدر VLESS
 */
export function parseVlessHeader(chunk, token) {
    if (chunk.byteLength < 24) {
        return { hasError: true, message: ERROR_MESSAGES.INVALID_DATA };
    }
    
    const version = new Uint8Array(chunk.slice(0, 1));
    
    // بررسی UUID
    try {
        if (formatIdentifier(new Uint8Array(chunk.slice(1, 17))) !== token) {
            return { hasError: true, message: ERROR_MESSAGES.INVALID_USER };
        }
    } catch {
        return { hasError: true, message: ERROR_MESSAGES.INVALID_USER };
    }
    
    const optLen = new Uint8Array(chunk.slice(17, 18))[0];
    const cmd = new Uint8Array(chunk.slice(18 + optLen, 19 + optLen))[0];
    
    let isUDP = false;
    if (cmd === 1) {
        // TCP
    } else if (cmd === 2) {
        isUDP = true;
    } else {
        return { hasError: true, message: ERROR_MESSAGES.UNSUPPORTED_CMD };
    }
    
    const portIdx = 19 + optLen;
    const port = new DataView(chunk.slice(portIdx, portIdx + 2)).getUint16(0);
    
    let addrIdx = portIdx + 2;
    let addrLen = 0;
    let addrValIdx = addrIdx + 1;
    let hostname = '';
    
    const addressType = new Uint8Array(chunk.slice(addrIdx, addrValIdx))[0];
    
    switch (addressType) {
        case ADDRESS_TYPE.IPV4:
            addrLen = 4;
            hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.');
            break;
            
        case ADDRESS_TYPE.URL:
            addrLen = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + 1))[0];
            addrValIdx += 1;
            hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen));
            break;
            
        case ADDRESS_TYPE.IPV6:
            addrLen = 16;
            const ipv6 = [];
            const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen));
            for (let i = 0; i < 8; i++) {
                ipv6.push(ipv6View.getUint16(i * 2).toString(16));
            }
            hostname = ipv6.join(':');
            break;
            
        default:
            return { hasError: true, message: `${ERROR_MESSAGES.INVALID_ADDR_TYPE}: ${addressType}` };
    }
    
    if (!hostname) {
        return { hasError: true, message: `${ERROR_MESSAGES.EMPTY_ADDR}: ${addressType}` };
    }
    
    return {
        hasError: false,
        addressType,
        port,
        hostname,
        isUDP,
        rawIndex: addrValIdx + addrLen,
        version
    };
}

/**
 * ساخت لینک‌های VLESS از لیست IP
 * این تابع دقیقا مثل کد قدیمی کار می‌کند
 */
export function generateVlessLinksFromList(ipList, uuid, workerDomain, options = {}) {
    const { disableNonTLS = false } = options;
    const links = [];
    const wsPath = '/?ed=2048';
    
    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    
    ipList.forEach(item => {
        // ساخت نام نود
        let nodeNameBase = (item.isp || item.name || item.ip).replace(/\s/g, '_');
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        
        // آدرس امن برای IPv6
        const address = item.ip || item.domain;
        const safeIP = address.includes(':') ? `[${address}]` : address;
        
        // تعیین پورت‌ها
        let portsToGenerate = [];
        
        if (item.port) {
            const port = parseInt(item.port);
            
            if (CF_HTTPS_PORTS.includes(port)) {
                portsToGenerate.push({ port, tls: true });
            } else if (CF_HTTP_PORTS.includes(port)) {
                if (!disableNonTLS) {
                    portsToGenerate.push({ port, tls: false });
                }
            } else {
                portsToGenerate.push({ port, tls: true });
            }
        } else {
            defaultHttpsPorts.forEach(port => {
                portsToGenerate.push({ port, tls: true });
            });
            defaultHttpPorts.forEach(port => {
                portsToGenerate.push({ port, tls: false });
            });
        }
        
        // ساخت لینک‌ها
        portsToGenerate.forEach(({ port, tls }) => {
            if (tls) {
                const wsNodeName = `${nodeNameBase}-${port}-WS-TLS`;
                const params = new URLSearchParams({
                    encryption: 'none',
                    security: 'tls',
                    sni: workerDomain,
                    fp: 'chrome',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`vless://${uuid}@${safeIP}:${port}?${params.toString()}#${encodeURIComponent(wsNodeName)}`);
            } else {
                const wsNodeName = `${nodeNameBase}-${port}-WS`;
                const params = new URLSearchParams({
                    encryption: 'none',
                    security: 'none',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`vless://${uuid}@${safeIP}:${port}?${params.toString()}#${encodeURIComponent(wsNodeName)}`);
            }
        });
    });
    
    return links;
}

/**
 * ساخت لینک‌های xhttp
 */
export function generateXhttpLinksFromList(ipList, uuid, workerDomain) {
    const links = [];
    const nodePath = uuid.substring(0, 8);
    
    ipList.forEach(item => {
        let nodeNameBase = (item.isp || item.name || item.ip).replace(/\s/g, '_');
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        
        const address = item.ip || item.domain;
        const safeIP = address.includes(':') ? `[${address}]` : address;
        const port = item.port || 443;
        
        const wsNodeName = `${nodeNameBase}-${port}-xhttp`;
        const params = new URLSearchParams({
            encryption: 'none',
            security: 'tls',
            sni: workerDomain,
            fp: 'chrome',
            allowInsecure: '1',
            type: 'xhttp',
            host: workerDomain,
            path: `/${nodePath}`,
            mode: 'stream-one'
        });
        
        links.push(`vless://${uuid}@${safeIP}:${port}?${params.toString()}#${encodeURIComponent(wsNodeName)}`);
    });
    
    return links;
}
