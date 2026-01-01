// =============================================
// MozPN v3.0 - سیستم Smart Failover
// تغییر مسیر خودکار و Health Check
// فقط بین سرورهای همان کشور انتخابی
// =============================================

import { getConfigValue, setConfigValue } from './kvStore.js';

/**
 * تنظیمات پیش‌فرض Failover
 */
const DEFAULT_FAILOVER_CONFIG = {
    enabled: false,
    checkInterval: 600, // ثانیه (10 دقیقه - منطقی‌تر)
    timeout: 5000, // میلی‌ثانیه
    retries: 3,
    threshold: 3, // تعداد خطا قبل از تغییر (افزایش برای پایداری)
    testUrls: [
        'https://cp.cloudflare.com',
        'https://www.gstatic.com/generate_204'
    ],
    backupEndpoints: [],
    currentEndpointIndex: 0,
    lastCheck: 0,
    consecutiveFailures: 0,
    // تنظیمات جدید برای محدودیت کشور
    respectCountrySelection: true, // فقط بین سرورهای همان کشور
    countryGroups: {} // گروه‌بندی Endpoint ها بر اساس کشور
};

/**
 * ساختار Endpoint - با اضافه شدن کشور
 */
export function createEndpoint(options = {}) {
    return {
        address: options.address || '',
        port: options.port || 443,
        name: options.name || '',
        country: options.country || '', // کد کشور (مثلاً DE, NL, US)
        countryName: options.countryName || '', // نام کشور
        priority: options.priority || 0,
        weight: options.weight || 1,
        healthy: true,
        lastCheck: 0,
        latency: 0,
        failureCount: 0
    };
}

/**
 * گروه‌بندی Endpoint ها بر اساس کشور
 */
export function groupEndpointsByCountry(endpoints) {
    const groups = {};
    
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        const country = endpoint.country || 'UNKNOWN';
        
        if (!groups[country]) {
            groups[country] = [];
        }
        groups[country].push({ index: i, endpoint });
    }
    
    return groups;
}

/**
 * دریافت Endpoint های همان کشور
 */
export function getEndpointsForCountry(config, countryCode) {
    if (!countryCode) return config.backupEndpoints;
    
    return config.backupEndpoints.filter(e => 
        e.country === countryCode || !e.country
    );
}

/**
 * دریافت اندیس‌های Endpoint های همان کشور
 */
function getEndpointIndicesForCountry(config, countryCode) {
    const indices = [];
    
    for (let i = 0; i < config.backupEndpoints.length; i++) {
        const endpoint = config.backupEndpoints[i];
        if (endpoint.country === countryCode || !endpoint.country) {
            indices.push(i);
        }
    }
    
    return indices;
}

/**
 * دریافت کانفیگ Failover از KV
 */
export async function getFailoverConfig() {
    const configStr = getConfigValue('failoverConfig', '');
    if (!configStr) {
        return { ...DEFAULT_FAILOVER_CONFIG };
    }
    
    try {
        return { ...DEFAULT_FAILOVER_CONFIG, ...JSON.parse(configStr) };
    } catch {
        return { ...DEFAULT_FAILOVER_CONFIG };
    }
}

/**
 * ذخیره کانفیگ Failover
 */
export async function saveFailoverConfig(config) {
    await setConfigValue('failoverConfig', JSON.stringify(config));
    return config;
}

/**
 * تست سلامت یک Endpoint
 */
export async function checkEndpointHealth(endpoint, testUrl, timeout = 5000) {
    const start = Date.now();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(testUrl, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        clearTimeout(timeoutId);
        
        const latency = Date.now() - start;
        
        return {
            healthy: response.ok || response.status === 204,
            latency,
            status: response.status
        };
    } catch (error) {
        return {
            healthy: false,
            latency: Date.now() - start,
            error: error.message
        };
    }
}

/**
 * تست سلامت همه Endpoint ها
 */
export async function checkAllEndpoints(config) {
    const results = [];
    
    for (const endpoint of config.backupEndpoints) {
        const testResults = [];
        
        for (const testUrl of config.testUrls) {
            const result = await checkEndpointHealth(endpoint, testUrl, config.timeout);
            testResults.push(result);
        }
        
        // میانگین نتایج
        const healthyCount = testResults.filter(r => r.healthy).length;
        const avgLatency = testResults.reduce((sum, r) => sum + r.latency, 0) / testResults.length;
        
        results.push({
            endpoint,
            healthy: healthyCount >= testResults.length / 2,
            latency: Math.round(avgLatency),
            healthyCount,
            totalTests: testResults.length
        });
    }
    
    return results;
}

/**
 * انتخاب بهترین Endpoint
 */
export async function selectBestEndpoint(config) {
    const results = await checkAllEndpoints(config);
    
    // فیلتر Endpoint های سالم
    const healthyEndpoints = results.filter(r => r.healthy);
    
    if (healthyEndpoints.length === 0) {
        // اگر هیچ‌کدام سالم نیست، اولین را برگردان
        return config.backupEndpoints[0] || null;
    }
    
    // مرتب‌سازی بر اساس latency
    healthyEndpoints.sort((a, b) => a.latency - b.latency);
    
    // انتخاب با در نظر گرفتن weight
    const totalWeight = healthyEndpoints.reduce((sum, e) => sum + (e.endpoint.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const result of healthyEndpoints) {
        random -= result.endpoint.weight || 1;
        if (random <= 0) {
            return result.endpoint;
        }
    }
    
    return healthyEndpoints[0].endpoint;
}

/**
 * به‌روزرسانی وضعیت Endpoint
 */
export async function updateEndpointStatus(config, endpointIndex, healthy, latency = 0) {
    if (!config.backupEndpoints[endpointIndex]) return config;
    
    const endpoint = config.backupEndpoints[endpointIndex];
    endpoint.healthy = healthy;
    endpoint.lastCheck = Date.now();
    endpoint.latency = latency;
    
    if (!healthy) {
        endpoint.failureCount++;
    } else {
        endpoint.failureCount = 0;
    }
    
    await saveFailoverConfig(config);
    return config;
}

/**
 * تغییر به Endpoint بعدی - فقط در همان کشور
 */
export async function switchToNextEndpoint(config, currentCountry = null) {
    // اگر محدودیت کشور فعال است، فقط بین سرورهای همان کشور جابجا شو
    if (config.respectCountrySelection && currentCountry) {
        return await switchToNextEndpointInCountry(config, currentCountry);
    }
    
    const healthyEndpoints = config.backupEndpoints.filter(e => e.healthy);
    
    if (healthyEndpoints.length === 0) {
        // ریست همه و شروع از اول
        config.backupEndpoints.forEach(e => {
            e.healthy = true;
            e.failureCount = 0;
        });
        config.currentEndpointIndex = 0;
    } else {
        // پیدا کردن اندیس Endpoint سالم بعدی
        let nextIndex = (config.currentEndpointIndex + 1) % config.backupEndpoints.length;
        let attempts = 0;
        
        while (!config.backupEndpoints[nextIndex].healthy && attempts < config.backupEndpoints.length) {
            nextIndex = (nextIndex + 1) % config.backupEndpoints.length;
            attempts++;
        }
        
        config.currentEndpointIndex = nextIndex;
    }
    
    config.consecutiveFailures = 0;
    await saveFailoverConfig(config);
    
    return config.backupEndpoints[config.currentEndpointIndex];
}

/**
 * تغییر به Endpoint بعدی فقط در همان کشور
 * این تابع تضمین میکنه که کاربر همیشه IP همون کشوری که انتخاب کرده رو بگیره
 */
async function switchToNextEndpointInCountry(config, countryCode) {
    // پیدا کردن همه Endpoint های این کشور
    const countryIndices = getEndpointIndicesForCountry(config, countryCode);
    
    if (countryIndices.length === 0) {
        console.log(`هیچ Endpoint برای کشور ${countryCode} یافت نشد`);
        return null;
    }
    
    // پیدا کردن Endpoint های سالم در این کشور
    const healthyIndices = countryIndices.filter(i => config.backupEndpoints[i].healthy);
    
    if (healthyIndices.length === 0) {
        // همه Endpoint های این کشور خراب هستند - ریست کن
        console.log(`همه Endpoint های کشور ${countryCode} خراب هستند، ریست میشوند`);
        countryIndices.forEach(i => {
            config.backupEndpoints[i].healthy = true;
            config.backupEndpoints[i].failureCount = 0;
        });
        config.currentEndpointIndex = countryIndices[0];
    } else {
        // پیدا کردن Endpoint سالم بعدی در همین کشور
        const currentIndexInCountry = countryIndices.indexOf(config.currentEndpointIndex);
        let nextIndexInCountry = (currentIndexInCountry + 1) % countryIndices.length;
        let attempts = 0;
        
        while (!config.backupEndpoints[countryIndices[nextIndexInCountry]].healthy && 
               attempts < countryIndices.length) {
            nextIndexInCountry = (nextIndexInCountry + 1) % countryIndices.length;
            attempts++;
        }
        
        config.currentEndpointIndex = countryIndices[nextIndexInCountry];
    }
    
    config.consecutiveFailures = 0;
    await saveFailoverConfig(config);
    
    const newEndpoint = config.backupEndpoints[config.currentEndpointIndex];
    console.log(`Failover: تغییر به ${newEndpoint.name} در کشور ${countryCode}`);
    
    return newEndpoint;
}

/**
 * ثبت خطا و بررسی نیاز به تغییر - با رعایت کشور
 */
export async function recordFailure(config, currentCountry = null) {
    config.consecutiveFailures++;
    
    if (config.consecutiveFailures >= config.threshold) {
        // علامت‌گذاری Endpoint فعلی به عنوان ناسالم
        if (config.backupEndpoints[config.currentEndpointIndex]) {
            config.backupEndpoints[config.currentEndpointIndex].healthy = false;
        }
        
        // تغییر به Endpoint بعدی - با رعایت کشور
        const newEndpoint = await switchToNextEndpoint(config, currentCountry);
        
        return {
            switched: true,
            newEndpoint,
            reason: 'consecutive_failures',
            country: currentCountry
        };
    }
    
    await saveFailoverConfig(config);
    
    return {
        switched: false,
        consecutiveFailures: config.consecutiveFailures
    };
}

/**
 * ثبت موفقیت
 */
export async function recordSuccess(config) {
    config.consecutiveFailures = 0;
    config.lastCheck = Date.now();
    
    if (config.backupEndpoints[config.currentEndpointIndex]) {
        config.backupEndpoints[config.currentEndpointIndex].healthy = true;
        config.backupEndpoints[config.currentEndpointIndex].failureCount = 0;
    }
    
    await saveFailoverConfig(config);
}

/**
 * دریافت Endpoint فعلی
 */
export function getCurrentEndpoint(config) {
    return config.backupEndpoints[config.currentEndpointIndex] || null;
}

/**
 * افزودن Endpoint جدید - با کشور
 */
export async function addEndpoint(config, endpoint) {
    const newEndpoint = createEndpoint(endpoint);
    config.backupEndpoints.push(newEndpoint);
    
    // به‌روزرسانی گروه‌بندی کشورها
    config.countryGroups = groupEndpointsByCountry(config.backupEndpoints);
    
    await saveFailoverConfig(config);
    return newEndpoint;
}

/**
 * حذف Endpoint
 */
export async function removeEndpoint(config, index) {
    if (index < 0 || index >= config.backupEndpoints.length) {
        throw new Error('اندیس نامعتبر');
    }
    
    config.backupEndpoints.splice(index, 1);
    
    // تنظیم اندیس فعلی
    if (config.currentEndpointIndex >= config.backupEndpoints.length) {
        config.currentEndpointIndex = Math.max(0, config.backupEndpoints.length - 1);
    }
    
    // به‌روزرسانی گروه‌بندی کشورها
    config.countryGroups = groupEndpointsByCountry(config.backupEndpoints);
    
    await saveFailoverConfig(config);
}

/**
 * دریافت آمار Failover - با جزئیات کشور
 */
export function getFailoverStats(config) {
    const totalEndpoints = config.backupEndpoints.length;
    const healthyEndpoints = config.backupEndpoints.filter(e => e.healthy).length;
    const avgLatency = config.backupEndpoints.length > 0
        ? config.backupEndpoints.reduce((sum, e) => sum + (e.latency || 0), 0) / totalEndpoints
        : 0;
    
    // آمار به تفکیک کشور
    const countryStats = {};
    const groups = groupEndpointsByCountry(config.backupEndpoints);
    
    for (const [country, endpoints] of Object.entries(groups)) {
        const healthy = endpoints.filter(e => e.endpoint.healthy).length;
        countryStats[country] = {
            total: endpoints.length,
            healthy,
            unhealthy: endpoints.length - healthy
        };
    }
    
    return {
        totalEndpoints,
        healthyEndpoints,
        unhealthyEndpoints: totalEndpoints - healthyEndpoints,
        currentEndpoint: getCurrentEndpoint(config),
        currentEndpointIndex: config.currentEndpointIndex,
        consecutiveFailures: config.consecutiveFailures,
        lastCheck: config.lastCheck,
        avgLatency: Math.round(avgLatency),
        enabled: config.enabled,
        respectCountrySelection: config.respectCountrySelection,
        countryStats
    };
}

/**
 * تولید کانفیگ Load Balancer برای Sing-box
 */
export function generateSingboxLoadBalancer(config, outboundTag = 'proxy') {
    if (!config.enabled || config.backupEndpoints.length === 0) {
        return null;
    }
    
    const outbounds = config.backupEndpoints.map((endpoint, index) => ({
        type: 'direct',
        tag: `endpoint-${index}`,
        override_address: endpoint.address,
        override_port: endpoint.port
    }));
    
    return {
        outbounds,
        selector: {
            type: 'selector',
            tag: outboundTag,
            outbounds: outbounds.map(o => o.tag),
            default: outbounds[config.currentEndpointIndex]?.tag || outbounds[0]?.tag
        }
    };
}

/**
 * تولید کانفیگ Load Balancer برای Xray
 */
export function generateXrayLoadBalancer(config, tag = 'balancer') {
    if (!config.enabled || config.backupEndpoints.length === 0) {
        return null;
    }
    
    return {
        tag,
        selector: config.backupEndpoints.map((_, index) => `endpoint-${index}`),
        strategy: {
            type: 'leastPing'
        }
    };
}

/**
 * Cron Handler برای Health Check
 * این تابع باید در scheduled event فراخوانی شود
 * فقط بین سرورهای همان کشور جابجا میکند
 */
export async function scheduledHealthCheck(env) {
    try {
        // راه‌اندازی KV
        if (!env.C) {
            console.log('KV not available for health check');
            return { skipped: true, reason: 'no_kv' };
        }
        
        const config = await getFailoverConfig();
        
        if (!config.enabled || config.backupEndpoints.length === 0) {
            return { skipped: true, reason: 'disabled or no endpoints' };
        }
        
        // بررسی زمان آخرین چک
        const now = Date.now();
        const timeSinceLastCheck = now - config.lastCheck;
        
        if (timeSinceLastCheck < config.checkInterval * 1000) {
            return { skipped: true, reason: 'too soon' };
        }
        
        // اجرای Health Check
        const results = await checkAllEndpoints(config);
        
        // به‌روزرسانی وضعیت
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            config.backupEndpoints[i].healthy = result.healthy;
            config.backupEndpoints[i].latency = result.latency;
            config.backupEndpoints[i].lastCheck = now;
            
            if (!result.healthy) {
                config.backupEndpoints[i].failureCount++;
            } else {
                config.backupEndpoints[i].failureCount = 0;
            }
        }
        
        // بررسی Endpoint فعلی - با رعایت کشور
        const currentEndpoint = config.backupEndpoints[config.currentEndpointIndex];
        if (currentEndpoint && !currentEndpoint.healthy) {
            // فقط بین سرورهای همان کشور جابجا شو
            const currentCountry = currentEndpoint.country;
            await switchToNextEndpoint(config, currentCountry);
        }
        
        // به‌روزرسانی گروه‌بندی کشورها
        config.countryGroups = groupEndpointsByCountry(config.backupEndpoints);
        config.lastCheck = now;
        await saveFailoverConfig(config);
        
        return {
            success: true,
            results,
            currentEndpoint: getCurrentEndpoint(config),
            countryStats: getFailoverStats(config).countryStats
        };
    } catch (error) {
        console.error('خطا در Health Check:', error);
        return { success: false, error: error.message };
    }
}

/**
 * انتخاب بهترین Endpoint برای یک کشور خاص
 */
export async function selectBestEndpointForCountry(config, countryCode) {
    const countryEndpoints = getEndpointsForCountry(config, countryCode);
    
    if (countryEndpoints.length === 0) {
        return null;
    }
    
    // فیلتر سالم‌ها
    const healthyEndpoints = countryEndpoints.filter(e => e.healthy);
    
    if (healthyEndpoints.length === 0) {
        // همه خراب هستند، اولین را برگردان
        return countryEndpoints[0];
    }
    
    // مرتب‌سازی بر اساس latency
    healthyEndpoints.sort((a, b) => (a.latency || 9999) - (b.latency || 9999));
    
    return healthyEndpoints[0];
}
