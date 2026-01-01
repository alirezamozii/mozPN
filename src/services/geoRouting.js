// =============================================
// MozPN v2.0 - سیستم مسیریابی جغرافیایی
// مسیریابی هوشمند ایران/چین با GeoIP/GeoSite
// =============================================

// منابع GeoIP/GeoSite از Chocolate4U
const GEO_SOURCES = {
    // سایت‌های ایران (Direct)
    GEOSITE_IR: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-ir.srs',
    
    // آی‌پی‌های ایران (Direct)
    GEOIP_IR: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geoip-ir.srs',
    
    // تبلیغات (Block)
    GEOSITE_ADS: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-category-ads-all.srs',
    
    // بدافزار (Block)
    GEOSITE_MALWARE: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-malware.srs',
    
    // فیشینگ (Block)
    GEOSITE_PHISHING: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-phishing.srs',
    
    // آی‌پی‌های چین
    GEOIP_CN: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geoip-cn.srs',
    
    // سایت‌های چین
    GEOSITE_CN: 'https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-cn.srs'
};

// CIDR های ایران (لیست پایه برای استفاده آفلاین)
const IRAN_CIDR_LIST = [
    '2.144.0.0/14', '2.176.0.0/12', '5.22.0.0/17', '5.22.128.0/17',
    '5.23.112.0/21', '5.34.192.0/20', '5.52.0.0/14', '5.56.128.0/17',
    '5.57.32.0/21', '5.61.24.0/23', '5.61.26.0/23', '5.61.28.0/22',
    '5.62.160.0/19', '5.63.8.0/21', '5.72.0.0/13', '5.104.208.0/21',
    '5.106.0.0/16', '5.112.0.0/12', '5.134.128.0/18', '5.144.128.0/21',
    '5.145.112.0/21', '5.159.48.0/21', '5.160.0.0/16', '5.182.44.0/22',
    '5.190.0.0/16', '5.198.160.0/19', '5.200.64.0/18', '5.201.128.0/17',
    '5.202.0.0/16', '5.208.0.0/12', '5.232.0.0/14', '5.236.0.0/17',
    '5.236.128.0/17', '5.237.0.0/16', '5.238.0.0/15', '5.250.0.0/17',
    '5.252.216.0/22', '31.2.128.0/17', '31.7.64.0/21', '31.7.72.0/21',
    '31.7.88.0/21', '31.7.96.0/19', '31.14.80.0/20', '31.14.112.0/20',
    '31.14.144.0/20', '31.24.200.0/21', '31.24.232.0/21', '31.25.88.0/21',
    '31.25.104.0/21', '31.25.128.0/21', '31.25.232.0/21', '31.40.0.0/21',
    '31.47.32.0/19', '31.56.0.0/14', '31.130.176.0/20', '31.170.48.0/21',
    '31.170.56.0/21', '31.170.64.0/21', '31.171.216.0/21', '31.184.128.0/18',
    '31.193.112.0/21', '31.214.132.0/23', '31.214.146.0/23', '31.214.154.0/24',
    '31.214.168.0/21', '31.214.200.0/23', '31.214.228.0/22', '31.214.248.0/21',
    '31.217.208.0/21', '37.9.248.0/21', '37.10.64.0/22', '37.10.109.0/24',
    '37.10.117.0/24', '37.19.80.0/20', '37.32.0.0/19', '37.32.16.0/27',
    '37.32.32.0/19', '37.44.56.0/21', '37.49.144.0/22', '37.63.128.0/17',
    '37.75.240.0/21', '37.98.0.0/17', '37.114.192.0/18', '37.128.240.0/20',
    '37.129.0.0/16', '37.130.200.0/21', '37.137.0.0/16', '37.143.144.0/21',
    '37.148.0.0/17', '37.148.248.0/22', '37.152.160.0/19', '37.153.128.0/22',
    '37.153.176.0/20', '37.156.0.0/22', '37.156.8.0/21', '37.156.16.0/20',
    '37.156.48.0/20', '37.156.100.0/22', '37.156.112.0/20', '37.156.128.0/20',
    '37.156.144.0/22', '37.156.152.0/21', '37.156.160.0/21', '37.156.176.0/20',
    '37.156.212.0/22', '37.156.232.0/21', '37.156.240.0/22', '37.156.248.0/21',
    '37.191.64.0/19', '37.202.128.0/17', '37.221.0.0/18', '37.228.131.0/24',
    '37.228.133.0/24', '37.228.135.0/24', '37.228.136.0/22', '37.235.16.0/20',
    '37.254.0.0/16', '37.255.0.0/17', '46.18.248.0/21', '46.21.80.0/20',
    '46.28.72.0/21', '46.32.0.0/19', '46.34.96.0/19', '46.34.160.0/19',
    '46.36.96.0/20', '46.38.128.0/19', '46.38.184.0/21', '46.41.192.0/18',
    '46.51.0.0/17', '46.62.128.0/17', '46.100.0.0/16', '46.102.120.0/21',
    '46.102.128.0/20', '46.102.184.0/22', '46.143.0.0/17', '46.143.204.0/22',
    '46.143.208.0/21', '46.143.244.0/22', '46.143.248.0/22', '46.148.32.0/20',
    '46.164.64.0/18', '46.167.128.0/19', '46.182.32.0/21', '46.209.0.0/16',
    '46.224.0.0/15', '46.235.76.0/23', '46.245.0.0/17', '46.248.32.0/19',
    '46.249.96.0/24', '46.249.120.0/21', '46.251.224.0/24', '46.251.226.0/24',
    '46.251.237.0/24', '46.255.216.0/21', '62.3.14.0/24', '62.3.41.0/24',
    '62.3.42.0/24', '62.32.49.0/24', '62.32.50.0/23', '62.32.53.0/24',
    '62.32.61.0/24', '62.60.128.0/19', '62.60.160.0/21', '62.102.128.0/20',
    '62.133.46.0/24', '62.193.0.0/19', '62.204.61.0/24', '62.220.96.0/19',
    '63.243.185.0/24', '64.214.116.0/23', '66.79.96.0/19', '69.194.64.0/18'
];

// CIDR های چین (لیست پایه)
const CHINA_CIDR_LIST = [
    '1.0.1.0/24', '1.0.2.0/23', '1.0.8.0/21', '1.0.32.0/19',
    '1.1.0.0/24', '1.1.2.0/23', '1.1.4.0/22', '1.1.8.0/24',
    '1.2.0.0/23', '1.2.2.0/24', '1.2.4.0/24', '1.2.5.0/24',
    '1.2.6.0/23', '1.2.8.0/24', '1.2.9.0/24', '1.2.10.0/23',
    '1.2.12.0/22', '1.2.16.0/20', '1.2.32.0/19', '1.2.64.0/18',
    '1.3.0.0/16', '1.4.1.0/24', '1.4.2.0/23', '1.4.4.0/24',
    '1.4.5.0/24', '1.4.6.0/23', '1.4.8.0/21', '1.4.16.0/20',
    '1.4.32.0/19', '1.4.64.0/18', '1.8.0.0/16', '1.10.0.0/21',
    '1.10.8.0/23', '1.10.11.0/24', '1.10.12.0/22', '1.10.16.0/20',
    '1.10.32.0/19', '1.10.64.0/18', '1.12.0.0/14', '1.24.0.0/13',
    '1.45.0.0/16', '1.48.0.0/15', '1.50.0.0/16', '1.51.0.0/16',
    '1.56.0.0/13', '1.68.0.0/14', '1.80.0.0/13', '1.88.0.0/14',
    '1.92.0.0/15', '1.94.0.0/15', '1.116.0.0/14', '1.180.0.0/14',
    '1.184.0.0/15', '1.188.0.0/14', '1.192.0.0/13', '1.202.0.0/15',
    '1.204.0.0/14', '14.0.0.0/21', '14.1.0.0/22', '14.16.0.0/12',
    '14.104.0.0/13', '14.112.0.0/12', '14.134.0.0/15', '14.144.0.0/12',
    '14.192.60.0/22', '14.192.76.0/22', '14.196.0.0/15', '14.204.0.0/15',
    '14.208.0.0/12', '23.80.54.0/24', '23.91.97.0/24', '23.91.98.0/23',
    '23.91.100.0/22', '23.91.104.0/21', '23.91.112.0/20', '27.8.0.0/13',
    '27.16.0.0/12', '27.36.0.0/14', '27.40.0.0/13', '27.50.40.0/21',
    '27.50.128.0/17', '27.54.72.0/21', '27.54.152.0/21', '27.98.208.0/20',
    '27.98.224.0/19', '27.99.128.0/17', '27.103.0.0/16', '27.106.128.0/18',
    '27.106.204.0/22', '27.109.32.0/19', '27.112.0.0/18', '27.112.80.0/20',
    '27.113.128.0/18', '27.115.0.0/17', '27.116.44.0/22', '27.121.72.0/21',
    '27.121.120.0/21', '27.128.0.0/15', '27.131.220.0/22', '27.148.0.0/14',
    '27.152.0.0/13', '27.184.0.0/13', '27.192.0.0/11', '27.224.0.0/14'
];

// دامنه‌های ایرانی (TLD و پرکاربرد)
const IRAN_DOMAINS = [
    '.ir', '.co.ir', '.ac.ir', '.gov.ir', '.org.ir', '.net.ir', '.sch.ir',
    'digikala.com', 'divar.ir', 'aparat.com', 'varzesh3.com', 'telewebion.com',
    'namnak.com', 'zoomit.ir', 'tebyan.net', 'yjc.ir', 'isna.ir', 'irna.ir',
    'mehrnews.com', 'tasnimnews.com', 'farsnews.ir', 'khabaronline.ir',
    'tabnak.ir', 'entekhab.ir', 'mashreghnews.ir', 'alef.ir', 'asriran.com',
    'eghtesadonline.com', 'donya-e-eqtesad.com', 'boursenews.ir', 'tsetmc.com',
    'shaparak.ir', 'sep.ir', 'bmi.ir', 'mellat.ir', 'parsianbank.ir',
    'saman.ir', 'pasargadbank.ir', 'tejarat.ir', 'bpi.ir', 'keshavarzibank.ir',
    'snapp.ir', 'tapsi.ir', 'alibaba.ir', 'flightio.com', 'mrbilit.com',
    'fidibo.com', 'taaghche.com', 'ketabrah.ir', 'gisoom.com', 'adinebook.com',
    'filimo.com', 'namava.ir', 'telewebion.com', 'rubika.ir', 'eitaa.com',
    'bale.ai', 'igap.net', 'soroush-app.ir', 'gap.im'
];

// دامنه‌های تبلیغاتی برای بلاک
const AD_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'facebook.com/tr', 'connect.facebook.net', 'analytics.twitter.com',
    'ads.yahoo.com', 'advertising.com', 'adnxs.com', 'adsrvr.org',
    'criteo.com', 'criteo.net', 'outbrain.com', 'taboola.com',
    'moatads.com', 'scorecardresearch.com', 'quantserve.com',
    'adsafeprotected.com', 'doubleverify.com', 'serving-sys.com',
    'adform.net', 'pubmatic.com', 'rubiconproject.com', 'openx.net',
    'casalemedia.com', 'contextweb.com', 'spotxchange.com', 'smartadserver.com',
    'yieldmo.com', 'sharethrough.com', 'triplelift.com', 'indexww.com',
    'amazon-adsystem.com', 'media.net', 'revcontent.com', 'mgid.com',
    'zedo.com', 'bidswitch.net', 'lijit.com', 'sovrn.com'
];

/**
 * تبدیل CIDR به محدوده IP
 */
function cidrToRange(cidr) {
    const [ip, prefix] = cidr.split('/');
    const prefixNum = parseInt(prefix);
    const ipParts = ip.split('.').map(p => parseInt(p));
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const mask = ~((1 << (32 - prefixNum)) - 1);
    const start = (ipNum & mask) >>> 0;
    const end = (start | ~mask) >>> 0;
    return { start, end };
}

/**
 * تبدیل IP به عدد
 */
function ipToNumber(ip) {
    const parts = ip.split('.').map(p => parseInt(p));
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * بررسی آیا IP در لیست CIDR است
 */
function isIPInCIDRList(ip, cidrList) {
    const ipNum = ipToNumber(ip);
    
    for (const cidr of cidrList) {
        const range = cidrToRange(cidr);
        if (ipNum >= range.start && ipNum <= range.end) {
            return true;
        }
    }
    
    return false;
}

/**
 * بررسی آیا IP ایرانی است
 */
export function isIranianIP(ip) {
    // فقط IPv4
    if (!ip || ip.includes(':')) return false;
    return isIPInCIDRList(ip, IRAN_CIDR_LIST);
}

/**
 * بررسی آیا IP چینی است
 */
export function isChineseIP(ip) {
    if (!ip || ip.includes(':')) return false;
    return isIPInCIDRList(ip, CHINA_CIDR_LIST);
}

/**
 * بررسی آیا دامنه ایرانی است
 */
export function isIranianDomain(domain) {
    if (!domain) return false;
    const lowerDomain = domain.toLowerCase();
    
    // بررسی TLD
    for (const tld of IRAN_DOMAINS) {
        if (tld.startsWith('.')) {
            if (lowerDomain.endsWith(tld)) return true;
        } else {
            if (lowerDomain === tld || lowerDomain.endsWith('.' + tld)) return true;
        }
    }
    
    return false;
}

/**
 * بررسی آیا دامنه تبلیغاتی است
 */
export function isAdDomain(domain) {
    if (!domain) return false;
    const lowerDomain = domain.toLowerCase();
    
    for (const adDomain of AD_DOMAINS) {
        if (lowerDomain === adDomain || lowerDomain.endsWith('.' + adDomain)) {
            return true;
        }
    }
    
    return false;
}

/**
 * تعیین نوع مسیریابی برای یک آدرس
 * @returns {'direct' | 'proxy' | 'block'}
 */
export function determineRouting(address, options = {}) {
    const {
        enableIranDirect = true,
        enableChinaDirect = false,
        enableAdBlock = true
    } = options;
    
    // بررسی تبلیغات
    if (enableAdBlock && isAdDomain(address)) {
        return 'block';
    }
    
    // بررسی ایران
    if (enableIranDirect) {
        if (isIranianDomain(address) || isIranianIP(address)) {
            return 'direct';
        }
    }
    
    // بررسی چین
    if (enableChinaDirect) {
        if (isChineseIP(address)) {
            return 'direct';
        }
    }
    
    return 'proxy';
}

/**
 * تولید قوانین مسیریابی برای Sing-box
 */
export function generateSingboxRules(options = {}) {
    const {
        enableIranDirect = true,
        enableChinaDirect = false,
        enableAdBlock = true,
        useRemoteRules = true
    } = options;
    
    const rules = [];
    
    // قوانین بلاک تبلیغات
    if (enableAdBlock) {
        if (useRemoteRules) {
            rules.push({
                rule_set: 'geosite-category-ads-all',
                outbound: 'block'
            });
        } else {
            rules.push({
                domain_suffix: AD_DOMAINS,
                outbound: 'block'
            });
        }
    }
    
    // قوانین ایران
    if (enableIranDirect) {
        if (useRemoteRules) {
            rules.push({
                rule_set: 'geosite-ir',
                outbound: 'direct'
            });
            rules.push({
                rule_set: 'geoip-ir',
                outbound: 'direct'
            });
        } else {
            rules.push({
                domain_suffix: IRAN_DOMAINS.filter(d => d.startsWith('.')).map(d => d.substring(1)),
                outbound: 'direct'
            });
            rules.push({
                domain: IRAN_DOMAINS.filter(d => !d.startsWith('.')),
                outbound: 'direct'
            });
        }
    }
    
    // قوانین چین
    if (enableChinaDirect) {
        if (useRemoteRules) {
            rules.push({
                rule_set: 'geosite-cn',
                outbound: 'direct'
            });
            rules.push({
                rule_set: 'geoip-cn',
                outbound: 'direct'
            });
        }
    }
    
    return rules;
}

/**
 * تولید rule_set های ریموت برای Sing-box
 */
export function generateSingboxRuleSets(options = {}) {
    const {
        enableIranDirect = true,
        enableChinaDirect = false,
        enableAdBlock = true
    } = options;
    
    const ruleSets = [];
    
    if (enableAdBlock) {
        ruleSets.push({
            tag: 'geosite-category-ads-all',
            type: 'remote',
            format: 'binary',
            url: GEO_SOURCES.GEOSITE_ADS,
            download_detour: 'direct'
        });
    }
    
    if (enableIranDirect) {
        ruleSets.push({
            tag: 'geosite-ir',
            type: 'remote',
            format: 'binary',
            url: GEO_SOURCES.GEOSITE_IR,
            download_detour: 'direct'
        });
        ruleSets.push({
            tag: 'geoip-ir',
            type: 'remote',
            format: 'binary',
            url: GEO_SOURCES.GEOIP_IR,
            download_detour: 'direct'
        });
    }
    
    if (enableChinaDirect) {
        ruleSets.push({
            tag: 'geosite-cn',
            type: 'remote',
            format: 'binary',
            url: GEO_SOURCES.GEOSITE_CN,
            download_detour: 'direct'
        });
        ruleSets.push({
            tag: 'geoip-cn',
            type: 'remote',
            format: 'binary',
            url: GEO_SOURCES.GEOIP_CN,
            download_detour: 'direct'
        });
    }
    
    return ruleSets;
}

/**
 * تولید قوانین مسیریابی برای V2Ray/Xray
 */
export function generateV2rayRules(options = {}) {
    const {
        enableIranDirect = true,
        enableChinaDirect = false,
        enableAdBlock = true
    } = options;
    
    const rules = [];
    
    // بلاک تبلیغات
    if (enableAdBlock) {
        rules.push({
            type: 'field',
            domain: ['geosite:category-ads-all'],
            outboundTag: 'block'
        });
    }
    
    // ایران
    if (enableIranDirect) {
        rules.push({
            type: 'field',
            domain: ['geosite:ir', 'regexp:\\.ir$'],
            outboundTag: 'direct'
        });
        rules.push({
            type: 'field',
            ip: ['geoip:ir'],
            outboundTag: 'direct'
        });
    }
    
    // چین
    if (enableChinaDirect) {
        rules.push({
            type: 'field',
            domain: ['geosite:cn'],
            outboundTag: 'direct'
        });
        rules.push({
            type: 'field',
            ip: ['geoip:cn'],
            outboundTag: 'direct'
        });
    }
    
    return rules;
}

/**
 * تولید کانفیگ کامل مسیریابی برای Sing-box
 */
export function generateFullSingboxRouting(options = {}) {
    const rules = generateSingboxRules(options);
    const ruleSets = generateSingboxRuleSets(options);
    
    return {
        route: {
            rules: [
                // DNS
                { protocol: 'dns', outbound: 'dns-out' },
                // قوانین سفارشی
                ...rules,
                // پیش‌فرض
                { final: 'proxy' }
            ],
            rule_set: ruleSets,
            auto_detect_interface: true
        }
    };
}

/**
 * دریافت لیست CIDR های ایران
 */
export function getIranCIDRList() {
    return [...IRAN_CIDR_LIST];
}

/**
 * دریافت لیست CIDR های چین
 */
export function getChinaCIDRList() {
    return [...CHINA_CIDR_LIST];
}

/**
 * دریافت لیست دامنه‌های ایرانی
 */
export function getIranDomainList() {
    return [...IRAN_DOMAINS];
}

/**
 * دریافت لیست دامنه‌های تبلیغاتی
 */
export function getAdDomainList() {
    return [...AD_DOMAINS];
}

/**
 * دریافت منابع GeoIP/GeoSite
 */
export function getGeoSources() {
    return { ...GEO_SOURCES };
}

/**
 * بررسی سلامت منابع GeoIP/GeoSite
 */
export async function checkGeoSourcesHealth() {
    const results = {};
    
    for (const [name, url] of Object.entries(GEO_SOURCES)) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            results[name] = {
                available: response.ok,
                status: response.status
            };
        } catch (error) {
            results[name] = {
                available: false,
                error: error.message
            };
        }
    }
    
    return results;
}
