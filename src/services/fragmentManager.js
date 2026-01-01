// =============================================
// MozPN v3.0 - سیستم Fragmentation
// تکه‌تکه کردن پکت‌ها برای دور زدن فیلترینگ
// =============================================

import { getConfigValue, setConfigValue } from './kvStore.js';

/**
 * تنظیمات پیش‌فرض Fragment
 */
const DEFAULT_FRAGMENT_CONFIG = {
    enabled: false,
    mode: 'tlshello', // tlshello | all | http
    length: '100-200', // محدوده طول هر تکه
    interval: '10-20', // تاخیر بین تکه‌ها (میلی‌ثانیه)
    packets: 'tlshello', // کدام پکت‌ها تکه شوند
    host: '', // SNI سفارشی
    sni: '' // SNI جایگزین
};

/**
 * ساختار کانفیگ Fragment
 */
export function createFragmentConfig(options = {}) {
    return {
        enabled: options.enabled || false,
        mode: options.mode || 'tlshello',
        length: options.length || '100-200',
        interval: options.interval || '10-20',
        packets: options.packets || 'tlshello',
        host: options.host || '',
        sni: options.sni || ''
    };
}

/**
 * دریافت کانفیگ Fragment از KV
 */
export async function getFragmentConfig() {
    const configStr = getConfigValue('fragmentConfig', '');
    if (!configStr) {
        return createFragmentConfig();
    }
    
    try {
        return JSON.parse(configStr);
    } catch {
        return createFragmentConfig();
    }
}

/**
 * ذخیره کانفیگ Fragment
 */
export async function saveFragmentConfig(config) {
    await setConfigValue('fragmentConfig', JSON.stringify(config));
    return config;
}

/**
 * پارس کردن محدوده (مثلاً "100-200")
 */
function parseRange(rangeStr) {
    if (!rangeStr || typeof rangeStr !== 'string') {
        return { min: 100, max: 200 };
    }
    
    const parts = rangeStr.split('-').map(p => parseInt(p.trim()));
    
    if (parts.length === 1) {
        return { min: parts[0], max: parts[0] };
    }
    
    return {
        min: Math.min(parts[0], parts[1]),
        max: Math.max(parts[0], parts[1])
    };
}

/**
 * تولید عدد تصادفی در محدوده
 */
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * تکه‌تکه کردن داده
 */
export function fragmentData(data, config) {
    if (!config.enabled || !data || data.length === 0) {
        return [data];
    }
    
    const lengthRange = parseRange(config.length);
    const fragments = [];
    let offset = 0;
    
    while (offset < data.length) {
        const chunkSize = Math.min(
            randomInRange(lengthRange.min, lengthRange.max),
            data.length - offset
        );
        
        fragments.push(data.slice(offset, offset + chunkSize));
        offset += chunkSize;
    }
    
    return fragments;
}

/**
 * تشخیص TLS Client Hello
 */
export function isTLSClientHello(data) {
    if (!data || data.length < 6) return false;
    
    // بررسی هدر TLS
    // Content Type: Handshake (0x16)
    // Version: TLS 1.0+ (0x0301, 0x0302, 0x0303)
    // Handshake Type: Client Hello (0x01)
    
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
    }
    
    return (
        data[0] === 0x16 && // Handshake
        data[1] === 0x03 && // TLS version major
        (data[2] >= 0x01 && data[2] <= 0x03) && // TLS version minor
        data[5] === 0x01 // Client Hello
    );
}

/**
 * استخراج SNI از TLS Client Hello
 */
export function extractSNI(data) {
    if (!isTLSClientHello(data)) return null;
    
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
    }
    
    try {
        // پرش از هدر TLS Record (5 بایت)
        let offset = 5;
        
        // پرش از Handshake header (4 بایت)
        offset += 4;
        
        // پرش از Version (2 بایت)
        offset += 2;
        
        // پرش از Random (32 بایت)
        offset += 32;
        
        // Session ID Length
        const sessionIdLength = data[offset];
        offset += 1 + sessionIdLength;
        
        // Cipher Suites Length
        const cipherSuitesLength = (data[offset] << 8) | data[offset + 1];
        offset += 2 + cipherSuitesLength;
        
        // Compression Methods Length
        const compressionMethodsLength = data[offset];
        offset += 1 + compressionMethodsLength;
        
        // Extensions Length
        const extensionsLength = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        
        const extensionsEnd = offset + extensionsLength;
        
        // جستجوی SNI Extension (Type: 0x0000)
        while (offset < extensionsEnd) {
            const extType = (data[offset] << 8) | data[offset + 1];
            const extLength = (data[offset + 2] << 8) | data[offset + 3];
            offset += 4;
            
            if (extType === 0x0000) { // SNI Extension
                // SNI List Length
                offset += 2;
                
                // SNI Type (باید 0 باشد برای hostname)
                const sniType = data[offset];
                offset += 1;
                
                if (sniType === 0) {
                    const sniLength = (data[offset] << 8) | data[offset + 1];
                    offset += 2;
                    
                    const sniBytes = data.slice(offset, offset + sniLength);
                    return new TextDecoder().decode(sniBytes);
                }
            }
            
            offset += extLength;
        }
    } catch (e) {
        console.error('خطا در استخراج SNI:', e);
    }
    
    return null;
}

/**
 * جایگزینی SNI در TLS Client Hello
 */
export function replaceSNI(data, newSNI) {
    if (!isTLSClientHello(data) || !newSNI) return data;
    
    const originalSNI = extractSNI(data);
    if (!originalSNI) return data;
    
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
    }
    
    // تبدیل به string برای جایگزینی ساده
    const dataStr = Array.from(data).map(b => String.fromCharCode(b)).join('');
    const newDataStr = dataStr.replace(originalSNI, newSNI);
    
    // تبدیل برگشت به Uint8Array
    const newData = new Uint8Array(newDataStr.length);
    for (let i = 0; i < newDataStr.length; i++) {
        newData[i] = newDataStr.charCodeAt(i);
    }
    
    // به‌روزرسانی طول‌ها
    // این یک پیاده‌سازی ساده است - برای دقت بیشتر باید طول‌ها دقیق محاسبه شوند
    
    return newData;
}

/**
 * ایجاد Writer با قابلیت Fragment
 */
export function createFragmentWriter(writer, config) {
    if (!config.enabled) {
        return writer;
    }
    
    const intervalRange = parseRange(config.interval);
    let isFirstPacket = true;
    
    return {
        async write(chunk) {
            // فقط پکت اول (TLS Client Hello) را تکه کن
            if (config.mode === 'tlshello' && !isFirstPacket) {
                return writer.write(chunk);
            }
            
            if (config.mode === 'tlshello' && !isTLSClientHello(chunk)) {
                isFirstPacket = false;
                return writer.write(chunk);
            }
            
            isFirstPacket = false;
            
            // تکه‌تکه کردن
            const fragments = fragmentData(chunk, config);
            
            for (let i = 0; i < fragments.length; i++) {
                await writer.write(fragments[i]);
                
                // تاخیر بین تکه‌ها
                if (i < fragments.length - 1) {
                    const delay = randomInRange(intervalRange.min, intervalRange.max);
                    await sleep(delay);
                }
            }
        },
        
        close() {
            return writer.close();
        },
        
        abort(reason) {
            return writer.abort(reason);
        },
        
        get closed() {
            return writer.closed;
        },
        
        get desiredSize() {
            return writer.desiredSize;
        },
        
        get ready() {
            return writer.ready;
        },
        
        releaseLock() {
            return writer.releaseLock();
        }
    };
}

/**
 * تابع sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تولید کانفیگ Fragment برای Sing-box
 */
export function generateSingboxFragmentConfig(config) {
    if (!config.enabled) return null;
    
    const lengthRange = parseRange(config.length);
    const intervalRange = parseRange(config.interval);
    
    return {
        enabled: true,
        length: `${lengthRange.min}-${lengthRange.max}`,
        interval: `${intervalRange.min}-${intervalRange.max}`
    };
}

/**
 * تولید کانفیگ Fragment برای Xray
 */
export function generateXrayFragmentConfig(config) {
    if (!config.enabled) return null;
    
    const lengthRange = parseRange(config.length);
    const intervalRange = parseRange(config.interval);
    
    return {
        packets: config.packets || 'tlshello',
        length: `${lengthRange.min}-${lengthRange.max}`,
        interval: `${intervalRange.min}-${intervalRange.max}`
    };
}

/**
 * پیش‌تنظیمات Fragment
 */
export const FRAGMENT_PRESETS = {
    // برای ایران
    iran_mci: {
        enabled: true,
        mode: 'tlshello',
        length: '10-20',
        interval: '10-15',
        packets: 'tlshello'
    },
    iran_irancell: {
        enabled: true,
        mode: 'tlshello',
        length: '50-100',
        interval: '20-30',
        packets: 'tlshello'
    },
    iran_mokhaberat: {
        enabled: true,
        mode: 'tlshello',
        length: '100-200',
        interval: '10-20',
        packets: 'tlshello'
    },
    // برای چین
    china_gfw: {
        enabled: true,
        mode: 'tlshello',
        length: '1-3',
        interval: '1-3',
        packets: 'tlshello'
    },
    // عمومی
    default: {
        enabled: true,
        mode: 'tlshello',
        length: '100-200',
        interval: '10-20',
        packets: 'tlshello'
    },
    aggressive: {
        enabled: true,
        mode: 'all',
        length: '10-50',
        interval: '5-10',
        packets: '1-3'
    }
};

/**
 * دریافت پیش‌تنظیم
 */
export function getFragmentPreset(name) {
    return FRAGMENT_PRESETS[name] || FRAGMENT_PRESETS.default;
}

/**
 * لیست پیش‌تنظیمات
 */
export function listFragmentPresets() {
    return Object.keys(FRAGMENT_PRESETS).map(key => ({
        name: key,
        ...FRAGMENT_PRESETS[key]
    }));
}
