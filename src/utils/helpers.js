// =============================================
// MozPN - توابع کمکی
// =============================================

import { NEARBY_REGIONS, REGION_CONFIG } from '../config/constants.js';

/**
 * تشخیص منطقه Worker از درخواست
 */
export async function detectWorkerRegion(request) {
    try {
        const cfCountry = request.cf?.country;
        
        if (cfCountry) {
            const countryToRegion = {
                'US': 'US', 'SG': 'SG', 'JP': 'JP', 'KR': 'KR',
                'DE': 'DE', 'SE': 'SE', 'NL': 'NL', 'FI': 'FI', 'GB': 'GB',
                'IR': 'IR', 'TR': 'TR', 'FR': 'FR', 'CA': 'CA', 'AU': 'AU',
                'CN': 'SG', 'TW': 'JP', 'AT': 'DE', 'BE': 'NL',
                'DK': 'SE', 'NO': 'SE', 'IE': 'GB'
            };
            
            if (countryToRegion[cfCountry]) {
                return countryToRegion[cfCountry];
            }
        }
        
        return 'SG'; // پیش‌فرض
    } catch {
        return 'SG';
    }
}

/**
 * دریافت منطقه‌های نزدیک
 */
export function getNearbyRegions(region) {
    return NEARBY_REGIONS[region] || [];
}

/**
 * مرتب‌سازی IP ها بر اساس منطقه
 */
export function sortIPsByRegion(workerRegion, availableIPs) {
    if (!workerRegion || !availableIPs.length) {
        return availableIPs;
    }
    
    const nearbyRegions = getNearbyRegions(workerRegion);
    const allRegions = Object.keys(REGION_CONFIG);
    const priorityRegions = [
        workerRegion,
        ...nearbyRegions,
        ...allRegions.filter(r => r !== workerRegion && !nearbyRegions.includes(r))
    ];
    
    const sortedIPs = [];
    for (const region of priorityRegions) {
        const regionIPs = availableIPs.filter(ip => ip.region === region || ip.regionCode === region);
        sortedIPs.push(...regionIPs);
    }
    
    return sortedIPs;
}

/**
 * انتخاب تصادفی از آرایه
 */
export function randomSelect(array, count = 1) {
    if (!array.length) return [];
    if (count >= array.length) return [...array];
    
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * تبدیل متن به آرایه
 */
export function parseTextToArray(content) {
    const processed = content
        .replace(/[\t"'\r\n]+/g, ',')
        .replace(/,+/g, ',')
        .replace(/^,|,$/g, '');
    
    return processed.split(',').filter(item => item.trim());
}

/**
 * ساخت پاسخ JSON
 */
export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * ساخت پاسخ HTML
 */
export function htmlResponse(html, status = 200) {
    return new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

/**
 * دریافت نام کشور با ایموجی
 */
export function getRegionDisplayName(regionCode, lang = 'fa') {
    const config = REGION_CONFIG[regionCode];
    if (!config) return regionCode;
    
    const name = lang === 'fa' ? config.name : config.nameEn;
    return `${config.emoji} ${name}`;
}

/**
 * encode به Base64
 */
export function toBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

/**
 * decode از Base64
 */
export function fromBase64(str) {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch {
        return null;
    }
}

/**
 * تولید UUID تصادفی
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * هش SHA224 برای Trojan
 */
export async function sha224(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // SHA224 = SHA256 با 28 بایت اول
    return hashArray.slice(0, 28).map(b => b.toString(16).padStart(2, '0')).join('');
}
