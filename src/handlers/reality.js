// =============================================
// MozPN v3.0 - API مدیریت Reality
// =============================================

import {
    getRealityConfig,
    saveRealityConfig,
    generateShortId,
    generateRealityKeyPair,
    validateFallbackSite,
    getRandomFallbackSite,
    getFallbackSites,
    getFingerprint,
    listFingerprints,
    generateSingboxRealityConfig,
    generateXrayRealityConfig,
    generateXrayRealityServerConfig,
    testRealityConnection
} from '../services/realityManager.js';
import { jsonResponse } from '../utils/helpers.js';

/**
 * API مدیریت Reality
 */
export async function handleRealityAPI(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];
    
    switch (action) {
        case 'config':
            if (request.method === 'GET') {
                return await handleGetConfig();
            } else if (request.method === 'POST') {
                return await handleSaveConfig(request);
            }
            break;
        
        case 'generate-keys':
            if (request.method === 'POST') {
                return await handleGenerateKeys();
            }
            break;
        
        case 'generate-short-id':
            return handleGenerateShortId();
        
        case 'fallback-sites':
            return handleGetFallbackSites();
        
        case 'random-site':
            return handleRandomSite();
        
        case 'validate-site':
            if (request.method === 'POST') {
                return await handleValidateSite(request);
            }
            break;
        
        case 'fingerprints':
            return handleGetFingerprints();
        
        case 'singbox-config':
            return await handleSingboxConfig(request);
        
        case 'xray-config':
            return await handleXrayConfig(request);
        
        case 'xray-server-config':
            return await handleXrayServerConfig();
        
        case 'test':
            if (request.method === 'POST') {
                return await handleTest(request);
            }
            break;
        
        case 'status':
            return await handleStatus();
        
        default:
            return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
    }
    
    return jsonResponse({ error: 'متد پشتیبانی نمی‌شود' }, 405);
}

/**
 * دریافت کانفیگ Reality
 */
async function handleGetConfig() {
    const config = await getRealityConfig();
    
    // مخفی کردن کلید خصوصی
    const safeConfig = { ...config };
    if (safeConfig.privateKey) {
        safeConfig.privateKey = '***hidden***';
        safeConfig.hasPrivateKey = true;
    } else {
        safeConfig.hasPrivateKey = false;
    }
    
    return jsonResponse({
        success: true,
        config: safeConfig
    });
}

/**
 * ذخیره کانفیگ Reality
 */
async function handleSaveConfig(request) {
    try {
        const data = await request.json();
        
        const currentConfig = await getRealityConfig();
        const newConfig = {
            ...currentConfig,
            enabled: data.enabled !== undefined ? data.enabled : currentConfig.enabled,
            fallbackSite: data.fallbackSite || currentConfig.fallbackSite,
            fingerprint: data.fingerprint || currentConfig.fingerprint,
            shortId: data.shortId || currentConfig.shortId,
            publicKey: data.publicKey || currentConfig.publicKey,
            privateKey: data.privateKey || currentConfig.privateKey,
            spiderX: data.spiderX !== undefined ? data.spiderX : currentConfig.spiderX,
            show: data.show !== undefined ? data.show : currentConfig.show
        };
        
        await saveRealityConfig(newConfig);
        
        return jsonResponse({
            success: true,
            message: 'تنظیمات Reality ذخیره شد'
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تولید جفت کلید
 */
async function handleGenerateKeys() {
    try {
        const keyPair = await generateRealityKeyPair();
        
        // ذخیره در کانفیگ
        const config = await getRealityConfig();
        config.privateKey = keyPair.privateKey;
        config.publicKey = keyPair.publicKey;
        await saveRealityConfig(config);
        
        return jsonResponse({
            success: true,
            message: 'کلیدها تولید و ذخیره شدند',
            publicKey: keyPair.publicKey
            // کلید خصوصی را برنمی‌گردانیم برای امنیت
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تولید Short ID
 */
function handleGenerateShortId() {
    const shortId = generateShortId();
    
    return jsonResponse({
        success: true,
        shortId
    });
}

/**
 * لیست سایت‌های Fallback
 */
function handleGetFallbackSites() {
    const sites = getFallbackSites();
    
    return jsonResponse({
        success: true,
        sites
    });
}

/**
 * انتخاب تصادفی سایت
 */
function handleRandomSite() {
    const site = getRandomFallbackSite();
    
    return jsonResponse({
        success: true,
        site
    });
}

/**
 * اعتبارسنجی سایت Fallback
 */
async function handleValidateSite(request) {
    try {
        const data = await request.json();
        const domain = data.domain;
        
        if (!domain) {
            return jsonResponse({
                success: false,
                error: 'دامنه الزامی است'
            }, 400);
        }
        
        const result = await validateFallbackSite(domain);
        
        return jsonResponse({
            success: true,
            result
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * لیست Fingerprint ها
 */
function handleGetFingerprints() {
    const fingerprints = listFingerprints();
    
    return jsonResponse({
        success: true,
        fingerprints
    });
}

/**
 * تولید کانفیگ Sing-box
 */
async function handleSingboxConfig(request) {
    const url = new URL(request.url);
    const serverAddress = url.searchParams.get('server') || '';
    const serverPort = parseInt(url.searchParams.get('port') || '443');
    
    const config = await getRealityConfig();
    
    if (!config.enabled) {
        return jsonResponse({
            success: true,
            enabled: false,
            message: 'Reality غیرفعال است'
        });
    }
    
    const singboxConfig = generateSingboxRealityConfig(config, serverAddress, serverPort);
    
    return jsonResponse({
        success: true,
        outbound: singboxConfig
    });
}

/**
 * تولید کانفیگ Xray کلاینت
 */
async function handleXrayConfig(request) {
    const url = new URL(request.url);
    const serverAddress = url.searchParams.get('server') || '';
    const serverPort = parseInt(url.searchParams.get('port') || '443');
    
    const config = await getRealityConfig();
    
    if (!config.enabled) {
        return jsonResponse({
            success: true,
            enabled: false,
            message: 'Reality غیرفعال است'
        });
    }
    
    const xrayConfig = generateXrayRealityConfig(config, serverAddress, serverPort);
    
    return jsonResponse({
        success: true,
        outbound: xrayConfig
    });
}

/**
 * تولید کانفیگ Xray سرور
 */
async function handleXrayServerConfig() {
    const config = await getRealityConfig();
    
    if (!config.privateKey) {
        return jsonResponse({
            success: false,
            error: 'کلید خصوصی تنظیم نشده است'
        }, 400);
    }
    
    const serverConfig = generateXrayRealityServerConfig(config);
    
    return jsonResponse({
        success: true,
        inbound: serverConfig
    });
}

/**
 * تست اتصال Reality
 */
async function handleTest(request) {
    try {
        const data = await request.json();
        const serverAddress = data.server;
        
        if (!serverAddress) {
            return jsonResponse({
                success: false,
                error: 'آدرس سرور الزامی است'
            }, 400);
        }
        
        const config = await getRealityConfig();
        const result = await testRealityConnection(config, serverAddress);
        
        return jsonResponse({
            success: true,
            result
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * وضعیت Reality
 */
async function handleStatus() {
    const config = await getRealityConfig();
    
    return jsonResponse({
        success: true,
        status: {
            enabled: config.enabled,
            fallbackSite: config.fallbackSite,
            fingerprint: config.fingerprint,
            hasKeys: !!config.privateKey && !!config.publicKey,
            shortId: config.shortId || 'not set'
        }
    });
}
