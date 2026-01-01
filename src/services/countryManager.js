// =============================================
// MozPN - مدیریت مرکزی کشورها
// همه سرویس‌ها از این استفاده میکنن
// =============================================

import { getSelectedCountries, getConfigValue } from './kvStore.js';
import { DEFAULT_PROXY_IPS, REGION_CONFIG } from '../config/constants.js';

/**
 * دریافت کشورهای انتخاب‌شده با تمام اطلاعات
 * این تابع اصلی هست که همه جا باید ازش استفاده بشه
 */
export function getActiveCountries() {
    const selected = getSelectedCountries();
    
    // اگه هیچی انتخاب نشده، پیش‌فرض‌ها رو برگردون
    if (!selected || selected.length === 0) {
        return getDefaultCountries();
    }
    
    return selected.map(country => enrichCountryData(country));
}

/**
 * کشورهای پیش‌فرض (اگه کاربر چیزی انتخاب نکرده)
 */
export function getDefaultCountries() {
    return [
        { code: 'DE', name: 'آلمان', emoji: '🇩🇪', ipCount: 2 },
        { code: 'NL', name: 'هلند', emoji: '🇳🇱', ipCount: 2 },
        { code: 'US', name: 'آمریکا', emoji: '🇺🇸', ipCount: 2 },
        { code: 'SG', name: 'سنگاپور', emoji: '🇸🇬', ipCount: 2 }
    ].map(c => enrichCountryData(c));
}

/**
 * تکمیل اطلاعات کشور
 */
function enrichCountryData(country) {
    const regionInfo = REGION_CONFIG[country.code] || {};
    const proxyIPs = getProxyIPsForCountry(country.code);
    
    return {
        code: country.code,
        name: country.name || regionInfo.name || country.code,
        nameEn: regionInfo.nameEn || country.code,
        emoji: country.emoji || regionInfo.emoji || '🌐',
        ipCount: parseInt(country.ipCount) || 3,
        proxyUrl: country.proxyUrl || '',
        priority: regionInfo.priority || 3,
        proxyIPs: proxyIPs,
        // تنظیمات اضافی که کاربر میتونه ست کنه
        warpEnabled: country.warpEnabled !== false,
        fragmentEnabled: country.fragmentEnabled !== false
    };
}

/**
 * دریافت ProxyIP های یک کشور
 */
export function getProxyIPsForCountry(countryCode) {
    return DEFAULT_PROXY_IPS.filter(p => 
        p.region === countryCode || p.regionCode === countryCode
    );
}

/**
 * دریافت بهترین ProxyIP برای یک کشور
 */
export function getBestProxyIP(countryCode) {
    const proxyIPs = getProxyIPsForCountry(countryCode);
    
    // اولویت: CMLiussss > visa > cloudflare > بقیه
    const priority = ['CMLiussss', 'visa', 'cloudflare', 'fxxk', 'cdn'];
    
    for (const source of priority) {
        const found = proxyIPs.find(p => p.source === source);
        if (found) return found;
    }
    
    return proxyIPs[0] || null;
}

/**
 * دریافت همه ProxyIP ها برای کشورهای انتخاب‌شده
 */
export function getAllProxyIPsForSelectedCountries() {
    const countries = getActiveCountries();
    const result = [];
    
    for (const country of countries) {
        const ipCount = country.ipCount;
        const proxyIPs = country.proxyIPs;
        
        if (country.proxyUrl) {
            // URL سفارشی - بعداً fetch میشه
            result.push({
                country,
                type: 'custom_url',
                url: country.proxyUrl,
                count: ipCount
            });
        } else if (proxyIPs.length > 0) {
            // ProxyIP های پیش‌فرض
            for (let i = 0; i < ipCount; i++) {
                const proxy = proxyIPs[i % proxyIPs.length];
                result.push({
                    country,
                    type: 'proxy_ip',
                    ip: proxy.domain,
                    port: proxy.port,
                    source: proxy.source,
                    name: `${country.emoji} ${country.name} #${i + 1}`
                });
            }
        }
    }
    
    return result;
}

/**
 * لیست همه کشورهای موجود (برای UI)
 */
export function getAllAvailableCountries() {
    const countries = [];
    
    for (const [code, info] of Object.entries(REGION_CONFIG)) {
        const proxyCount = DEFAULT_PROXY_IPS.filter(p => 
            p.region === code || p.regionCode === code
        ).length;
        
        countries.push({
            code,
            name: info.name,
            nameEn: info.nameEn,
            emoji: info.emoji,
            priority: info.priority,
            proxyCount,
            hasProxyIP: proxyCount > 0
        });
    }
    
    // مرتب‌سازی بر اساس اولویت
    return countries.sort((a, b) => a.priority - b.priority);
}

/**
 * بررسی آیا کشور ProxyIP داره
 */
export function hasProxyIP(countryCode) {
    return getProxyIPsForCountry(countryCode).length > 0;
}

/**
 * دریافت تعداد کل نودها
 */
export function getTotalNodeCount() {
    const countries = getActiveCountries();
    let total = 1; // Worker-Native
    
    for (const country of countries) {
        total += country.ipCount;
    }
    
    // اگه WARP فعاله
    if (getConfigValue('warpEnabled', 'no') === 'yes') {
        total += countries.length; // یه نود WARP برای هر کشور
    }
    
    return total;
}
