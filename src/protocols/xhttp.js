// =============================================
// MozPN - پروتکل XHTTP
// =============================================

import { connect } from 'cloudflare:sockets';
import { ADDRESS_TYPE } from '../config/constants.js';

// تنظیمات XHTTP
let ACTIVE_CONNECTIONS = 0;
const XHTTP_BUFFER_SIZE = 128 * 1024;
const CONNECT_TIMEOUT_MS = 5000;
const IDLE_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2;
const MAX_CONCURRENT = 32;

/**
 * تاخیر
 */
function xhttpSleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * اعتبارسنجی UUID برای xhttp
 */
function validateUuidXhttp(id, uuid) {
    for (let index = 0; index < 16; index++) {
        if (id[index] !== uuid[index]) {
            return false;
        }
    }
    return true;
}

/**
 * شمارنده xhttp
 */
class XhttpCounter {
    #total;

    constructor() {
        this.#total = 0;
    }

    get() {
        return this.#total;
    }

    add(size) {
        this.#total += size;
    }
}

/**
 * ترکیب آرایه‌های تایپ‌دار
 */
function concatTypedArrays(first, ...args) {
    let len = first.length;
    for (let a of args) {
        len += a.length;
    }
    const r = new first.constructor(len);
    r.set(first, 0);
    len = first.length;
    for (let a of args) {
        r.set(a, len);
        len += a.length;
    }
    return r;
}

/**
 * پارس UUID برای xhttp
 */
function parseUuidXhttp(uuid) {
    uuid = uuid.replaceAll('-', '');
    const r = [];
    for (let index = 0; index < 16; index++) {
        const v = parseInt(uuid.substr(index * 2, 2), 16);
        r.push(v);
    }
    return r;
}

/**
 * دریافت بافر xhttp
 */
function getXhttpBuffer(size) {
    return new Uint8Array(new ArrayBuffer(size || XHTTP_BUFFER_SIZE));
}

/**
 * خواندن هدر xhttp
 */
async function readXhttpHeader(readable, uuidStr) {
    const reader = readable.getReader({ mode: 'byob' });

    try {
        let r = await reader.readAtLeast(1 + 16 + 1, getXhttpBuffer());
        let rlen = 0;
        let idx = 0;
        let cache = r.value;
        rlen += r.value.length;

        const version = cache[0];
        const id = cache.slice(1, 1 + 16);
        const uuid = parseUuidXhttp(uuidStr);
        
        if (!validateUuidXhttp(id, uuid)) {
            return 'invalid UUID';
        }
        
        const pbLen = cache[1 + 16];
        const addrPlus1 = 1 + 16 + 1 + pbLen + 1 + 2 + 1;

        if (addrPlus1 + 1 > rlen) {
            if (r.done) {
                return 'header too short';
            }
            idx = addrPlus1 + 1 - rlen;
            r = await reader.readAtLeast(idx, getXhttpBuffer());
            rlen += r.value.length;
            cache = concatTypedArrays(cache, r.value);
        }

        const cmd = cache[1 + 16 + 1 + pbLen];
        if (cmd !== 1) {
            return `unsupported command: ${cmd}`;
        }
        
        const port = (cache[addrPlus1 - 1 - 2] << 8) + cache[addrPlus1 - 1 - 1];
        const atype = cache[addrPlus1 - 1];
        let headerLen = -1;
        
        if (atype === ADDRESS_TYPE.IPV4) {
            headerLen = addrPlus1 + 4;
        } else if (atype === ADDRESS_TYPE.IPV6) {
            headerLen = addrPlus1 + 16;
        } else if (atype === ADDRESS_TYPE.URL) {
            headerLen = addrPlus1 + 1 + cache[addrPlus1];
        }

        if (headerLen < 0) {
            return 'read address type failed';
        }

        idx = headerLen - rlen;
        if (idx > 0) {
            if (r.done) {
                return 'read address failed';
            }
            r = await reader.readAtLeast(idx, getXhttpBuffer());
            rlen += r.value.length;
            cache = concatTypedArrays(cache, r.value);
        }

        let hostname = '';
        idx = addrPlus1;
        
        switch (atype) {
            case ADDRESS_TYPE.IPV4:
                hostname = cache.slice(idx, idx + 4).join('.');
                break;
            case ADDRESS_TYPE.URL:
                hostname = new TextDecoder().decode(
                    cache.slice(idx + 1, idx + 1 + cache[idx])
                );
                break;
            case ADDRESS_TYPE.IPV6:
                hostname = cache
                    .slice(idx, idx + 16)
                    .reduce(
                        (s, b2, i2, a) =>
                            i2 % 2
                                ? s.concat(((a[i2 - 1] << 8) + b2).toString(16))
                                : s,
                        []
                    )
                    .join(':');
                break;
        }

        if (hostname.length < 1) {
            return 'failed to parse hostname';
        }

        const data = cache.slice(headerLen);
        return {
            hostname,
            port,
            data,
            resp: new Uint8Array([version, 0]),
            reader,
            done: r.done
        };
    } catch (error) {
        try { reader.releaseLock(); } catch (_) {}
        throw error;
    }
}

/**
 * آپلود به ریموت xhttp
 */
async function uploadToRemoteXhttp(counter, writer, httpx) {
    async function innerUpload(d) {
        if (!d || d.length === 0) {
            return;
        }
        counter.add(d.length);
        try {
            await writer.write(d);
        } catch (error) {
            throw error;
        }
    }

    try {
        await innerUpload(httpx.data);
        let chunkCount = 0;
        while (!httpx.done) {
            const r = await httpx.reader.read(getXhttpBuffer());
            if (r.done) break;
            await innerUpload(r.value);
            httpx.done = r.done;
            chunkCount++;
            if (chunkCount % 10 === 0) {
                await xhttpSleep(0);
            }
            if (!r.value || r.value.length === 0) {
                await xhttpSleep(2);
            }
        }
    } catch (error) {
        throw error;
    }
}

/**
 * ساخت آپلودر xhttp
 */
function createXhttpUploader(httpx, writable) {
    const counter = new XhttpCounter();
    const writer = writable.getWriter();
    
    const done = (async () => {
        try {
            await uploadToRemoteXhttp(counter, writer, httpx);
        } catch (error) {
            throw error;
        } finally {
            try {
                await writer.close();
            } catch (error) {}
        }
    })();

    return {
        counter,
        done,
        abort: () => {
            try { writer.abort(); } catch (_) {}
        }
    };
}

/**
 * ساخت دانلودر xhttp
 */
function createXhttpDownloader(resp, remoteReadable) {
    const counter = new XhttpCounter();
    let stream;

    const done = new Promise((resolve, reject) => {
        stream = new TransformStream(
            {
                start(controller) {
                    counter.add(resp.length);
                    controller.enqueue(resp);
                },
                transform(chunk, controller) {
                    counter.add(chunk.length);
                    controller.enqueue(chunk);
                },
                cancel(reason) {
                    reject(`download cancelled: ${reason}`);
                }
            },
            null,
            new ByteLengthQueuingStrategy({ highWaterMark: XHTTP_BUFFER_SIZE })
        );

        let lastActivity = Date.now();
        const idleTimer = setInterval(() => {
            if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
                try {
                    stream.writable.abort?.('idle timeout');
                } catch (_) {}
                clearInterval(idleTimer);
                reject('idle timeout');
            }
        }, 5000);

        const reader = remoteReadable.getReader();
        const writer = stream.writable.getWriter();

        (async () => {
            try {
                let chunkCount = 0;
                while (true) {
                    const r = await reader.read();
                    if (r.done) {
                        break;
                    }
                    lastActivity = Date.now();
                    await writer.write(r.value);
                    chunkCount++;
                    if (chunkCount % 5 === 0) {
                        await xhttpSleep(0);
                    }
                }
                await writer.close();
                resolve();
            } catch (err) {
                reject(err);
            } finally {
                try { 
                    reader.releaseLock(); 
                } catch (_) {}
                try { 
                    writer.releaseLock(); 
                } catch (_) {}
                clearInterval(idleTimer);
            }
        })();
    });

    return {
        readable: stream.readable,
        counter,
        done,
        abort: () => {
            try { stream.readable.cancel(); } catch (_) {}
            try { stream.writable.abort(); } catch (_) {}
        }
    };
}

/**
 * اتصال به ریموت xhttp
 */
async function connectToRemoteXhttp(httpx, ...remotes) {
    let attempt = 0;
    let lastErr;
    
    const connectionList = [httpx.hostname, ...remotes.filter(r => r && r !== httpx.hostname)];
    
    for (const hostname of connectionList) {
        if (!hostname) continue;
        
        attempt = 0;
        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                const remote = connect({ hostname, port: httpx.port });
                const timeoutPromise = xhttpSleep(CONNECT_TIMEOUT_MS).then(() => {
                    throw new Error('connect timeout');
                });
                
                await Promise.race([remote.opened, timeoutPromise]);

                const uploader = createXhttpUploader(httpx, remote.writable);
                const downloader = createXhttpDownloader(httpx.resp, remote.readable);
                
                return { 
                    downloader, 
                    uploader,
                    close: () => {
                        try { remote.close(); } catch (_) {}
                    }
                };
            } catch (err) {
                lastErr = err;
                if (attempt < MAX_RETRIES) {
                    await xhttpSleep(500 * attempt);
                }
            }
        }
    }
    
    return null;
}

/**
 * مدیریت کلاینت xhttp
 */
export async function handleXhttpClient(body, uuid, fallbackAddress = '') {
    if (ACTIVE_CONNECTIONS >= MAX_CONCURRENT) {
        return new Response('Too many connections', { status: 429 });
    }
    
    ACTIVE_CONNECTIONS++;
    
    let cleaned = false;
    const cleanup = () => {
        if (!cleaned) {
            ACTIVE_CONNECTIONS = Math.max(0, ACTIVE_CONNECTIONS - 1);
            cleaned = true;
        }
    };

    try {
        const httpx = await readXhttpHeader(body, uuid);
        if (typeof httpx !== 'object' || !httpx) {
            cleanup();
            return null;
        }

        const remoteConnection = await connectToRemoteXhttp(httpx, fallbackAddress);
        if (remoteConnection === null) {
            cleanup();
            return null;
        }

        const connectionClosed = Promise.race([
            (async () => {
                try {
                    await remoteConnection.downloader.done;
                } catch (err) {}
            })(),
            (async () => {
                try {
                    await remoteConnection.uploader.done;
                } catch (err) {}
            })(),
            xhttpSleep(IDLE_TIMEOUT_MS).then(() => {})
        ]).finally(() => {
            try { remoteConnection.close(); } catch (_) {}
            try { remoteConnection.downloader.abort(); } catch (_) {}
            try { remoteConnection.uploader.abort(); } catch (_) {}
            cleanup();
        });

        return {
            readable: remoteConnection.downloader.readable,
            closed: connectionClosed
        };
    } catch (error) {
        cleanup();
        return null;
    }
}

/**
 * مدیریت درخواست POST xhttp
 */
export async function handleXhttpPost(request, uuid, fallbackAddress = '') {
    try {
        return await handleXhttpClient(request.body, uuid, fallbackAddress);
    } catch (err) {
        return null;
    }
}
