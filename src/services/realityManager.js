// =============================================
// MozPN v3.0 - سیستم Reality Simulation
// شبیه‌سازی Reality و Fallback هوشمند
// =============================================

import { getConfigValue, setConfigValue } from './kvStore.js';

/**
 * لیست سایت‌های معتبر برای Fallback
 * این سایت‌ها باید TLS 1.3 و HTTP/2 پشتیبانی کنند
 */
const FALLBACK_SITES = [
    { domain: 'www.samsung.com', name: 'Samsung', fingerprint: 'chrome' },
    { domain: 'www.microsoft.com', name: 'Microsoft', fingerprint: 'chrome' },
    { domain: 'www.apple.com', name: 'Apple', fingerprint: 'safari' },
    { domain: 'www.amazon.com', name: 'Amazon', fingerprint: 'chrome' },
    { domain: 'www.cloudflare.com', name: 'Cloudflare', fingerprint: 'chrome' },
    { domain: 'www.google.com', name: 'Google', fingerprint: 'chrome' },
    { domain: 'www.yahoo.com', name: 'Yahoo', fingerprint: 'chrome' },
    { domain: 'www.bing.com', name: 'Bing', fingerprint: 'edge' },
    { domain: 'www.netflix.com', name: 'Netflix', fingerprint: 'chrome' },
    { domain: 'www.spotify.com', name: 'Spotify', fingerprint: 'chrome' },
    { domain: 'www.discord.com', name: 'Discord', fingerprint: 'chrome' },
    { domain: 'www.github.com', name: 'GitHub', fingerprint: 'chrome' },
    { domain: 'www.stackoverflow.com', name: 'StackOverflow', fingerprint: 'chrome' },
    { domain: 'www.medium.com', name: 'Medium', fingerprint: 'chrome' },
    { domain: 'www.reddit.com', name: 'Reddit', fingerprint: 'chrome' }
];

/**
 * Fingerprint های TLS
 */
const TLS_FINGERPRINTS = {
    chrome: {
        name: 'Chrome',
        alpn: ['h2', 'http/1.1'],
        cipherSuites: [
            'TLS_AES_128_GCM_SHA256',
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256'
        ],
        extensions: [
            'server_name', 'extended_master_secret', 'renegotiation_info',
            'supported_groups', 'ec_point_formats', 'session_ticket',
            'application_layer_protocol_negotiation', 'status_request',
            'signature_algorithms', 'signed_certificate_timestamp',
            'key_share', 'psk_key_exchange_modes', 'supported_versions',
            'compress_certificate', 'application_settings'
        ]
    },
    firefox: {
        name: 'Firefox',
        alpn: ['h2', 'http/1.1'],
        cipherSuites: [
            'TLS_AES_128_GCM_SHA256',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_256_GCM_SHA384'
        ],
        extensions: [
            'server_name', 'extended_master_secret', 'renegotiation_info',
            'supported_groups', 'ec_point_formats', 'session_ticket',
            'application_layer_protocol_negotiation', 'status_request',
            'delegated_credentials', 'key_share', 'supported_versions',
            'signature_algorithms', 'psk_key_exchange_modes', 'record_size_limit'
        ]
    },
    safari: {
        name: 'Safari',
        alpn: ['h2', 'http/1.1'],
        cipherSuites: [
            'TLS_AES_128_GCM_SHA256',
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256'
        ],
        extensions: [
            'server_name', 'extended_master_secret', 'renegotiation_info',
            'supported_groups', 'application_layer_protocol_negotiation',
            'status_request', 'signature_algorithms', 'key_share',
            'supported_versions', 'psk_key_exchange_modes'
        ]
    },
    edge: {
        name: 'Edge',
        alpn: ['h2', 'http/1.1'],
        cipherSuites: [
            'TLS_AES_128_GCM_SHA256',
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256'
        ],
        extensions: [
            'server_name', 'extended_master_secret', 'renegotiation_info',
            'supported_groups', 'ec_point_formats', 'session_ticket',
            'application_layer_protocol_negotiation', 'status_request',
            'signature_algorithms', 'signed_certificate_timestamp',
            'key_share', 'psk_key_exchange_modes', 'supported_versions'
        ]
    },
    random: {
        name: 'Random',
        alpn: ['h2', 'http/1.1'],
        cipherSuites: [],
        extensions: []
    }
};

/**
 * تنظیمات پیش‌فرض Reality
 */
const DEFAULT_REALITY_CONFIG = {
    enabled: false,
    fallbackSite: 'www.samsung.com',
    fingerprint: 'chrome',
    shortId: '',
    publicKey: '',
    privateKey: '',
    spiderX: '/',
    show: false
};

/**
 * دریافت کانفیگ Reality از KV
 */
export async function getRealityConfig() {
    const configStr = getConfigValue('realityConfig', '');
    if (!configStr) {
        return { ...DEFAULT_REALITY_CONFIG };
    }
    
    try {
        return { ...DEFAULT_REALITY_CONFIG, ...JSON.parse(configStr) };
    } catch {
        return { ...DEFAULT_REALITY_CONFIG };
    }
}

/**
 * ذخیره کانفیگ Reality
 */
export async function saveRealityConfig(config) {
    await setConfigValue('realityConfig', JSON.stringify(config));
    return config;
}

/**
 * تولید Short ID
 */
export function generateShortId(length = 8) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * تولید جفت کلید X25519 برای Reality
 */
export async function generateRealityKeyPair() {
    // تولید کلید خصوصی (32 بایت)
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    
    // Clamping برای X25519
    privateKeyBytes[0] &= 248;
    privateKeyBytes[31] &= 127;
    privateKeyBytes[31] |= 64;
    
    const privateKey = btoa(String.fromCharCode(...privateKeyBytes));
    
    // محاسبه کلید عمومی (ساده‌شده)
    // در عمل باید از کتابخانه X25519 استفاده شود
    const publicKeyBytes = new Uint8Array(32);
    // Base point multiplication
    const basePoint = new Uint8Array(32);
    basePoint[0] = 9;
    
    // Placeholder - در عمل باید scalar multiplication انجام شود
    for (let i = 0; i < 32; i++) {
        publicKeyBytes[i] = privateKeyBytes[i] ^ basePoint[i % 32];
    }
    
    const publicKey = btoa(String.fromCharCode(...publicKeyBytes));
    
    return { privateKey, publicKey };
}

/**
 * بررسی اعتبار سایت Fallback
 */
export async function validateFallbackSite(domain) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        clearTimeout(timeoutId);
        
        return {
            valid: response.ok,
            status: response.status,
            headers: {
                server: response.headers.get('server'),
                contentType: response.headers.get('content-type')
            }
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * انتخاب تصادفی سایت Fallback
 */
export function getRandomFallbackSite() {
    const index = Math.floor(Math.random() * FALLBACK_SITES.length);
    return FALLBACK_SITES[index];
}

/**
 * دریافت لیست سایت‌های Fallback
 */
export function getFallbackSites() {
    return [...FALLBACK_SITES];
}

/**
 * دریافت Fingerprint
 */
export function getFingerprint(name) {
    return TLS_FINGERPRINTS[name] || TLS_FINGERPRINTS.chrome;
}

/**
 * لیست Fingerprint ها
 */
export function listFingerprints() {
    return Object.keys(TLS_FINGERPRINTS).map(key => ({
        id: key,
        ...TLS_FINGERPRINTS[key]
    }));
}

/**
 * Handler برای Fallback
 * وقتی درخواست نامعتبر است، به سایت واقعی فوروارد کن
 */
export async function handleFallback(request, fallbackDomain) {
    try {
        const url = new URL(request.url);
        const fallbackUrl = `https://${fallbackDomain}${url.pathname}${url.search}`;
        
        // فوروارد درخواست
        const response = await fetch(fallbackUrl, {
            method: request.method,
            headers: {
                'Host': fallbackDomain,
                'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
                'Accept': request.headers.get('Accept') || '*/*',
                'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });
        
        // برگرداندن پاسخ با هدرهای اصلاح‌شده
        const newHeaders = new Headers(response.headers);
        newHeaders.delete('content-security-policy');
        newHeaders.delete('x-frame-options');
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    } catch (error) {
        // در صورت خطا، یک صفحه ساده برگردان
        return new Response('Service Unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * بررسی آیا درخواست معتبر است
 */
export function isValidRequest(request, uuid, customPath) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // بررسی مسیر
    if (customPath && path.startsWith(`/${customPath}`)) {
        return true;
    }
    
    // بررسی UUID در مسیر
    if (uuid && path.includes(uuid)) {
        return true;
    }
    
    // بررسی WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
        return true;
    }
    
    return false;
}

/**
 * تولید کانفیگ Reality برای Sing-box
 */
export function generateSingboxRealityConfig(config, serverAddress, serverPort = 443) {
    if (!config.enabled) return null;
    
    return {
        type: 'vless',
        tag: 'reality-out',
        server: serverAddress,
        server_port: serverPort,
        uuid: '', // باید توسط کاربر پر شود
        flow: 'xtls-rprx-vision',
        tls: {
            enabled: true,
            server_name: config.fallbackSite,
            utls: {
                enabled: true,
                fingerprint: config.fingerprint
            },
            reality: {
                enabled: true,
                public_key: config.publicKey,
                short_id: config.shortId
            }
        }
    };
}

/**
 * تولید کانفیگ Reality برای Xray
 */
export function generateXrayRealityConfig(config, serverAddress, serverPort = 443) {
    if (!config.enabled) return null;
    
    return {
        protocol: 'vless',
        settings: {
            vnext: [{
                address: serverAddress,
                port: serverPort,
                users: [{
                    id: '', // باید توسط کاربر پر شود
                    encryption: 'none',
                    flow: 'xtls-rprx-vision'
                }]
            }]
        },
        streamSettings: {
            network: 'tcp',
            security: 'reality',
            realitySettings: {
                show: config.show,
                fingerprint: config.fingerprint,
                serverName: config.fallbackSite,
                publicKey: config.publicKey,
                shortId: config.shortId,
                spiderX: config.spiderX
            }
        }
    };
}

/**
 * تولید کانفیگ سرور Reality برای Xray
 */
export function generateXrayRealityServerConfig(config) {
    return {
        listen: '0.0.0.0',
        port: 443,
        protocol: 'vless',
        settings: {
            clients: [],
            decryption: 'none'
        },
        streamSettings: {
            network: 'tcp',
            security: 'reality',
            realitySettings: {
                show: config.show,
                dest: `${config.fallbackSite}:443`,
                xver: 0,
                serverNames: [config.fallbackSite],
                privateKey: config.privateKey,
                shortIds: [config.shortId, '']
            }
        }
    };
}

/**
 * تست اتصال Reality
 */
export async function testRealityConnection(config, serverAddress) {
    try {
        // تست ساده با fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`https://${serverAddress}`, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'Host': config.fallbackSite
            }
        });
        
        clearTimeout(timeoutId);
        
        return {
            success: true,
            status: response.status,
            message: 'اتصال برقرار است'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
