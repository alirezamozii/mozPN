// =============================================
// MozPN - مدیریت KV Store
// =============================================

let kvStore = null;
let kvConfig = {};

/**
 * راه‌اندازی KV Store
 */
export async function initKVStore(env) {
    if (env.C) {
        try {
            kvStore = env.C;
            await loadKVConfig();
            return true;
        } catch (error) {
            console.error('خطا در راه‌اندازی KV:', error);
            kvStore = null;
            return false;
        }
    }
    return false;
}

/**
 * بارگذاری تنظیمات از KV
 */
async function loadKVConfig() {
    if (!kvStore) return;
    
    try {
        const configData = await kvStore.get('c');
        if (configData) {
            kvConfig = JSON.parse(configData);
        }
    } catch (error) {
        console.error('خطا در بارگذاری تنظیمات:', error);
        kvConfig = {};
    }
}

/**
 * ذخیره تنظیمات در KV
 */
export async function saveKVConfig() {
    if (!kvStore) {
        throw new Error('KV Store فعال نیست');
    }
    
    try {
        await kvStore.put('c', JSON.stringify(kvConfig));
        return true;
    } catch (error) {
        console.error('خطا در ذخیره تنظیمات:', error);
        throw error;
    }
}

/**
 * دریافت مقدار از تنظیمات
 * مقادیر پیش‌فرض بهینه برای ایران
 */
export function getConfigValue(key, defaultValue = '') {
    if (kvConfig[key] !== undefined) {
        return kvConfig[key];
    }
    
    // مقادیر پیش‌فرض بهینه
    const optimizedDefaults = {
        // مسیریابی - روشن
        'iranDirect': 'yes',      // ترافیک ایران مستقیم
        'adBlock': 'yes',         // بلاک تبلیغات
        'chinaDirect': 'no',      // ترافیک چین (معمولاً نیاز نیست)
        
        // پروتکل‌ها
        'ev': 'yes',              // VLESS فعال
        'et': 'no',               // Trojan غیرفعال (نیاز به پسورد)
        'ex': 'no',               // XHTTP غیرفعال
        
        // ===== تعداد کانفیگ هر پروتکل (حالت دستی) =====
        // کاربر مشخص میکنه از هر پروتکل چند تا بسازه
        'vlessCount': 'all',      // all = همه نودها، یا عدد مثل 5, 10
        'trojanCount': 'all',     // all = همه نودها، یا عدد
        'xhttpCount': 'all',      // all = همه نودها، یا عدد
        
        // ===== تقسیم خودکار (اختیاری) =====
        // پیش‌فرض غیرفعال - کاربر خودش تنظیم میکنه
        // اگه فعال کرد، فقط کل تعداد رو میده و خودکار تقسیم میشه
        'autoDistribute': 'no',       // غیرفعال پیش‌فرض
        'totalConfigCount': '20',     // فقط وقتی autoDistribute فعاله کار میکنه
        
        // IP های بهینه
        'epi': 'yes',             // IP های بهینه فعال
        'egi': 'yes',             // IP های GitHub فعال
        'epd': 'no',              // دامنه‌های مستقیم غیرفعال
        
        // فیلتر ISP
        'ipv4': 'yes',
        'ipv6': 'no',             // IPv6 معمولاً مشکل‌ساز
        'ispMobile': 'yes',
        'ispUnicom': 'yes',
        'ispTelecom': 'yes',
        
        // قابلیت‌های پیشرفته - غیرفعال (کاربر فعال کنه)
        'fragmentEnabled': 'no',  // Fragment فقط وقتی فیلترینگ شدید
        'warpEnabled': 'no',      // WARP نیاز به تنظیم داره
        'failoverEnabled': 'no',  // Failover اختیاری
        'realityEnabled': 'no',   // Reality اختیاری
        
        // تنظیمات نمایش
        'randomMode': 'no',
        'totalIPCount': '10',
        'remarkPrefix': '',
        'remarkSeparator': ' | ',
        'nodeNameFormat': 'country-user',
        
        // ===== سیستم نام‌گذاری پیشرفته =====
        // فرمت سفارشی با متغیرهای داینامیک
        // متغیرها: {emoji}, {country}, {user}, {remark}, {ip}, {port}, {index}, {num}, {protocol}
        // مثال: "{user} | {emoji} {country} #{index}" => "MyVPN | 🇩🇪 Germany #01"
        'customNodeFormat': '',
        
        // تنظیمات شماره‌گذاری
        'indexStart': '1',        // شروع شماره‌گذاری (1 یا 0)
        'indexPadding': '2',      // تعداد رقم (2 = 01,02 | 1 = 1,2 | 3 = 001,002)
        'indexPerCountry': 'yes', // شماره‌گذاری جدا برای هر کشور (yes) یا کلی (no)
        'indexPerProtocol': 'no'  // شماره‌گذاری جدا برای هر پروتکل
    };
    
    return optimizedDefaults[key] !== undefined ? optimizedDefaults[key] : defaultValue;
}

/**
 * تنظیم مقدار در تنظیمات
 */
export async function setConfigValue(key, value) {
    kvConfig[key] = value;
    await saveKVConfig();
}

/**
 * دریافت کل تنظیمات
 */
export function getAllConfig() {
    return { ...kvConfig };
}

/**
 * به‌روزرسانی چند مقدار
 */
export async function updateConfig(newConfig) {
    for (const [key, value] of Object.entries(newConfig)) {
        if (value === '' || value === null || value === undefined) {
            delete kvConfig[key];
        } else {
            kvConfig[key] = value;
        }
    }
    await saveKVConfig();
    return kvConfig;
}

/**
 * بازنشانی تنظیمات
 */
export async function resetConfig() {
    kvConfig = {};
    await saveKVConfig();
}

/**
 * بررسی فعال بودن KV
 */
export function isKVEnabled() {
    return kvStore !== null;
}

/**
 * دریافت تنظیمات کشورهای انتخاب‌شده
 */
export function getSelectedCountries() {
    const countriesStr = getConfigValue('selectedCountries', '');
    if (!countriesStr) return [];
    
    try {
        return JSON.parse(countriesStr);
    } catch {
        return [];
    }
}

/**
 * ذخیره تنظیمات کشورهای انتخاب‌شده
 */
export async function setSelectedCountries(countries) {
    await setConfigValue('selectedCountries', JSON.stringify(countries));
}

/**
 * دریافت پروکسی‌های سفارشی
 */
export function getCustomProxies() {
    const proxiesStr = getConfigValue('customProxies', '');
    if (!proxiesStr) return [];
    
    try {
        return JSON.parse(proxiesStr);
    } catch {
        return [];
    }
}

/**
 * ذخیره پروکسی‌های سفارشی
 */
export async function setCustomProxies(proxies) {
    await setConfigValue('customProxies', JSON.stringify(proxies));
}

/**
 * بررسی آیا رمز تنظیم شده
 */
export async function isPasswordSet() {
    if (!kvStore) return false;
    try {
        const pwd = await kvStore.get('panel_password');
        return pwd !== null && pwd !== undefined && pwd !== '';
    } catch {
        return false;
    }
}

/**
 * دریافت رمز ذخیره شده
 */
export async function getPassword() {
    if (!kvStore) return null;
    try {
        return await kvStore.get('panel_password');
    } catch {
        return null;
    }
}

/**
 * ذخیره رمز جدید
 */
export async function setPassword(password) {
    if (!kvStore) {
        throw new Error('KV Store فعال نیست');
    }
    await kvStore.put('panel_password', password);
    return true;
}
