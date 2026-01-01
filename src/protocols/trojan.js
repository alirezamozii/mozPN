// =============================================
// MozPN - پروتکل Trojan
// =============================================

import { ADDRESS_TYPE, ERROR_MESSAGES, CF_HTTP_PORTS, CF_HTTPS_PORTS } from '../config/constants.js';

/**
 * هش SHA224 - پیاده‌سازی کامل مثل کد قدیمی
 */
export async function sha224Hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    
    let H = [
        0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
        0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
    ];
    
    function rotr(n, x) {
        return ((n >>> x) | (n << (32 - x))) >>> 0;
    }
    
    const msgLen = data.length;
    const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(data);
    padded[msgLen] = 0x80;
    
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 4, msgLen * 8, false);
    
    for (let i = 0; i < paddedLen; i += 64) {
        const W = new Uint32Array(64);
        for (let t = 0; t < 16; t++) {
            W[t] = view.getUint32(i + t * 4, false);
        }
        for (let t = 16; t < 64; t++) {
            const s0 = rotr(W[t-15], 7) ^ rotr(W[t-15], 18) ^ (W[t-15] >>> 3);
            const s1 = rotr(W[t-2], 17) ^ rotr(W[t-2], 19) ^ (W[t-2] >>> 10);
            W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
        }
        
        let [a, b, c, d, e, f, g, h] = H;
        
        for (let t = 0; t < 64; t++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) >>> 0;
            
            h = g; g = f; f = e;
            e = (d + temp1) >>> 0;
            d = c; c = b; b = a;
            a = (temp1 + temp2) >>> 0;
        }
        
        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
        H[5] = (H[5] + f) >>> 0;
        H[6] = (H[6] + g) >>> 0;
        H[7] = (H[7] + h) >>> 0;
    }
    
    // SHA224 فقط 7 بلوک اول
    return H.slice(0, 7).map(h => h.toString(16).padStart(8, '0')).join('');
}

/**
 * پارس کردن هدر Trojan - دقیقا مثل کد قدیمی
 */
export async function parseTrojanHeader(buffer, uuid, customPassword = '') {
    const passwordToHash = customPassword || uuid;
    const sha224Password = await sha224Hash(passwordToHash);
    
    if (buffer.byteLength < 56) {
        return { hasError: true, message: 'invalid trojan data - too short' };
    }
    
    // بررسی CR LF در موقعیت 56
    if (new Uint8Array(buffer.slice(56, 57))[0] !== 0x0d || 
        new Uint8Array(buffer.slice(57, 58))[0] !== 0x0a) {
        return { hasError: true, message: 'invalid trojan header format (missing CR LF)' };
    }
    
    const password = new TextDecoder().decode(buffer.slice(0, 56));
    if (password !== sha224Password) {
        return { hasError: true, message: 'invalid trojan password' };
    }
    
    const socks5DataBuffer = buffer.slice(58);
    if (socks5DataBuffer.byteLength < 6) {
        return { hasError: true, message: 'invalid SOCKS5 request data' };
    }
    
    const view = new DataView(socks5DataBuffer);
    const cmd = view.getUint8(0);
    
    if (cmd !== 1) {
        return { hasError: true, message: 'unsupported command, only TCP (CONNECT) is allowed' };
    }
    
    const atype = view.getUint8(1);
    let addressLength = 0;
    let addressIndex = 2;
    let address = '';
    
    switch (atype) {
        case 1: // IPv4
            addressLength = 4;
            address = new Uint8Array(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)).join('.');
            break;
            
        case 3: // Domain
            addressLength = new Uint8Array(socks5DataBuffer.slice(addressIndex, addressIndex + 1))[0];
            addressIndex += 1;
            address = new TextDecoder().decode(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            break;
            
        case 4: // IPv6
            addressLength = 16;
            const dataView = new DataView(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            address = ipv6.join(':');
            break;
            
        default:
            return { hasError: true, message: `invalid addressType is ${atype}` };
    }
    
    if (!address) {
        return { hasError: true, message: `address is empty, addressType is ${atype}` };
    }
    
    const portIndex = addressIndex + addressLength;
    const portBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
    const portRemote = new DataView(portBuffer).getUint16(0);
    
    return {
        hasError: false,
        addressRemote: address,
        addressType: atype,
        port: portRemote,
        hostname: address,
        rawClientData: socks5DataBuffer.slice(portIndex + 4)
    };
}

/**
 * ساخت لینک‌های Trojan از لیست IP - دقیقا مثل کد قدیمی
 */
export async function generateTrojanLinksFromList(ipList, uuid, workerDomain, options = {}) {
    const { disableNonTLS = false, customPassword = '' } = options;
    const links = [];
    const wsPath = '/?ed=2048';
    
    const password = customPassword || uuid;
    
    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    
    for (const item of ipList) {
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
        for (const { port, tls } of portsToGenerate) {
            if (tls) {
                const wsNodeName = `${nodeNameBase}-${port}-Trojan-WS-TLS`;
                const params = new URLSearchParams({
                    security: 'tls',
                    sni: workerDomain,
                    fp: 'chrome',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`trojan://${password}@${safeIP}:${port}?${params.toString()}#${encodeURIComponent(wsNodeName)}`);
            } else {
                const wsNodeName = `${nodeNameBase}-${port}-Trojan-WS`;
                const params = new URLSearchParams({
                    security: 'none',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`trojan://${password}@${safeIP}:${port}?${params.toString()}#${encodeURIComponent(wsNodeName)}`);
            }
        }
    }
    
    return links;
}
