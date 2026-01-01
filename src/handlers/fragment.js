// =============================================
// MozPN v3.0 - API مدیریت Fragment
// =============================================

import {
    getFragmentConfig,
    saveFragmentConfig,
    createFragmentConfig,
    generateSingboxFragmentConfig,
    generateXrayFragmentConfig,
    getFragmentPreset,
    listFragmentPresets,
    FRAGMENT_PRESETS
} from '../services/fragmentManager.js';
import { jsonResponse } from '../utils/helpers.js';

/**
 * API مدیریت Fragment
 */
export async function handleFragmentAPI(request) {
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
        
        case 'presets':
            return handleGetPresets();
        
        case 'apply-preset':
            if (request.method === 'POST') {
                return await handleApplyPreset(request);
            }
            break;
        
        case 'singbox-config':
            return await handleSingboxConfig();
        
        case 'xray-config':
            return await handleXrayConfig();
        
        case 'status':
            return await handleStatus();
        
        case 'test':
            if (request.method === 'POST') {
                return await handleTest(request);
            }
            break;
        
        default:
            return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
    }
    
    return jsonResponse({ error: 'متد پشتیبانی نمی‌شود' }, 405);
}

/**
 * دریافت کانفیگ Fragment
 */
async function handleGetConfig() {
    const config = await getFragmentConfig();
    
    return jsonResponse({
        success: true,
        config
    });
}

/**
 * ذخیره کانفیگ Fragment
 */
async function handleSaveConfig(request) {
    try {
        const data = await request.json();
        
        // اعتبارسنجی
        if (data.length && !isValidRange(data.length)) {
            return jsonResponse({
                success: false,
                error: 'فرمت length نامعتبر است (مثال: 100-200)'
            }, 400);
        }
        
        if (data.interval && !isValidRange(data.interval)) {
            return jsonResponse({
                success: false,
                error: 'فرمت interval نامعتبر است (مثال: 10-20)'
            }, 400);
        }
        
        const currentConfig = await getFragmentConfig();
        const newConfig = {
            ...currentConfig,
            ...data
        };
        
        await saveFragmentConfig(newConfig);
        
        return jsonResponse({
            success: true,
            message: 'تنظیمات Fragment ذخیره شد',
            config: newConfig
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * لیست پیش‌تنظیمات
 */
function handleGetPresets() {
    const presets = listFragmentPresets();
    
    return jsonResponse({
        success: true,
        presets,
        descriptions: {
            iran_mci: 'بهینه برای همراه اول',
            iran_irancell: 'بهینه برای ایرانسل',
            iran_mokhaberat: 'بهینه برای مخابرات',
            china_gfw: 'بهینه برای چین (GFW)',
            default: 'تنظیمات پیش‌فرض',
            aggressive: 'حالت تهاجمی (برای فیلترینگ شدید)'
        }
    });
}

/**
 * اعمال پیش‌تنظیم
 */
async function handleApplyPreset(request) {
    try {
        const data = await request.json();
        const presetName = data.preset || 'default';
        
        const preset = getFragmentPreset(presetName);
        
        if (!preset) {
            return jsonResponse({
                success: false,
                error: 'پیش‌تنظیم یافت نشد'
            }, 404);
        }
        
        await saveFragmentConfig(preset);
        
        return jsonResponse({
            success: true,
            message: `پیش‌تنظیم ${presetName} اعمال شد`,
            config: preset
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تولید کانفیگ Sing-box
 */
async function handleSingboxConfig() {
    const config = await getFragmentConfig();
    const singboxConfig = generateSingboxFragmentConfig(config);
    
    if (!singboxConfig) {
        return jsonResponse({
            success: true,
            enabled: false,
            message: 'Fragment غیرفعال است'
        });
    }
    
    return jsonResponse({
        success: true,
        fragment: singboxConfig
    });
}

/**
 * تولید کانفیگ Xray
 */
async function handleXrayConfig() {
    const config = await getFragmentConfig();
    const xrayConfig = generateXrayFragmentConfig(config);
    
    if (!xrayConfig) {
        return jsonResponse({
            success: true,
            enabled: false,
            message: 'Fragment غیرفعال است'
        });
    }
    
    return jsonResponse({
        success: true,
        fragment: xrayConfig
    });
}

/**
 * وضعیت Fragment
 */
async function handleStatus() {
    const config = await getFragmentConfig();
    
    return jsonResponse({
        success: true,
        status: {
            enabled: config.enabled,
            mode: config.mode,
            length: config.length,
            interval: config.interval
        }
    });
}

/**
 * تست Fragment
 */
async function handleTest(request) {
    try {
        const data = await request.json();
        const testData = data.data || 'Hello, World!';
        
        const config = await getFragmentConfig();
        
        if (!config.enabled) {
            return jsonResponse({
                success: true,
                message: 'Fragment غیرفعال است',
                fragments: [testData]
            });
        }
        
        // شبیه‌سازی تکه‌تکه کردن
        const { fragmentData } = await import('../services/fragmentManager.js');
        const dataBytes = new TextEncoder().encode(testData);
        const fragments = fragmentData(dataBytes, config);
        
        return jsonResponse({
            success: true,
            originalSize: dataBytes.length,
            fragmentCount: fragments.length,
            fragments: fragments.map((f, i) => ({
                index: i,
                size: f.length,
                preview: new TextDecoder().decode(f.slice(0, 20)) + (f.length > 20 ? '...' : '')
            }))
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * اعتبارسنجی فرمت محدوده
 */
function isValidRange(rangeStr) {
    if (!rangeStr || typeof rangeStr !== 'string') return false;
    
    const pattern = /^\d+(-\d+)?$/;
    return pattern.test(rangeStr.trim());
}
