// =============================================
// MozPN v3.0 - API مدیریت WARP
// =============================================

import {
    getWarpConfig,
    saveWarpConfig,
    createWarpConfig,
    registerWarpDevice,
    upgradeToWarpPlus,
    getWarpAccountInfo,
    claimReferralBonus,
    claimMultipleReferrals,
    getBestWarpEndpoint,
    generateWireGuardConfig,
    generateSingboxWarpOutbound,
    generateXrayWarpOutbound,
    getWarpEndpoints,
    isValidWireGuardKey,
    getWarpEndpointByCountry,
    getWarpCountries
} from '../services/warpManager.js';
import { jsonResponse } from '../utils/helpers.js';

/**
 * API مدیریت WARP
 */
export async function handleWarpAPI(request) {
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
        
        case 'register':
            if (request.method === 'POST') {
                return await handleRegister();
            }
            break;
        
        case 'auto-setup':
            if (request.method === 'POST') {
                return await handleAutoSetup();
            }
            break;
        
        case 'upgrade':
            if (request.method === 'POST') {
                return await handleUpgrade(request);
            }
            break;
        
        case 'get-free-gb':
            if (request.method === 'POST') {
                return await handleGetFreeGB(request);
            }
            break;
        
        case 'account-info':
            return await handleAccountInfo();
        
        case 'best-endpoint':
            return await handleBestEndpoint();
        
        case 'endpoints':
            return handleGetEndpoints();
        
        case 'countries':
            return handleGetCountries();
        
        case 'set-country':
            if (request.method === 'POST') {
                return await handleSetCountry(request);
            }
            break;
        
        case 'wireguard-config':
            return await handleWireGuardConfig(request);
        
        case 'singbox-config':
            return await handleSingboxConfig();
        
        case 'xray-config':
            return await handleXrayConfig();
        
        case 'validate-key':
            return await handleValidateKey(request);
        
        case 'status':
            return await handleStatus();
        
        default:
            return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
    }
    
    return jsonResponse({ error: 'متد پشتیبانی نمی‌شود' }, 405);
}

/**
 * دریافت کانفیگ WARP
 */
async function handleGetConfig() {
    const config = await getWarpConfig();
    
    // مخفی کردن کلید خصوصی در خروجی
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
 * ذخیره کانفیگ WARP
 */
async function handleSaveConfig(request) {
    try {
        const data = await request.json();
        
        // اعتبارسنجی
        if (data.privateKey && !isValidWireGuardKey(data.privateKey)) {
            return jsonResponse({
                success: false,
                error: 'کلید خصوصی نامعتبر است'
            }, 400);
        }
        
        if (data.publicKey && !isValidWireGuardKey(data.publicKey)) {
            return jsonResponse({
                success: false,
                error: 'کلید عمومی نامعتبر است'
            }, 400);
        }
        
        const currentConfig = await getWarpConfig();
        const newConfig = {
            ...currentConfig,
            ...data,
            // اگر کلید خصوصی ارسال نشده، قبلی را نگه دار
            privateKey: data.privateKey || currentConfig.privateKey
        };
        
        await saveWarpConfig(newConfig);
        
        return jsonResponse({
            success: true,
            message: 'تنظیمات WARP ذخیره شد'
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * ثبت‌نام دستگاه جدید
 */
async function handleRegister() {
    try {
        const result = await registerWarpDevice();
        
        if (!result.success) {
            return jsonResponse({
                success: false,
                error: result.error || 'خطا در ثبت‌نام'
            }, 500);
        }
        
        // ذخیره کانفیگ جدید
        const config = createWarpConfig({
            privateKey: result.privateKey,
            publicKey: result.publicKey,
            reserved: result.reserved,
            enabled: true
        });
        
        // اضافه کردن اطلاعات اکانت
        config.accountId = result.accountId;
        config.token = result.token;
        config.clientId = result.clientId;
        
        await saveWarpConfig(config);
        
        return jsonResponse({
            success: true,
            message: 'اکانت WARP با موفقیت ساخته شد! 🎉',
            accountId: result.accountId,
            hasPrivateKey: true
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * راه‌اندازی خودکار WARP - یک کلیک!
 */
async function handleAutoSetup() {
    try {
        // چک کن آیا قبلاً اکانت داریم
        const existingConfig = await getWarpConfig();
        if (existingConfig.privateKey && existingConfig.accountId) {
            return jsonResponse({
                success: true,
                message: 'اکانت WARP قبلاً ساخته شده',
                alreadyExists: true,
                accountId: existingConfig.accountId
            });
        }
        
        // ثبت‌نام جدید
        const result = await registerWarpDevice();
        
        if (!result.success) {
            return jsonResponse({
                success: false,
                error: result.error || 'خطا در ساخت اکانت'
            }, 500);
        }
        
        // ذخیره کامل
        const config = createWarpConfig({
            privateKey: result.privateKey,
            publicKey: result.publicKey,
            reserved: result.reserved,
            enabled: true,
            mode: 'proxy'
        });
        
        config.accountId = result.accountId;
        config.token = result.token;
        config.clientId = result.clientId;
        config.installId = result.installId;
        config.createdAt = result.createdAt;
        config.accountType = 'free';
        
        await saveWarpConfig(config);
        
        return jsonResponse({
            success: true,
            message: '✅ اکانت WARP رایگان ساخته شد!',
            accountId: result.accountId,
            accountType: 'free',
            note: 'برای ارتقا به WARP+ از API /upgrade استفاده کنید'
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * ارتقا به WARP+
 */
async function handleUpgrade(request) {
    try {
        const data = await request.json();
        const licenseKey = data.license || data.key || '';
        
        if (!licenseKey) {
            return jsonResponse({
                success: false,
                error: 'لایسنس WARP+ الزامی است'
            }, 400);
        }
        
        const config = await getWarpConfig();
        
        if (!config.accountId || !config.token) {
            return jsonResponse({
                success: false,
                error: 'ابتدا باید اکانت WARP بسازید (از /auto-setup استفاده کنید)'
            }, 400);
        }
        
        const result = await upgradeToWarpPlus(config.accountId, config.token, licenseKey);
        
        if (!result.success) {
            return jsonResponse({
                success: false,
                error: result.error || 'خطا در ارتقا'
            }, 500);
        }
        
        // به‌روزرسانی کانفیگ
        config.accountType = result.accountType;
        config.warpPlus = result.warpPlus;
        config.premiumData = result.premiumData;
        config.licenseKey = licenseKey;
        
        await saveWarpConfig(config);
        
        return jsonResponse({
            success: true,
            message: '🎉 ارتقا به WARP+ موفق بود!',
            accountType: result.accountType,
            warpPlus: result.warpPlus,
            premiumData: result.premiumData
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * دریافت اطلاعات اکانت
 */
async function handleAccountInfo() {
    try {
        const config = await getWarpConfig();
        
        if (!config.accountId || !config.token) {
            return jsonResponse({
                success: false,
                error: 'اکانت WARP یافت نشد',
                hasAccount: false
            });
        }
        
        const info = await getWarpAccountInfo(config.accountId, config.token);
        
        return jsonResponse({
            success: true,
            hasAccount: true,
            accountId: config.accountId,
            ...info
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * گرفتن گیگابایت رایگان WARP+
 */
async function handleGetFreeGB(request) {
    try {
        const config = await getWarpConfig();
        
        if (!config.accountId || !config.token) {
            return jsonResponse({
                success: false,
                error: 'ابتدا اکانت WARP بسازید'
            }, 400);
        }
        
        // تعداد گیگابایت درخواستی
        let count = 5;
        try {
            const data = await request.json();
            count = Math.min(parseInt(data.count) || 5, 20); // حداکثر 20
        } catch {}
        
        const result = await claimMultipleReferrals(config.accountId, config.token, count);
        
        if (result.success) {
            // به‌روزرسانی اطلاعات اکانت
            const info = await getWarpAccountInfo(config.accountId, config.token);
            config.premiumData = info.premiumData || 0;
            config.warpPlus = info.warpPlus || false;
            await saveWarpConfig(config);
            
            return jsonResponse({
                success: true,
                message: `🎉 ${result.totalGB}GB رایگان اضافه شد!`,
                totalGB: result.totalGB,
                currentQuota: info.premiumData,
                warpPlus: info.warpPlus
            });
        } else {
            return jsonResponse({
                success: false,
                error: 'خطا در گرفتن گیگابایت رایگان',
                details: result.details
            }, 500);
        }
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * دریافت بهترین Endpoint
 */
async function handleBestEndpoint() {
    try {
        const endpoint = await getBestWarpEndpoint();
        
        return jsonResponse({
            success: true,
            endpoint
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * لیست Endpoint ها
 */
function handleGetEndpoints() {
    return jsonResponse({
        success: true,
        endpoints: getWarpEndpoints()
    });
}

/**
 * تولید کانفیگ WireGuard
 */
async function handleWireGuardConfig(request) {
    const config = await getWarpConfig();
    
    if (!config.privateKey) {
        return jsonResponse({
            success: false,
            error: 'کلید خصوصی تنظیم نشده است'
        }, 400);
    }
    
    const url = new URL(request.url);
    const dns = url.searchParams.get('dns') || '1.1.1.1, 1.0.0.1';
    
    const wgConfig = generateWireGuardConfig(config, { dns });
    
    return new Response(wgConfig, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': 'attachment; filename="warp.conf"'
        }
    });
}

/**
 * تولید کانفیگ Sing-box
 */
async function handleSingboxConfig() {
    const config = await getWarpConfig();
    
    if (!config.privateKey) {
        return jsonResponse({
            success: false,
            error: 'کلید خصوصی تنظیم نشده است'
        }, 400);
    }
    
    const outbound = generateSingboxWarpOutbound(config);
    
    return jsonResponse({
        success: true,
        outbound
    });
}

/**
 * تولید کانفیگ Xray
 */
async function handleXrayConfig() {
    const config = await getWarpConfig();
    
    if (!config.privateKey) {
        return jsonResponse({
            success: false,
            error: 'کلید خصوصی تنظیم نشده است'
        }, 400);
    }
    
    const outbound = generateXrayWarpOutbound(config);
    
    return jsonResponse({
        success: true,
        outbound
    });
}

/**
 * اعتبارسنجی کلید
 */
async function handleValidateKey(request) {
    try {
        const data = await request.json();
        const key = data.key || '';
        
        const valid = isValidWireGuardKey(key);
        
        return jsonResponse({
            success: true,
            valid,
            message: valid ? 'کلید معتبر است' : 'کلید نامعتبر است'
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * وضعیت WARP
 */
async function handleStatus() {
    const config = await getWarpConfig();
    
    return jsonResponse({
        success: true,
        status: {
            enabled: config.enabled,
            mode: config.mode,
            hasPrivateKey: !!config.privateKey,
            endpoint: config.endpoint,
            country: config.country || 'AUTO',
            mtu: config.mtu
        }
    });
}

/**
 * لیست کشورهای WARP
 */
function handleGetCountries() {
    return jsonResponse({
        success: true,
        countries: getWarpCountries()
    });
}

/**
 * تنظیم کشور WARP
 */
async function handleSetCountry(request) {
    try {
        const data = await request.json();
        const countryCode = data.country || 'AUTO';
        
        const config = await getWarpConfig();
        const newEndpoint = getWarpEndpointByCountry(countryCode);
        
        config.endpoint = newEndpoint;
        config.country = countryCode;
        
        await saveWarpConfig(config);
        
        return jsonResponse({
            success: true,
            message: `کشور WARP به ${countryCode} تغییر کرد`,
            endpoint: newEndpoint,
            country: countryCode
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}
