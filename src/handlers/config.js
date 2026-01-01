// =============================================
// MozPN - مدیریت API تنظیمات
// =============================================

import { 
    isKVEnabled, 
    getAllConfig, 
    updateConfig, 
    resetConfig 
} from '../services/kvStore.js';
import { jsonResponse } from '../utils/helpers.js';

/**
 * مدیریت API تنظیمات
 */
export async function handleConfigAPI(request) {
    // بررسی KV
    if (!isKVEnabled()) {
        return jsonResponse({
            error: 'KV فعال نیست',
            message: 'برای استفاده از این قابلیت باید KV را فعال کنید'
        }, 503);
    }
    
    // GET - دریافت تنظیمات
    if (request.method === 'GET') {
        const config = getAllConfig();
        return jsonResponse({
            ...config,
            kvEnabled: true
        });
    }
    
    // POST - ذخیره تنظیمات
    if (request.method === 'POST') {
        try {
            const newConfig = await request.json();
            
            // اعتبارسنجی
            if (newConfig.selectedCountries) {
                try {
                    JSON.parse(newConfig.selectedCountries);
                } catch {
                    return jsonResponse({
                        success: false,
                        message: 'فرمت selectedCountries نامعتبر است'
                    }, 400);
                }
            }
            
            if (newConfig.customProxies) {
                try {
                    JSON.parse(newConfig.customProxies);
                } catch {
                    return jsonResponse({
                        success: false,
                        message: 'فرمت customProxies نامعتبر است'
                    }, 400);
                }
            }
            
            // به‌روزرسانی
            await updateConfig(newConfig);
            
            return jsonResponse({
                success: true,
                message: 'تنظیمات با موفقیت ذخیره شد',
                config: getAllConfig()
            });
            
        } catch (error) {
            return jsonResponse({
                success: false,
                message: 'خطا در ذخیره تنظیمات: ' + error.message
            }, 500);
        }
    }
    
    // DELETE - بازنشانی تنظیمات
    if (request.method === 'DELETE') {
        try {
            await resetConfig();
            
            return jsonResponse({
                success: true,
                message: 'تنظیمات بازنشانی شد'
            });
        } catch (error) {
            return jsonResponse({
                success: false,
                message: 'خطا در بازنشانی: ' + error.message
            }, 500);
        }
    }
    
    return jsonResponse({
        error: 'متد پشتیبانی نمی‌شود'
    }, 405);
}

/**
 * دریافت اطلاعات منطقه
 */
export async function handleRegionAPI(request, currentRegion = '') {
    try {
        const cfCountry = request.cf?.country || 'نامشخص';
        const cfRegion = request.cf?.region || 'نامشخص';
        const cfCity = request.cf?.city || 'نامشخص';
        
        return jsonResponse({
            region: currentRegion || cfCountry,
            detectionMethod: 'Cloudflare CF Object',
            details: {
                country: cfCountry,
                region: cfRegion,
                city: cfCity
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return jsonResponse({
            error: 'خطا در تشخیص منطقه',
            message: error.message
        }, 500);
    }
}

/**
 * API دریافت IP های بهینه
 */
export async function handlePreferredIPsAPI(request) {
    try {
        const url = new URL(request.url);
        const sourceUrl = url.searchParams.get('url') || '';
        const count = parseInt(url.searchParams.get('count') || '10');
        
        if (!sourceUrl) {
            return jsonResponse({
                error: 'پارامتر url الزامی است'
            }, 400);
        }
        
        const ips = await fetchPreferredIPs(sourceUrl, count);
        
        return jsonResponse({
            success: true,
            count: ips.length,
            ips: ips
        });
    } catch (error) {
        return jsonResponse({
            error: 'خطا در دریافت IP ها',
            message: error.message
        }, 500);
    }
}

/**
 * دریافت IP های بهینه از URL
 */
async function fetchPreferredIPs(url, count = 10) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) return [];
        
        const text = await response.text();
        const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        
        const results = [];
        const IPV6_PATTERN = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
        
        // بررسی CSV
        const isCSV = lines.length > 1 && lines[0].includes(',');
        
        if (!isCSV) {
            // فرمت ساده
            for (const line of lines) {
                if (results.length >= count) break;
                
                const hashIndex = line.indexOf('#');
                const [hostPart, remark] = hashIndex > -1 
                    ? [line.substring(0, hashIndex), line.substring(hashIndex + 1)] 
                    : [line, ''];
                
                let ip = hostPart;
                let port = 443;
                
                if (hostPart.startsWith('[')) {
                    // IPv6
                    const match = hostPart.match(/^\[([^\]]+)\]:?(\d+)?$/);
                    if (match) {
                        ip = match[1];
                        port = parseInt(match[2] || '443');
                    }
                } else if (hostPart.includes(':')) {
                    const lastColon = hostPart.lastIndexOf(':');
                    const possiblePort = hostPart.substring(lastColon + 1);
                    if (/^\d+$/.test(possiblePort)) {
                        ip = hostPart.substring(0, lastColon);
                        port = parseInt(possiblePort);
                    }
                }
                
                results.push({
                    ip: ip,
                    port: port,
                    name: remark.trim() || ip
                });
            }
        } else {
            // فرمت CSV
            const headers = lines[0].split(',').map(h => h.trim());
            const dataLines = lines.slice(1);
            
            // تشخیص نوع CSV
            const ipIdx = headers.findIndex(h => h.includes('IP') || h === 'ip');
            const portIdx = headers.findIndex(h => h.includes('端口') || h.includes('port') || h === 'Port');
            const remarkIdx = headers.findIndex(h => 
                h.includes('国家') || h.includes('城市') || h.includes('数据中心') || 
                h.includes('country') || h.includes('city') || h === 'remark'
            );
            
            if (ipIdx !== -1) {
                for (const line of dataLines) {
                    if (results.length >= count) break;
                    
                    const cols = line.split(',').map(c => c.trim());
                    let ip = cols[ipIdx] || '';
                    let port = portIdx !== -1 ? parseInt(cols[portIdx] || '443') : 443;
                    let name = remarkIdx !== -1 ? cols[remarkIdx] : ip;
                    
                    // پوشش IPv6
                    if (IPV6_PATTERN.test(ip)) {
                        ip = `[${ip}]`;
                    }
                    
                    if (ip) {
                        results.push({ ip, port, name });
                    }
                }
            }
        }
        
        return results;
    } catch (error) {
        console.error('خطا در دریافت IP:', error);
        return [];
    }
}
