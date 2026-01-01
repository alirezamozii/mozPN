// =============================================
// MozPN v3.0 - API مدیریت Failover
// =============================================

import {
    getFailoverConfig,
    saveFailoverConfig,
    createEndpoint,
    checkEndpointHealth,
    checkAllEndpoints,
    selectBestEndpoint,
    switchToNextEndpoint,
    getCurrentEndpoint,
    addEndpoint,
    removeEndpoint,
    getFailoverStats,
    generateSingboxLoadBalancer,
    generateXrayLoadBalancer,
    scheduledHealthCheck
} from '../services/failoverManager.js';
import { jsonResponse } from '../utils/helpers.js';

/**
 * API مدیریت Failover
 */
export async function handleFailoverAPI(request, env) {
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
        
        case 'endpoints':
            if (request.method === 'GET') {
                return await handleGetEndpoints();
            } else if (request.method === 'POST') {
                return await handleAddEndpoint(request);
            }
            break;
        
        case 'remove-endpoint':
            if (request.method === 'POST') {
                return await handleRemoveEndpoint(request);
            }
            break;
        
        case 'health-check':
            if (request.method === 'POST') {
                return await handleHealthCheck();
            }
            break;
        
        case 'check-endpoint':
            if (request.method === 'POST') {
                return await handleCheckEndpoint(request);
            }
            break;
        
        case 'best-endpoint':
            return await handleBestEndpoint();
        
        case 'switch':
            if (request.method === 'POST') {
                return await handleSwitch();
            }
            break;
        
        case 'stats':
            return await handleStats();
        
        case 'singbox-config':
            return await handleSingboxConfig();
        
        case 'xray-config':
            return await handleXrayConfig();
        
        case 'status':
            return await handleStatus();
        
        default:
            return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
    }
    
    return jsonResponse({ error: 'متد پشتیبانی نمی‌شود' }, 405);
}

/**
 * دریافت کانفیگ Failover
 */
async function handleGetConfig() {
    const config = await getFailoverConfig();
    
    return jsonResponse({
        success: true,
        config
    });
}

/**
 * ذخیره کانفیگ Failover
 */
async function handleSaveConfig(request) {
    try {
        const data = await request.json();
        
        const currentConfig = await getFailoverConfig();
        const newConfig = {
            ...currentConfig,
            enabled: data.enabled !== undefined ? data.enabled : currentConfig.enabled,
            checkInterval: data.checkInterval || currentConfig.checkInterval,
            timeout: data.timeout || currentConfig.timeout,
            retries: data.retries || currentConfig.retries,
            threshold: data.threshold || currentConfig.threshold,
            testUrls: data.testUrls || currentConfig.testUrls
        };
        
        await saveFailoverConfig(newConfig);
        
        return jsonResponse({
            success: true,
            message: 'تنظیمات Failover ذخیره شد',
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
 * لیست Endpoint ها
 */
async function handleGetEndpoints() {
    const config = await getFailoverConfig();
    
    return jsonResponse({
        success: true,
        endpoints: config.backupEndpoints,
        currentIndex: config.currentEndpointIndex
    });
}

/**
 * افزودن Endpoint
 */
async function handleAddEndpoint(request) {
    try {
        const data = await request.json();
        
        if (!data.address) {
            return jsonResponse({
                success: false,
                error: 'آدرس الزامی است'
            }, 400);
        }
        
        const config = await getFailoverConfig();
        const endpoint = await addEndpoint(config, {
            address: data.address,
            port: data.port || 443,
            name: data.name || data.address,
            priority: data.priority || 0,
            weight: data.weight || 1
        });
        
        return jsonResponse({
            success: true,
            message: 'Endpoint اضافه شد',
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
 * حذف Endpoint
 */
async function handleRemoveEndpoint(request) {
    try {
        const data = await request.json();
        const index = data.index;
        
        if (index === undefined || index < 0) {
            return jsonResponse({
                success: false,
                error: 'اندیس نامعتبر است'
            }, 400);
        }
        
        const config = await getFailoverConfig();
        await removeEndpoint(config, index);
        
        return jsonResponse({
            success: true,
            message: 'Endpoint حذف شد'
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * اجرای Health Check
 */
async function handleHealthCheck() {
    try {
        const config = await getFailoverConfig();
        
        if (config.backupEndpoints.length === 0) {
            return jsonResponse({
                success: false,
                error: 'هیچ Endpoint تعریف نشده است'
            }, 400);
        }
        
        const results = await checkAllEndpoints(config);
        
        // به‌روزرسانی وضعیت
        for (let i = 0; i < results.length; i++) {
            config.backupEndpoints[i].healthy = results[i].healthy;
            config.backupEndpoints[i].latency = results[i].latency;
            config.backupEndpoints[i].lastCheck = Date.now();
        }
        
        config.lastCheck = Date.now();
        await saveFailoverConfig(config);
        
        return jsonResponse({
            success: true,
            results,
            summary: {
                total: results.length,
                healthy: results.filter(r => r.healthy).length,
                unhealthy: results.filter(r => !r.healthy).length
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تست یک Endpoint خاص
 */
async function handleCheckEndpoint(request) {
    try {
        const data = await request.json();
        const address = data.address;
        const testUrl = data.testUrl || 'https://www.google.com/generate_204';
        const timeout = data.timeout || 5000;
        
        if (!address) {
            return jsonResponse({
                success: false,
                error: 'آدرس الزامی است'
            }, 400);
        }
        
        const result = await checkEndpointHealth({ address }, testUrl, timeout);
        
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
 * انتخاب بهترین Endpoint
 */
async function handleBestEndpoint() {
    try {
        const config = await getFailoverConfig();
        
        if (config.backupEndpoints.length === 0) {
            return jsonResponse({
                success: false,
                error: 'هیچ Endpoint تعریف نشده است'
            }, 400);
        }
        
        const best = await selectBestEndpoint(config);
        
        return jsonResponse({
            success: true,
            endpoint: best
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تغییر به Endpoint بعدی
 */
async function handleSwitch() {
    try {
        const config = await getFailoverConfig();
        
        if (config.backupEndpoints.length === 0) {
            return jsonResponse({
                success: false,
                error: 'هیچ Endpoint تعریف نشده است'
            }, 400);
        }
        
        const newEndpoint = await switchToNextEndpoint(config);
        
        return jsonResponse({
            success: true,
            message: 'به Endpoint جدید تغییر یافت',
            endpoint: newEndpoint,
            newIndex: config.currentEndpointIndex
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * آمار Failover
 */
async function handleStats() {
    const config = await getFailoverConfig();
    const stats = getFailoverStats(config);
    
    return jsonResponse({
        success: true,
        stats
    });
}

/**
 * تولید کانفیگ Sing-box
 */
async function handleSingboxConfig() {
    const config = await getFailoverConfig();
    const singboxConfig = generateSingboxLoadBalancer(config);
    
    if (!singboxConfig) {
        return jsonResponse({
            success: true,
            enabled: false,
            message: 'Failover غیرفعال است یا Endpoint تعریف نشده'
        });
    }
    
    return jsonResponse({
        success: true,
        ...singboxConfig
    });
}

/**
 * تولید کانفیگ Xray
 */
async function handleXrayConfig() {
    const config = await getFailoverConfig();
    const xrayConfig = generateXrayLoadBalancer(config);
    
    if (!xrayConfig) {
        return jsonResponse({
            success: true,
            enabled: false,
            message: 'Failover غیرفعال است یا Endpoint تعریف نشده'
        });
    }
    
    return jsonResponse({
        success: true,
        balancer: xrayConfig
    });
}

/**
 * وضعیت Failover
 */
async function handleStatus() {
    const config = await getFailoverConfig();
    const current = getCurrentEndpoint(config);
    
    return jsonResponse({
        success: true,
        status: {
            enabled: config.enabled,
            endpointCount: config.backupEndpoints.length,
            currentEndpoint: current,
            consecutiveFailures: config.consecutiveFailures,
            lastCheck: config.lastCheck,
            checkInterval: config.checkInterval
        }
    });
}
