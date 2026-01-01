// =============================================
// MozPN v3.0 - سیستم مدیریت WARP
// ثبت‌نام خودکار + تولید کلید + مدیریت کامل
// =============================================

import { getConfigValue, setConfigValue } from './kvStore.js';

// ثابت‌های WARP
const WARP_API = 'https://api.cloudflareclient.com/v0a2158';
const WARP_API_V2 = 'https://api.cloudflareclient.com/v0a4005'; // نسخه جدیدتر
// Endpoint های WARP با کشورهای مختلف
const WARP_ENDPOINTS = [
    'engage.cloudflareclient.com:2408',
    '162.159.192.1:2408',
    '162.159.193.1:2408',
    '162.159.195.1:2408',
    '188.114.96.0:2408',
    '188.114.97.0:2408',
    '188.114.98.0:2408',
    '188.114.99.0:2408',
    '[2606:4700:d0::a29f:c001]:2408',
    '[2606:4700:d1::a29f:c101]:2408'
];

// Endpoint های WARP بر اساس کشور (برای تغییر IP)
const WARP_COUNTRY_ENDPOINTS = {
    // آمریکا و کانادا
    'US': ['162.159.192.1:2408', '162.159.193.1:2408', '162.159.192.2:2408'],
    'CA': ['162.159.192.1:2408', '162.159.193.1:2408'],
    
    // اروپا
    'DE': ['162.159.192.5:2408', '188.114.96.0:2408', '188.114.96.1:2408'],
    'NL': ['162.159.192.6:2408', '188.114.97.0:2408', '188.114.97.1:2408'],
    'GB': ['162.159.192.7:2408', '188.114.98.0:2408', '188.114.98.1:2408'],
    'FR': ['162.159.192.5:2408', '188.114.96.0:2408'],
    'SE': ['162.159.192.6:2408', '188.114.97.0:2408'],
    'FI': ['162.159.192.6:2408', '188.114.97.0:2408'],
    'PL': ['162.159.192.5:2408', '188.114.96.0:2408'],
    
    // آسیا
    'SG': ['162.159.192.8:2408', '188.114.99.0:2408', '188.114.99.1:2408'],
    'JP': ['162.159.192.9:2408', '162.159.195.1:2408', '162.159.195.2:2408'],
    'KR': ['162.159.192.9:2408', '162.159.195.1:2408'],
    'HK': ['162.159.192.8:2408', '188.114.99.0:2408'],
    'TW': ['162.159.192.9:2408', '162.159.195.1:2408'],
    'IN': ['162.159.192.8:2408', '188.114.99.0:2408'],
    
    // استرالیا
    'AU': ['162.159.192.8:2408', '188.114.99.0:2408'],
    
    // خاورمیانه
    'AE': ['162.159.192.5:2408', '188.114.96.0:2408'],
    'TR': ['162.159.192.5:2408', '188.114.96.0:2408'],
    
    // آمریکای جنوبی
    'BR': ['162.159.192.1:2408', '162.159.193.1:2408'],
    
    // روسیه
    'RU': ['162.159.192.6:2408', '188.114.97.0:2408'],
    
    // سرویس‌های ابری - همه از نزدیک‌ترین
    'Oracle': ['162.159.192.1:2408', '162.159.193.1:2408'],
    'DigitalOcean': ['162.159.192.1:2408', '162.159.193.1:2408'],
    'Vultr': ['162.159.192.1:2408', '162.159.193.1:2408'],
    'Multacom': ['162.159.192.1:2408', '162.159.193.1:2408'],
    'Linode': ['162.159.192.1:2408', '162.159.193.1:2408'],
    'AWS': ['162.159.192.1:2408', '162.159.193.1:2408'],
    'Azure': ['162.159.192.5:2408', '188.114.96.0:2408'],
    'GCP': ['162.159.192.1:2408', '162.159.193.1:2408'],
    
    // خودکار
    'AUTO': ['engage.cloudflareclient.com:2408']
};

// کلیدهای پیش‌فرض WARP (برای تست - کاربر باید کلید خودش را وارد کند)
const DEFAULT_WARP_CONFIG = {
    privateKey: '',
    publicKey: 'bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=',
    endpoint: 'engage.cloudflareclient.com:2408',
    reserved: [0, 0, 0],
    mtu: 1280
};

/**
 * ساختار کانفیگ WARP
 */
export function createWarpConfig(options = {}) {
    return {
        privateKey: options.privateKey || '',
        publicKey: options.publicKey || DEFAULT_WARP_CONFIG.publicKey,
        endpoint: options.endpoint || DEFAULT_WARP_CONFIG.endpoint,
        reserved: options.reserved || DEFAULT_WARP_CONFIG.reserved,
        mtu: options.mtu || DEFAULT_WARP_CONFIG.mtu,
        enabled: options.enabled || false,
        mode: options.mode || 'proxy', // proxy | full | off
        noiseMode: options.noiseMode || 'none', // none | padding | random
        createdAt: Date.now()
    };
}

/**
 * دریافت کانفیگ WARP از KV
 */
export async function getWarpConfig() {
    const configStr = getConfigValue('warpConfig', '');
    if (!configStr) {
        return createWarpConfig();
    }
    
    try {
        return JSON.parse(configStr);
    } catch {
        return createWarpConfig();
    }
}

/**
 * ذخیره کانفیگ WARP
 */
export async function saveWarpConfig(config) {
    await setConfigValue('warpConfig', JSON.stringify(config));
    return config;
}

/**
 * ثبت‌نام دستگاه جدید در WARP - نسخه کامل و کارآمد
 * این تابع خودکار کلید تولید میکنه و اکانت میسازه
 */
export async function registerWarpDevice() {
    try {
        // تولید کلید WireGuard
        const keyPair = generateWireGuardKeyPair();
        
        // تولید Install ID یونیک
        const installId = generateInstallId();
        
        // ثبت‌نام در کلودفلر
        const response = await fetch(`${WARP_API}/reg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CF-Client-Version': 'a-6.11-2223',
                'User-Agent': 'okhttp/3.12.1'
            },
            body: JSON.stringify({
                key: keyPair.publicKey,
                install_id: installId,
                fcm_token: '',
                tos: new Date().toISOString(),
                model: 'Android',
                serial_number: installId,
                locale: 'en_US'
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Registration failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // استخراج اطلاعات مهم
        const accountId = data.id;
        const token = data.token;
        const publicKey = data.config?.peers?.[0]?.public_key || DEFAULT_WARP_CONFIG.publicKey;
        const clientId = data.config?.client_id || '';
        const reserved = parseClientIdToReserved(clientId);
        
        return {
            success: true,
            privateKey: keyPair.privateKey,
            publicKey: publicKey,
            accountId: accountId,
            token: token,
            clientId: clientId,
            reserved: reserved,
            installId: installId,
            createdAt: Date.now()
        };
    } catch (error) {
        console.error('خطا در ثبت‌نام WARP:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * ارتقا به WARP+ با لایسنس
 */
export async function upgradeToWarpPlus(accountId, token, licenseKey) {
    try {
        const response = await fetch(`${WARP_API}/reg/${accountId}/account`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'CF-Client-Version': 'a-6.11-2223',
                'User-Agent': 'okhttp/3.12.1'
            },
            body: JSON.stringify({
                license: licenseKey
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upgrade failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        return {
            success: true,
            warpPlus: data.warp_plus || false,
            premiumData: data.premium_data || 0,
            accountType: data.account?.account_type || 'free'
        };
    } catch (error) {
        console.error('خطا در ارتقا به WARP+:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * گرفتن گیگابایت رایگان با رفرال
 * هر بار 1GB اضافه میکنه!
 */
export async function claimReferralBonus(accountId, token) {
    try {
        // ساخت یه اکانت فیک برای رفرال
        const fakeAccount = await registerWarpDevice();
        if (!fakeAccount.success) {
            return { success: false, error: 'خطا در ساخت اکانت رفرال' };
        }
        
        // اتصال رفرال به اکانت اصلی
        const response = await fetch(`${WARP_API}/reg/${fakeAccount.accountId}/account`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fakeAccount.token}`,
                'CF-Client-Version': 'a-6.11-2223',
                'User-Agent': 'okhttp/3.12.1'
            },
            body: JSON.stringify({
                referrer: accountId
            })
        });
        
        if (!response.ok) {
            return { success: false, error: 'خطا در ثبت رفرال' };
        }
        
        return {
            success: true,
            message: '1GB اضافه شد!',
            bonusGB: 1
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * گرفتن چند گیگابایت رایگان (چند رفرال)
 */
export async function claimMultipleReferrals(accountId, token, count = 5) {
    const results = [];
    let totalGB = 0;
    
    for (let i = 0; i < count; i++) {
        // تاخیر بین درخواست‌ها برای جلوگیری از بلاک
        if (i > 0) {
            await new Promise(r => setTimeout(r, 2000));
        }
        
        const result = await claimReferralBonus(accountId, token);
        results.push(result);
        
        if (result.success) {
            totalGB += 1;
        }
    }
    
    return {
        success: totalGB > 0,
        totalGB,
        details: results
    };
}

/**
 * دریافت اطلاعات اکانت WARP
 */
export async function getWarpAccountInfo(accountId, token) {
    try {
        const response = await fetch(`${WARP_API}/reg/${accountId}/account`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'CF-Client-Version': 'a-6.11-2223',
                'User-Agent': 'okhttp/3.12.1'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get account info: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            success: true,
            accountType: data.account?.account_type || 'free',
            warpPlus: data.warp_plus || false,
            premiumData: data.premium_data || 0,
            quota: data.quota || 0
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * تولید جفت کلید WireGuard (Curve25519)
 * پیاده‌سازی کامل و صحیح
 */
function generateWireGuardKeyPair() {
    // تولید کلید خصوصی (32 بایت تصادفی)
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    
    // اعمال clamping برای Curve25519
    privateKeyBytes[0] &= 248;
    privateKeyBytes[31] &= 127;
    privateKeyBytes[31] |= 64;
    
    // تبدیل به Base64
    const privateKey = uint8ArrayToBase64(privateKeyBytes);
    
    // محاسبه کلید عمومی با Curve25519
    const publicKeyBytes = curve25519ScalarMultBase(privateKeyBytes);
    const publicKey = uint8ArrayToBase64(publicKeyBytes);
    
    return { privateKey, publicKey };
}

/**
 * تبدیل Uint8Array به Base64
 */
function uint8ArrayToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * تبدیل Base64 به Uint8Array
 */
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Curve25519 scalar multiplication با base point
 * پیاده‌سازی بهینه‌شده
 */
function curve25519ScalarMultBase(scalar) {
    // Base point برای Curve25519: x = 9
    const basePoint = new Uint8Array(32);
    basePoint[0] = 9;
    
    return curve25519ScalarMult(scalar, basePoint);
}

/**
 * Curve25519 scalar multiplication
 * پیاده‌سازی Montgomery ladder
 */
function curve25519ScalarMult(scalar, point) {
    const p = BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949');
    const a24 = BigInt(121665);
    
    // تبدیل point به عدد
    let u = BigInt(0);
    for (let i = 0; i < 32; i++) {
        u |= BigInt(point[i]) << BigInt(i * 8);
    }
    
    let x1 = u;
    let x2 = BigInt(1);
    let z2 = BigInt(0);
    let x3 = u;
    let z3 = BigInt(1);
    
    let swap = BigInt(0);
    
    for (let t = 254; t >= 0; t--) {
        const byteIndex = Math.floor(t / 8);
        const bitIndex = t % 8;
        const kt = BigInt((scalar[byteIndex] >> bitIndex) & 1);
        
        swap ^= kt;
        [x2, x3] = cswap(swap, x2, x3);
        [z2, z3] = cswap(swap, z2, z3);
        swap = kt;
        
        const A = (x2 + z2) % p;
        const AA = (A * A) % p;
        const B = (x2 - z2 + p) % p;
        const BB = (B * B) % p;
        const E = (AA - BB + p) % p;
        const C = (x3 + z3) % p;
        const D = (x3 - z3 + p) % p;
        const DA = (D * A) % p;
        const CB = (C * B) % p;
        x3 = modPow((DA + CB) % p, BigInt(2), p);
        z3 = (x1 * modPow((DA - CB + p) % p, BigInt(2), p)) % p;
        x2 = (AA * BB) % p;
        z2 = (E * ((AA + a24 * E) % p)) % p;
    }
    
    [x2, x3] = cswap(swap, x2, x3);
    [z2, z3] = cswap(swap, z2, z3);
    
    const result = (x2 * modPow(z2, p - BigInt(2), p)) % p;
    
    // تبدیل به bytes
    const output = new Uint8Array(32);
    let temp = result;
    for (let i = 0; i < 32; i++) {
        output[i] = Number(temp & BigInt(0xff));
        temp >>= BigInt(8);
    }
    
    return output;
}

/**
 * Conditional swap
 */
function cswap(swap, a, b) {
    if (swap === BigInt(1)) {
        return [b, a];
    }
    return [a, b];
}

/**
 * Modular exponentiation
 */
function modPow(base, exp, mod) {
    let result = BigInt(1);
    base = ((base % mod) + mod) % mod;
    while (exp > 0) {
        if (exp % BigInt(2) === BigInt(1)) {
            result = (result * base) % mod;
        }
        exp = exp / BigInt(2);
        base = (base * base) % mod;
    }
    return result;
}

/**
 * تولید Install ID یونیک
 */
function generateInstallId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * پارس کردن Client ID به Reserved bytes
 */
function parseClientIdToReserved(clientId) {
    if (!clientId) return [0, 0, 0];
    
    try {
        const decoded = base64ToUint8Array(clientId);
        return [
            decoded[0] || 0,
            decoded[1] || 0,
            decoded[2] || 0
        ];
    } catch {
        return [0, 0, 0];
    }
}

/**
 * پارس کردن Reserved bytes (برای سازگاری)
 */
function parseReserved(clientId) {
    return parseClientIdToReserved(clientId);
}

/**
 * دریافت بهترین Endpoint
 */
export async function getBestWarpEndpoint() {
    const results = [];
    
    for (const endpoint of WARP_ENDPOINTS.slice(0, 5)) {
        try {
            const [host, port] = endpoint.split(':');
            const start = Date.now();
            
            // تست اتصال ساده
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            await fetch(`https://${host}`, {
                method: 'HEAD',
                signal: controller.signal
            }).catch(() => {});
            
            clearTimeout(timeoutId);
            const latency = Date.now() - start;
            
            results.push({ endpoint, latency });
        } catch {
            results.push({ endpoint, latency: 9999 });
        }
    }
    
    results.sort((a, b) => a.latency - b.latency);
    return results[0]?.endpoint || WARP_ENDPOINTS[0];
}

/**
 * تولید کانفیگ WireGuard برای کلاینت
 */
export function generateWireGuardConfig(warpConfig, options = {}) {
    const {
        dns = '1.1.1.1, 1.0.0.1',
        allowedIPs = '0.0.0.0/0, ::/0',
        persistentKeepalive = 25
    } = options;
    
    return `[Interface]
PrivateKey = ${warpConfig.privateKey}
Address = 172.16.0.2/32, fd01:5ca1:ab1e:823b::/128
DNS = ${dns}
MTU = ${warpConfig.mtu}

[Peer]
PublicKey = ${warpConfig.publicKey}
AllowedIPs = ${allowedIPs}
Endpoint = ${warpConfig.endpoint}
PersistentKeepalive = ${persistentKeepalive}`;
}

/**
 * تولید کانفیگ WARP برای Sing-box
 */
export function generateSingboxWarpOutbound(warpConfig, tag = 'warp') {
    return {
        type: 'wireguard',
        tag: tag,
        server: warpConfig.endpoint.split(':')[0],
        server_port: parseInt(warpConfig.endpoint.split(':')[1]) || 2408,
        local_address: [
            '172.16.0.2/32',
            'fd01:5ca1:ab1e:823b::/128'
        ],
        private_key: warpConfig.privateKey,
        peer_public_key: warpConfig.publicKey,
        reserved: warpConfig.reserved,
        mtu: warpConfig.mtu
    };
}

/**
 * تولید کانفیگ WARP برای Xray/V2Ray
 */
export function generateXrayWarpOutbound(warpConfig, tag = 'warp') {
    return {
        protocol: 'wireguard',
        tag: tag,
        settings: {
            secretKey: warpConfig.privateKey,
            address: ['172.16.0.2/32', 'fd01:5ca1:ab1e:823b::/128'],
            peers: [
                {
                    publicKey: warpConfig.publicKey,
                    allowedIPs: ['0.0.0.0/0', '::/0'],
                    endpoint: warpConfig.endpoint
                }
            ],
            reserved: warpConfig.reserved,
            mtu: warpConfig.mtu
        }
    };
}

/**
 * لیست Endpoint های WARP
 */
export function getWarpEndpoints() {
    return [...WARP_ENDPOINTS];
}

/**
 * دریافت Endpoint بر اساس کشور
 */
export function getWarpEndpointByCountry(countryCode = 'AUTO') {
    const code = countryCode.toUpperCase();
    const endpoints = WARP_COUNTRY_ENDPOINTS[code] || WARP_COUNTRY_ENDPOINTS['AUTO'];
    // انتخاب رندوم از لیست
    return endpoints[Math.floor(Math.random() * endpoints.length)];
}

/**
 * لیست کشورهای موجود برای WARP
 */
export function getWarpCountries() {
    return Object.keys(WARP_COUNTRY_ENDPOINTS).map(code => ({
        code,
        name: {
            'US': 'آمریکا 🇺🇸',
            'DE': 'آلمان 🇩🇪',
            'NL': 'هلند 🇳🇱',
            'GB': 'بریتانیا 🇬🇧',
            'SG': 'سنگاپور 🇸🇬',
            'JP': 'ژاپن 🇯🇵',
            'AUTO': 'خودکار 🌐'
        }[code] || code
    }));
}

/**
 * اعتبارسنجی کلید WireGuard
 */
export function isValidWireGuardKey(key) {
    if (!key || typeof key !== 'string') return false;
    
    try {
        const decoded = atob(key);
        return decoded.length === 32;
    } catch {
        return false;
    }
}

/**
 * تولید لینک‌های WARP برای کشورهای انتخاب‌شده
 * این تابع از همون selectedCountries استفاده میکنه
 */
export async function generateWarpLinks(warpConfig, selectedCountries, uuid, workerDomain, remarkPrefix = 'MozPN') {
    const links = [];
    
    if (!warpConfig.privateKey) {
        return links;
    }
    
    // اگه کشوری انتخاب نشده، یه نود AUTO بساز
    const countries = selectedCountries.length > 0 ? selectedCountries : [{ code: 'AUTO', name: 'WARP', emoji: '🌐' }];
    
    for (const country of countries) {
        // چک کن آیا WARP برای این کشور فعاله
        if (country.warpEnabled === false) continue;
        
        const countryCode = country.code || 'AUTO';
        const endpoint = getWarpEndpointByCountry(countryCode);
        
        // ساخت لینک WireGuard برای Sing-box/Hiddify
        const wgLink = generateWireGuardLink({
            privateKey: warpConfig.privateKey,
            publicKey: warpConfig.publicKey,
            endpoint: endpoint,
            reserved: warpConfig.reserved,
            mtu: warpConfig.mtu,
            name: `${country.emoji || '🌐'} ${country.name || countryCode} | ${remarkPrefix} | WARP`
        });
        
        links.push(wgLink);
    }
    
    return links;
}

/**
 * تولید لینک WireGuard (فرمت استاندارد)
 */
function generateWireGuardLink(config) {
    const {
        privateKey,
        publicKey,
        endpoint,
        reserved = [0, 0, 0],
        mtu = 1280,
        name = 'WARP'
    } = config;
    
    const [host, port] = endpoint.split(':');
    
    // فرمت wireguard:// برای کلاینت‌ها
    const params = new URLSearchParams({
        publickey: publicKey,
        address: '172.16.0.2/32,fd01:5ca1:ab1e:823b::/128',
        mtu: mtu.toString(),
        reserved: reserved.join(',')
    });
    
    // Base64 encode private key for URL
    const encodedName = encodeURIComponent(name);
    
    return `wireguard://${privateKey}@${host}:${port}?${params.toString()}#${encodedName}`;
}

/**
 * تولید کانفیگ WARP+ با لایسنس
 */
export function generateWarpPlusConfig(warpConfig, license = '') {
    return {
        ...warpConfig,
        license: license,
        warpPlus: !!license
    };
}
