// =============================================
// MozPN - تنظیمات ثابت
// =============================================

// نگاشت کشورها و سرویس‌ها - فقط اونایی که ProxyIP دارن
export const REGION_CONFIG = {
    // کشورها با ProxyIP - اولویت 1 (پایدارترین)
    'US': { emoji: '🇺🇸', name: 'آمریکا', nameEn: 'United States', priority: 1 },
    'SG': { emoji: '🇸🇬', name: 'سنگاپور', nameEn: 'Singapore', priority: 1 },
    'JP': { emoji: '🇯🇵', name: 'ژاپن', nameEn: 'Japan', priority: 1 },
    'DE': { emoji: '🇩🇪', name: 'آلمان', nameEn: 'Germany', priority: 1 },
    'NL': { emoji: '🇳🇱', name: 'هلند', nameEn: 'Netherlands', priority: 1 },
    
    // کشورها با ProxyIP - اولویت 2
    'KR': { emoji: '🇰🇷', name: 'کره جنوبی', nameEn: 'South Korea', priority: 2 },
    'SE': { emoji: '🇸🇪', name: 'سوئد', nameEn: 'Sweden', priority: 2 },
    'FI': { emoji: '🇫🇮', name: 'فنلاند', nameEn: 'Finland', priority: 2 },
    'GB': { emoji: '🇬🇧', name: 'بریتانیا', nameEn: 'United Kingdom', priority: 2 },
    
    // کشورهای اضافه شده - تایید شده از CMLiussss
    'CA': { emoji: '🇨🇦', name: 'کانادا', nameEn: 'Canada', priority: 2 },
    'FR': { emoji: '🇫🇷', name: 'فرانسه', nameEn: 'France', priority: 2 },
    'AU': { emoji: '🇦🇺', name: 'استرالیا', nameEn: 'Australia', priority: 2 },
    'IN': { emoji: '🇮🇳', name: 'هند', nameEn: 'India', priority: 2 },
    'RU': { emoji: '🇷🇺', name: 'روسیه', nameEn: 'Russia', priority: 2 },
    'BR': { emoji: '🇧🇷', name: 'برزیل', nameEn: 'Brazil', priority: 2 },
    'HK': { emoji: '🇭🇰', name: 'هنگ‌کنگ', nameEn: 'Hong Kong', priority: 2 },
    'TW': { emoji: '🇹🇼', name: 'تایوان', nameEn: 'Taiwan', priority: 2 },
    'PL': { emoji: '🇵🇱', name: 'لهستان', nameEn: 'Poland', priority: 2 },
    
    // کشورهای خاورمیانه و اروپای شرقی - از رنج‌های Anycast
    'TR': { emoji: '🇹🇷', name: 'ترکیه', nameEn: 'Turkey', priority: 2 },
    'AE': { emoji: '🇦🇪', name: 'امارات', nameEn: 'UAE', priority: 2 },
    'UA': { emoji: '🇺🇦', name: 'اوکراین', nameEn: 'Ukraine', priority: 2 },
    
    // سرویس‌های ابری با ProxyIP
    'Oracle': { emoji: '☁️', name: 'اوراکل', nameEn: 'Oracle Cloud', priority: 3 },
    'DigitalOcean': { emoji: '🌊', name: 'دیجیتال‌اوشن', nameEn: 'DigitalOcean', priority: 3 },
    'Vultr': { emoji: '⚡', name: 'ولتر', nameEn: 'Vultr', priority: 3 },
    'Multacom': { emoji: '🔷', name: 'مولتاکام', nameEn: 'Multacom', priority: 3 },
    'Linode': { emoji: '🟢', name: 'لینود', nameEn: 'Linode', priority: 3 },
    'AWS': { emoji: '🔶', name: 'آمازون', nameEn: 'AWS', priority: 3 },
    'Azure': { emoji: '🔵', name: 'آژور', nameEn: 'Azure', priority: 3 },
    'GCP': { emoji: '🔴', name: 'گوگل کلود', nameEn: 'Google Cloud', priority: 3 }
};

// لیست پیش‌فرض ProxyIP ها - از منابع مختلف
export const DEFAULT_PROXY_IPS = [
    // ===== CMLiussss ProxyIP - پایدارترین =====
    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US', regionCode: 'US', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG', regionCode: 'SG', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP', regionCode: 'JP', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR', regionCode: 'KR', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE', regionCode: 'DE', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE', regionCode: 'SE', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL', regionCode: 'NL', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI', regionCode: 'FI', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB', regionCode: 'GB', port: 443, source: 'CMLiussss' },
    
    // کشورهای اضافه - CMLiussss
    { domain: 'ProxyIP.CA.CMLiussss.net', region: 'CA', regionCode: 'CA', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.FR.CMLiussss.net', region: 'FR', regionCode: 'FR', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.AU.CMLiussss.net', region: 'AU', regionCode: 'AU', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.IN.CMLiussss.net', region: 'IN', regionCode: 'IN', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.RU.CMLiussss.net', region: 'RU', regionCode: 'RU', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.BR.CMLiussss.net', region: 'BR', regionCode: 'BR', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.HK.CMLiussss.net', region: 'HK', regionCode: 'HK', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.TW.CMLiussss.net', region: 'TW', regionCode: 'TW', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.PL.CMLiussss.net', region: 'PL', regionCode: 'PL', port: 443, source: 'CMLiussss' },
    
    // ===== سرویس‌های ابری - CMLiussss =====
    { domain: 'ProxyIP.Oracle.CMLiussss.net', region: 'Oracle', regionCode: 'Oracle', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.DigitalOcean.CMLiussss.net', region: 'DigitalOcean', regionCode: 'DigitalOcean', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.Vultr.CMLiussss.net', region: 'Vultr', regionCode: 'Vultr', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.Multacom.CMLiussss.net', region: 'Multacom', regionCode: 'Multacom', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.Linode.CMLiussss.net', region: 'Linode', regionCode: 'Linode', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.AWS.CMLiussss.net', region: 'AWS', regionCode: 'AWS', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.Azure.CMLiussss.net', region: 'Azure', regionCode: 'Azure', port: 443, source: 'CMLiussss' },
    { domain: 'ProxyIP.GCP.CMLiussss.net', region: 'GCP', regionCode: 'GCP', port: 443, source: 'CMLiussss' },
    
    // ===== منبع جایگزین - proxyip.fxxk.dedyn.io =====
    { domain: 'proxyip.fxxk.dedyn.io', region: 'US', regionCode: 'US', port: 443, source: 'fxxk' },
    { domain: 'proxyip.aliyun.fxxk.dedyn.io', region: 'SG', regionCode: 'SG', port: 443, source: 'fxxk' },
    { domain: 'proxyip.oracle.fxxk.dedyn.io', region: 'Oracle', regionCode: 'Oracle', port: 443, source: 'fxxk' },
    
    // ===== منبع جایگزین - nkeonkeo =====
    { domain: 'cdn.xn--b6gac.eu.org', region: 'US', regionCode: 'US', port: 443, source: 'cdn' },
    { domain: 'cdn-all.xn--b6gac.eu.org', region: 'US', regionCode: 'US', port: 443, source: 'cdn' },
    
    // ===== Cloudflare Partner IPs - پایدار =====
    { domain: 'www.visa.com.sg', region: 'SG', regionCode: 'SG', port: 443, source: 'visa' },
    { domain: 'www.visa.com.hk', region: 'HK', regionCode: 'HK', port: 443, source: 'visa' },
    { domain: 'www.visa.com.tw', region: 'TW', regionCode: 'TW', port: 443, source: 'visa' },
    { domain: 'www.visa.co.jp', region: 'JP', regionCode: 'JP', port: 443, source: 'visa' },
    { domain: 'www.visa.com.au', region: 'AU', regionCode: 'AU', port: 443, source: 'visa' },
    { domain: 'www.visa.co.uk', region: 'GB', regionCode: 'GB', port: 443, source: 'visa' },
    { domain: 'www.visa.de', region: 'DE', regionCode: 'DE', port: 443, source: 'visa' },
    { domain: 'www.visa.fr', region: 'FR', regionCode: 'FR', port: 443, source: 'visa' },
    { domain: 'www.visa.ca', region: 'CA', regionCode: 'CA', port: 443, source: 'visa' },
    { domain: 'www.visa.co.in', region: 'IN', regionCode: 'IN', port: 443, source: 'visa' },
    { domain: 'www.visa.com.br', region: 'BR', regionCode: 'BR', port: 443, source: 'visa' },
    { domain: 'www.visa.co.kr', region: 'KR', regionCode: 'KR', port: 443, source: 'visa' },
    { domain: 'www.visa.com.tr', region: 'TR', regionCode: 'TR', port: 443, source: 'visa' },
    { domain: 'www.visa.ae', region: 'AE', regionCode: 'AE', port: 443, source: 'visa' },
    { domain: 'www.visa.ru', region: 'RU', regionCode: 'RU', port: 443, source: 'visa' },
    
    // ===== Cloudflare CDN Domains - پایدار =====
    { domain: 'time.cloudflare.com', region: 'US', regionCode: 'US', port: 443, source: 'cloudflare' },
    { domain: 'icook.hk', region: 'HK', regionCode: 'HK', port: 443, source: 'cloudflare' },
    { domain: 'ip.sb', region: 'US', regionCode: 'US', port: 443, source: 'cloudflare' },
    { domain: 'japan.com', region: 'JP', regionCode: 'JP', port: 443, source: 'cloudflare' },
    
    // ===== آی‌پی‌های Anycast برای کشورهای خاص =====
    // اوکراین (Kyiv)
    { domain: '172.68.238.1', region: 'UA', regionCode: 'UA', port: 443, source: 'anycast-ua' },
    { domain: '172.68.238.100', region: 'UA', regionCode: 'UA', port: 443, source: 'anycast-ua' },
    { domain: '141.101.120.1', region: 'UA', regionCode: 'UA', port: 443, source: 'anycast-ua' },
    
    // ترکیه (Istanbul) - رنج‌های Anycast
    { domain: '172.68.100.1', region: 'TR', regionCode: 'TR', port: 443, source: 'anycast-tr' },
    { domain: '141.101.98.1', region: 'TR', regionCode: 'TR', port: 443, source: 'anycast-tr' },
    
    // امارات (Dubai) - رنج‌های Anycast
    { domain: '172.68.52.1', region: 'AE', regionCode: 'AE', port: 443, source: 'anycast-ae' },
    { domain: '141.101.82.1', region: 'AE', regionCode: 'AE', port: 443, source: 'anycast-ae' }
];

// دامنه‌های مستقیم برای تست - دامنه‌های Anycast با آی‌پی تمیز
export const DIRECT_DOMAINS = [
    // دامنه‌های اصلی و پایدار
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz", priority: 1 },
    { name: "speed.marisalnc.com", domain: "speed.marisalnc.com", priority: 1 },
    { name: "bestcf.top", domain: "bestcf.top", priority: 1 },
    { name: "cf.0sm.com", domain: "cf.0sm.com", priority: 1 },
    
    // دامنه‌های ثانویه
    { domain: "freeyx.cloudflare88.eu.org", priority: 2 },
    { domain: "cdn.2020111.xyz", priority: 2 },
    { domain: "cfip.cfcdn.vip", priority: 2 },
    { domain: "cf.090227.xyz", priority: 2 },
    { domain: "cf.zhetengsha.eu.org", priority: 2 },
    { domain: "cloudflare.9jy.cc", priority: 2 },
    { domain: "cf.zerone-cdn.pp.ua", priority: 2 },
    { domain: "cfip.1323123.xyz", priority: 2 },
    { domain: "cnamefuckxxs.yuchen.icu", priority: 2 },
    { domain: "cloudflare-ip.mofashi.ltd", priority: 2 },
    { domain: "115155.xyz", priority: 2 },
    { domain: "cname.xirancdn.us", priority: 2 },
    { domain: "f3058171cad.002404.xyz", priority: 2 },
    { domain: "8.889288.xyz", priority: 2 },
    { domain: "cdn.tzpro.xyz", priority: 2 },
    { domain: "cf.877771.xyz", priority: 2 },
    { domain: "xn--b6gac.eu.org", priority: 2 },
    
    // دامنه‌های جدید از منابع معتبر
    { domain: "cf-ns.com", priority: 1 },
    { domain: "cfcdn.xyz", priority: 2 },
    { domain: "cf.090227.xyz", priority: 2 }
];

// URL پیش‌فرض برای دریافت IP های بهینه
export const DEFAULT_PREFERRED_IP_URL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';

// منابع معتبر برای دریافت IP های تمیز (آپدیت خودکار)
export const CLEAN_IP_SOURCES = [
    // IRCF - یکی از معتبرترین منابع
    {
        name: 'IRCF',
        url: 'https://raw.githubusercontent.com/ircfspace/cf2dns/master/list.txt',
        priority: 1,
        description: 'لیست جامع آی‌پی تمیز - آپدیت روزانه'
    },
    // Compass VPN - آپدیت روزانه
    {
        name: 'CompassVPN',
        url: 'https://raw.githubusercontent.com/compassvpn/cf-tools/main/list.txt',
        priority: 1,
        description: 'اسکن روزانه CDN و Warp'
    },
    // Kejiland - منبع اصلی فعلی
    {
        name: 'Kejiland',
        url: 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt',
        priority: 2,
        description: 'لیست بهینه چینی'
    },
    // VFarid Scanner
    {
        name: 'VFarid',
        url: 'https://vfarid.github.io/cf-ip-scanner/',
        priority: 3,
        description: 'اسکنر آنلاین'
    }
];

// رنج‌های IP کلودفلر برای اسکن (اوکراین و سایر کشورها)
export const CF_IP_RANGES = {
    // رنج‌های عمومی کلودفلر
    general: [
        '104.16.0.0/12',
        '172.64.0.0/13',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '131.0.72.0/22'
    ],
    // رنج‌های مخصوص اوکراین (Kyiv)
    UA: [
        '172.68.238.0/24',
        '141.101.120.0/24',
        '108.162.251.0/24'
    ],
    // رنج‌های مخصوص ترکیه (Istanbul)
    TR: [
        '172.68.100.0/24',
        '141.101.98.0/24'
    ],
    // رنج‌های مخصوص امارات (Dubai)
    AE: [
        '172.68.52.0/24',
        '141.101.82.0/24'
    ]
};

// URL تبدیل‌کننده اشتراک
export const DEFAULT_SUB_CONVERTER_URL = 'https://url.v1.mk/sub';

// پورت‌های Cloudflare
export const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
export const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];

// نوع آدرس
export const ADDRESS_TYPE = {
    IPV4: 1,
    URL: 2,
    IPV6: 3
};

// پیام‌های خطا
export const ERROR_MESSAGES = {
    INVALID_DATA: 'invalid data',
    INVALID_USER: 'invalid user',
    UNSUPPORTED_CMD: 'command is not supported',
    UDP_DNS_ONLY: 'UDP proxy only enable for DNS which is port 53',
    INVALID_ADDR_TYPE: 'invalid addressType',
    EMPTY_ADDR: 'addressValue is empty',
    WS_NOT_OPEN: 'webSocket.readyState is not open',
    INVALID_ID_STR: 'Stringified identifier is invalid',
    INVALID_SOCKS_ADDR: 'Invalid SOCKS address format',
    SOCKS_NO_METHOD: 'no acceptable methods',
    SOCKS_AUTH_NEEDED: 'socks server needs auth',
    SOCKS_AUTH_FAIL: 'fail to auth socks server',
    SOCKS_CONN_FAIL: 'fail to open socks connection'
};

// منطقه‌های نزدیک برای انتخاب هوشمند
export const NEARBY_REGIONS = {
    'US': ['CA', 'BR', 'SG', 'JP', 'KR'],
    'CA': ['US', 'GB', 'DE', 'FR'],
    'SG': ['HK', 'TW', 'JP', 'KR', 'AU', 'IN'],
    'JP': ['KR', 'TW', 'HK', 'SG', 'US'],
    'KR': ['JP', 'TW', 'HK', 'SG', 'US'],
    'DE': ['NL', 'FR', 'PL', 'GB', 'SE', 'FI'],
    'SE': ['FI', 'DE', 'NL', 'PL', 'GB'],
    'NL': ['DE', 'GB', 'FR', 'SE', 'FI', 'PL'],
    'FI': ['SE', 'DE', 'NL', 'PL', 'RU'],
    'GB': ['DE', 'NL', 'FR', 'SE', 'FI'],
    'FR': ['DE', 'NL', 'GB', 'SE'],
    'AU': ['SG', 'JP', 'HK', 'TW', 'IN'],
    'IN': ['SG', 'HK', 'AE', 'AU'],
    'RU': ['FI', 'DE', 'PL', 'SE'],
    'BR': ['US', 'CA'],
    'HK': ['TW', 'SG', 'JP', 'KR', 'AU'],
    'TW': ['HK', 'JP', 'KR', 'SG'],
    'PL': ['DE', 'NL', 'SE', 'FI', 'RU'],
    'TR': ['DE', 'NL', 'GB', 'AE'],
    'AE': ['IN', 'SG', 'TR', 'DE'],
    'IR': ['TR', 'AE', 'DE', 'NL']
};

// نگاشت کشور به منطقه
export const COUNTRY_TO_REGION = {
    // کشورهای با ProxyIP مستقیم
    'US': 'US', 'SG': 'SG', 'JP': 'JP', 'KR': 'KR',
    'DE': 'DE', 'SE': 'SE', 'NL': 'NL', 'FI': 'FI', 'GB': 'GB',
    'CA': 'CA', 'FR': 'FR', 'AU': 'AU', 'IN': 'IN',
    'RU': 'RU', 'BR': 'BR', 'HK': 'HK', 'TW': 'TW', 'PL': 'PL',
    
    // کشورهای بدون ProxyIP مستقیم - نزدیک‌ترین
    'CN': 'HK', 'MO': 'HK',
    'TH': 'SG', 'VN': 'SG', 'MY': 'SG', 'ID': 'SG', 'PH': 'SG',
    'IT': 'DE', 'ES': 'FR', 'CH': 'DE', 'AT': 'DE', 'BE': 'NL',
    'DK': 'SE', 'NO': 'SE', 'IE': 'GB', 'PT': 'FR',
    'CZ': 'DE', 'HU': 'DE', 'RO': 'DE', 'BG': 'DE',
    'GR': 'DE', 'SK': 'PL', 'UA': 'UA',
    'TR': 'TR', 'AE': 'AE', 'SA': 'AE', 'BH': 'AE', 'QA': 'AE', 'KW': 'AE',
    'IR': 'DE', 'PK': 'IN', 'BD': 'IN',
    'NZ': 'AU', 'MX': 'US', 'AR': 'BR', 'CL': 'BR', 'CO': 'BR',
    'ZA': 'GB', 'EG': 'DE', 'NG': 'GB', 'KE': 'GB'
};
