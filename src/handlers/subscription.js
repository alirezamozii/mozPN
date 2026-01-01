// =============================================
// MozPN - مدیریت اشتراک
// با قابلیت پیش‌نمایش و خلاصه کامل
// =============================================

import { generateVlessLinksFromList, generateXhttpLinksFromList } from '../protocols/vless.js';
import { generateTrojanLinksFromList } from '../protocols/trojan.js';
import { getSelectedCountries, getCustomProxies, getConfigValue } from '../services/kvStore.js';
import { getActiveCountries, getAllProxyIPsForSelectedCountries } from '../services/countryManager.js';
import { DEFAULT_PROXY_IPS, DIRECT_DOMAINS, DEFAULT_PREFERRED_IP_URL, REGION_CONFIG } from '../config/constants.js';
import { randomSelect, toBase64, jsonResponse } from '../utils/helpers.js';
import { getWarpConfig, generateWarpLinks } from '../services/warpManager.js';

/**
 * پیش‌نمایش و خلاصه اشتراک
 * نشون میده چه کانفیگ‌هایی با چه تنظیماتی ساخته میشه
 */
export async function getSubscriptionPreview(request, uuid, workerDomain) {
    // دریافت تنظیمات
    const enableVless = getConfigValue('ev', 'yes') !== 'no';
    const enableTrojan = getConfigValue('et', 'no') === 'yes';
    const enableXhttp = getConfigValue('ex', 'no') === 'yes';
    const disableNonTLS = getConfigValue('dkby', 'no') === 'yes';
    const disablePreferred = getConfigValue('yxby', 'no') === 'yes';
    const enablePreferredDomains = getConfigValue('epd', 'no') === 'yes';
    const enablePreferredIPs = getConfigValue('epi', 'yes') !== 'no';
    const enableGitHubIPs = getConfigValue('egi', 'yes') !== 'no';
    const randomMode = getConfigValue('randomMode', 'no') === 'yes';
    const totalIPCount = parseInt(getConfigValue('totalIPCount', '10'));
    const warpEnabled = getConfigValue('warpEnabled', 'no') === 'yes';
    const remarkPrefix = getConfigValue('remarkPrefix', 'MozPN');
    
    // تعداد هر پروتکل
    const vlessCountSetting = getConfigValue('vlessCount', 'all');
    const trojanCountSetting = getConfigValue('trojanCount', 'all');
    const xhttpCountSetting = getConfigValue('xhttpCount', 'all');
    
    // دریافت کشورهای انتخاب‌شده
    const selectedCountries = getActiveCountries();
    const customProxies = getCustomProxies();
    
    // محاسبه تعداد نودها به تفکیک
    const summary = {
        settings: {
            protocols: {
                vless: enableVless,
                trojan: enableTrojan,
                xhttp: enableXhttp
            },
            protocolCounts: {
                vless: vlessCountSetting,
                trojan: trojanCountSetting,
                xhttp: xhttpCountSetting
            },
            options: {
                randomMode,
                totalIPCount,
                disableNonTLS,
                remarkPrefix
            },
            // ===== تنظیمات نام‌گذاری پیشرفته =====
            naming: {
                format: getConfigValue('nodeNameFormat', 'country-user'),
                customFormat: getConfigValue('customNodeFormat', ''),
                separator: getConfigValue('remarkSeparator', ' | '),
                indexStart: getConfigValue('indexStart', '1'),
                indexPadding: getConfigValue('indexPadding', '2'),
                indexPerCountry: getConfigValue('indexPerCountry', 'yes'),
                indexPerProtocol: getConfigValue('indexPerProtocol', 'no')
            }
        },
        sources: {
            worker: {
                name: 'Worker Native',
                count: 1,
                description: 'آدرس مستقیم Worker'
            },
            countries: [],
            customProxies: [],
            cleanIPs: {
                preferredDomains: enablePreferredDomains && !disablePreferred,
                preferredIPs: enablePreferredIPs && !disablePreferred,
                githubIPs: enableGitHubIPs && !disablePreferred
            },
            warp: {
                enabled: warpEnabled,
                count: warpEnabled ? selectedCountries.length : 0
            }
        },
        totals: {
            byCountry: {},
            byProtocol: {},
            totalNodes: 0,
            totalConfigs: 0
        },
        // شبیه‌سازی دقیق - لیست نودهایی که ساخته میشن
        simulation: {
            nodes: [],
            randomSample: []
        }
    };
    
    // لیست همه نودها برای شبیه‌سازی
    let allSimulatedNodes = [];
    
    // 1. Worker Native
    allSimulatedNodes.push({
        type: 'worker',
        ip: workerDomain,
        port: 443,
        country: 'Worker',
        emoji: '🔧',
        source: 'Worker-Native',
        name: `${remarkPrefix} | 🔧 Worker`
    });
    
    // محاسبه نودهای هر کشور
    let totalCountryNodes = 0;
    for (const country of selectedCountries) {
        const ipCount = parseInt(country.ipCount) || 3;
        const countryCode = country.code;
        const countryName = country.name;
        const emoji = country.emoji || REGION_CONFIG[countryCode]?.emoji || '🌐';
        
        // پیدا کردن ProxyIP های موجود برای این کشور
        const availableProxies = DEFAULT_PROXY_IPS.filter(p => 
            p.region === countryCode || p.regionCode === countryCode
        );
        
        const countryInfo = {
            code: countryCode,
            name: countryName,
            emoji: emoji,
            requestedCount: ipCount,
            availableProxies: availableProxies.length,
            proxyUrl: country.proxyUrl || null,
            sources: availableProxies.map(p => p.source).filter((v, i, a) => a.indexOf(v) === i)
        };
        
        summary.sources.countries.push(countryInfo);
        summary.totals.byCountry[countryCode] = ipCount;
        totalCountryNodes += ipCount;
        
        // شبیه‌سازی نودهای این کشور
        if (country.proxyUrl) {
            // URL سفارشی
            for (let i = 0; i < ipCount; i++) {
                allSimulatedNodes.push({
                    type: 'country_custom',
                    ip: `[از ${country.proxyUrl}]`,
                    port: 443,
                    country: countryName,
                    emoji: emoji,
                    source: 'Custom URL',
                    name: `${remarkPrefix} | ${emoji} ${countryName} #${i + 1}`
                });
            }
        } else if (availableProxies.length > 0) {
            // ProxyIP پیش‌فرض
            for (let i = 0; i < ipCount; i++) {
                const proxy = availableProxies[i % availableProxies.length];
                allSimulatedNodes.push({
                    type: 'country_proxy',
                    ip: proxy.domain,
                    port: proxy.port,
                    country: countryName,
                    emoji: emoji,
                    source: proxy.source,
                    name: `${remarkPrefix} | ${emoji} ${countryName} #${i + 1}`
                });
            }
        }
    }
    
    // پروکسی‌های سفارشی
    let totalCustomNodes = 0;
    for (const proxy of customProxies) {
        if (!proxy.address) continue;
        const ipCount = parseInt(proxy.ipCount) || 3;
        
        summary.sources.customProxies.push({
            name: proxy.name || 'Custom',
            address: proxy.address,
            port: proxy.port || 443,
            count: ipCount
        });
        totalCustomNodes += ipCount;
        
        // شبیه‌سازی
        for (let i = 0; i < ipCount; i++) {
            allSimulatedNodes.push({
                type: 'custom',
                ip: proxy.address,
                port: parseInt(proxy.port) || 443,
                country: 'Custom',
                emoji: '🔧',
                source: proxy.name || 'Custom',
                name: `${remarkPrefix} | 🔧 ${proxy.name || 'Custom'} #${i + 1}`
            });
        }
    }
    
    // محاسبه کل نودها
    let totalBaseNodes = 1 + totalCountryNodes + totalCustomNodes; // Worker + Countries + Custom
    
    // تخمین IP های تمیز (اگه فعال باشن)
    let estimatedCleanIPs = 0;
    if (enablePreferredDomains && !disablePreferred) {
        estimatedCleanIPs += DIRECT_DOMAINS.length;
        // شبیه‌سازی دامنه‌های مستقیم
        DIRECT_DOMAINS.slice(0, 5).forEach((d, i) => {
            allSimulatedNodes.push({
                type: 'clean_domain',
                ip: d.domain,
                port: 443,
                country: 'Clean IP',
                emoji: '🧹',
                source: 'Direct Domain',
                name: `${remarkPrefix} | 🧹 ${d.name || d.domain}`
            });
        });
        if (DIRECT_DOMAINS.length > 5) {
            allSimulatedNodes.push({
                type: 'clean_domain',
                ip: `... و ${DIRECT_DOMAINS.length - 5} دامنه دیگر`,
                port: 443,
                country: 'Clean IP',
                emoji: '🧹',
                source: 'Direct Domain',
                name: `${remarkPrefix} | 🧹 سایر دامنه‌ها`
            });
        }
    }
    if (enablePreferredIPs && !disablePreferred) {
        estimatedCleanIPs += 20; // تخمین
        allSimulatedNodes.push({
            type: 'clean_wetest',
            ip: '[از Wetest - ~20 IP]',
            port: 443,
            country: 'Clean IP',
            emoji: '📡',
            source: 'Wetest Dynamic',
            name: `${remarkPrefix} | 📡 Wetest IPs`
        });
    }
    if (enableGitHubIPs && !disablePreferred) {
        estimatedCleanIPs += 15; // تخمین
        allSimulatedNodes.push({
            type: 'clean_github',
            ip: '[از GitHub - ~15 IP]',
            port: 443,
            country: 'Clean IP',
            emoji: '🐙',
            source: 'GitHub List',
            name: `${remarkPrefix} | 🐙 GitHub IPs`
        });
    }
    
    totalBaseNodes += estimatedCleanIPs;
    
    // ذخیره همه نودها
    summary.simulation.nodes = allSimulatedNodes;
    
    // اگه حالت رندوم فعاله
    let finalNodeCount = totalBaseNodes;
    if (randomMode && totalBaseNodes > totalIPCount) {
        finalNodeCount = totalIPCount;
        // نمونه رندوم برای شبیه‌سازی
        summary.simulation.randomSample = randomSelect([...allSimulatedNodes], totalIPCount);
        summary.simulation.isRandom = true;
        summary.simulation.originalCount = totalBaseNodes;
    } else {
        summary.simulation.isRandom = false;
    }
    
    // ===== محاسبه تعداد کانفیگ هر پروتکل =====
    function calcProtocolCount(setting, nodeCount) {
        if (setting === 'all' || setting === '') return nodeCount;
        const num = parseInt(setting);
        return (isNaN(num) || num <= 0) ? nodeCount : Math.min(num, nodeCount);
    }
    
    const vlessConfigCount = enableVless ? calcProtocolCount(vlessCountSetting, finalNodeCount) : 0;
    const trojanConfigCount = enableTrojan ? calcProtocolCount(trojanCountSetting, finalNodeCount) : 0;
    const xhttpConfigCount = enableXhttp ? calcProtocolCount(xhttpCountSetting, finalNodeCount) : 0;
    
    const totalConfigs = vlessConfigCount + trojanConfigCount + xhttpConfigCount;
    
    // WARP
    let warpConfigCount = 0;
    if (warpEnabled) {
        warpConfigCount = selectedCountries.length || 1;
        // شبیه‌سازی WARP
        for (const country of selectedCountries) {
            summary.simulation.nodes.push({
                type: 'warp',
                ip: 'engage.cloudflareclient.com',
                port: 2408,
                country: country.name,
                emoji: '🌐',
                source: 'WARP',
                name: `${remarkPrefix} | 🌐 WARP ${country.emoji} ${country.name}`
            });
        }
    }
    
    summary.totals.totalNodes = finalNodeCount;
    summary.totals.totalConfigs = totalConfigs + warpConfigCount;
    summary.totals.byProtocol = {
        vless: vlessConfigCount,
        trojan: trojanConfigCount,
        xhttp: xhttpConfigCount,
        warp: warpConfigCount
    };
    
    // ساخت پیش‌نمایش متنی
    const preview = generateTextPreview(summary, selectedCountries);
    
    return {
        summary,
        preview,
        timestamp: new Date().toISOString()
    };
}

/**
 * ساخت پیش‌نمایش متنی خوانا با شبیه‌سازی دقیق
 */
function generateTextPreview(summary, selectedCountries) {
    const lines = [];
    
    lines.push('╔══════════════════════════════════════════════════════════╗');
    lines.push('║           📋 خلاصه و شبیه‌سازی اشتراک MozPN v3.0         ║');
    lines.push('╠══════════════════════════════════════════════════════════╣');
    
    // پروتکل‌ها
    lines.push('║ 🔧 پروتکل‌ها:');
    if (summary.settings.protocols.vless) {
        const count = summary.settings.protocolCounts.vless;
        lines.push(`║    ✅ VLESS: ${count === 'all' ? 'همه نودها' : count + ' کانفیگ'}`);
    }
    if (summary.settings.protocols.trojan) {
        const count = summary.settings.protocolCounts.trojan;
        lines.push(`║    ✅ Trojan: ${count === 'all' ? 'همه نودها' : count + ' کانفیگ'}`);
    }
    if (summary.settings.protocols.xhttp) {
        const count = summary.settings.protocolCounts.xhttp;
        lines.push(`║    ✅ XHTTP: ${count === 'all' ? 'همه نودها' : count + ' کانفیگ'}`);
    }
    if (!summary.settings.protocols.vless && !summary.settings.protocols.trojan && !summary.settings.protocols.xhttp) {
        lines.push('║    ❌ هیچ پروتکلی فعال نیست!');
    }
    
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ 🌍 سرورها به تفکیک کشور:');
    
    // کشورها
    if (selectedCountries.length === 0) {
        lines.push('║    ⚠️ هیچ کشوری انتخاب نشده (پیش‌فرض)');
    } else {
        for (const country of summary.sources.countries) {
            const sources = country.sources.length > 0 ? country.sources.join(', ') : 'پیش‌فرض';
            lines.push(`║    ${country.emoji} ${country.name}: ${country.requestedCount} نود`);
            lines.push(`║       └─ منبع: ${sources}`);
            if (country.proxyUrl) {
                lines.push(`║       └─ URL سفارشی: ${country.proxyUrl.substring(0, 40)}...`);
            }
        }
    }
    
    // پروکسی‌های سفارشی
    if (summary.sources.customProxies.length > 0) {
        lines.push('║');
        lines.push('║ 🔧 پروکسی‌های سفارشی:');
        for (const proxy of summary.sources.customProxies) {
            lines.push(`║    📌 ${proxy.name}: ${proxy.count} نود`);
            lines.push(`║       └─ ${proxy.address}:${proxy.port}`);
        }
    }
    
    // IP های تمیز
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ 🧹 IP های تمیز:');
    lines.push(`║    ${summary.sources.cleanIPs.preferredDomains ? '✅' : '❌'} دامنه‌های مستقیم`);
    lines.push(`║    ${summary.sources.cleanIPs.preferredIPs ? '✅' : '❌'} IP های بهینه (Wetest)`);
    lines.push(`║    ${summary.sources.cleanIPs.githubIPs ? '✅' : '❌'} IP های GitHub`);
    
    // WARP
    if (summary.sources.warp.enabled) {
        lines.push('╠══════════════════════════════════════════════════════════╣');
        lines.push('║ 🌐 WARP:');
        lines.push(`║    ✅ فعال - ${summary.sources.warp.count} نود`);
    }
    
    // تنظیمات
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ ⚙️ تنظیمات:');
    lines.push(`║    ${summary.settings.options.randomMode ? '🔀 حالت رندوم: فعال' : '📋 حالت رندوم: غیرفعال'}`);
    if (summary.settings.options.randomMode) {
        lines.push(`║    └─ حداکثر: ${summary.settings.options.totalIPCount} نود از ${summary.simulation?.originalCount || 'کل'}`);
    }
    lines.push(`║    🏷️ پیشوند نام: ${summary.settings.options.remarkPrefix}`);
    
    // ===== تنظیمات نام‌گذاری =====
    if (summary.settings.naming) {
        lines.push('║');
        lines.push('║ 📝 نام‌گذاری کانفیگ‌ها:');
        const formatNames = {
            'country-user': 'کشور - کاربر',
            'user-country': 'کاربر - کشور',
            'country-only': 'فقط کشور',
            'user-only': 'فقط کاربر',
            'indexed': 'با شماره ردیف',
            'protocol-indexed': 'پروتکل + شماره',
            'custom': 'سفارشی'
        };
        lines.push(`║    📋 فرمت: ${formatNames[summary.settings.naming.format] || summary.settings.naming.format}`);
        if (summary.settings.naming.format === 'custom' && summary.settings.naming.customFormat) {
            lines.push(`║    └─ الگو: ${summary.settings.naming.customFormat}`);
        }
        lines.push(`║    🔢 شماره‌گذاری: شروع از ${summary.settings.naming.indexStart} | ${summary.settings.naming.indexPadding} رقم`);
        lines.push(`║    └─ ${summary.settings.naming.indexPerCountry === 'yes' ? 'جدا برای هر کشور' : 'شماره‌گذاری کلی'}`);
    }
    
    // جمع‌بندی
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ 📊 جمع‌بندی نهایی:');
    lines.push(`║    📍 تعداد کل نودها: ${summary.totals.totalNodes}`);
    lines.push(`║    📄 تعداد کل کانفیگ‌ها: ${summary.totals.totalConfigs}`);
    lines.push('║');
    lines.push('║    به تفکیک پروتکل:');
    if (summary.totals.byProtocol.vless > 0) lines.push(`║      • VLESS: ${summary.totals.byProtocol.vless}`);
    if (summary.totals.byProtocol.trojan > 0) lines.push(`║      • Trojan: ${summary.totals.byProtocol.trojan}`);
    if (summary.totals.byProtocol.xhttp > 0) lines.push(`║      • XHTTP: ${summary.totals.byProtocol.xhttp}`);
    if (summary.totals.byProtocol.warp > 0) lines.push(`║      • WARP: ${summary.totals.byProtocol.warp}`);
    
    // شبیه‌سازی نودها
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ 🎯 شبیه‌سازی نودهایی که ساخته می‌شوند:');
    lines.push('║');
    
    if (summary.simulation && summary.simulation.nodes) {
        const nodesToShow = summary.simulation.isRandom 
            ? summary.simulation.randomSample 
            : summary.simulation.nodes;
        
        if (summary.simulation.isRandom) {
            lines.push(`║    ⚠️ حالت رندوم فعال - نمونه ${summary.settings.options.totalIPCount} از ${summary.simulation.originalCount}:`);
            lines.push('║');
        }
        
        // گروه‌بندی بر اساس نوع
        const byType = {};
        for (const node of nodesToShow) {
            const type = node.type;
            if (!byType[type]) byType[type] = [];
            byType[type].push(node);
        }
        
        // نمایش Worker
        if (byType['worker']) {
            lines.push('║    🔧 Worker Native:');
            for (const n of byType['worker']) {
                lines.push(`║       • ${n.name}`);
            }
        }
        
        // نمایش کشورها
        const countryTypes = ['country_proxy', 'country_custom'];
        for (const type of countryTypes) {
            if (byType[type]) {
                const label = type === 'country_custom' ? '🌍 کشورها (URL سفارشی):' : '🌍 کشورها (ProxyIP):';
                lines.push(`║    ${label}`);
                for (const n of byType[type]) {
                    lines.push(`║       • ${n.name}`);
                    lines.push(`║         └─ ${n.ip}:${n.port} [${n.source}]`);
                }
            }
        }
        
        // نمایش پروکسی سفارشی
        if (byType['custom']) {
            lines.push('║    🔧 پروکسی سفارشی:');
            for (const n of byType['custom']) {
                lines.push(`║       • ${n.name}`);
                lines.push(`║         └─ ${n.ip}:${n.port}`);
            }
        }
        
        // نمایش Clean IPs
        const cleanTypes = ['clean_domain', 'clean_wetest', 'clean_github'];
        let hasClean = false;
        for (const type of cleanTypes) {
            if (byType[type]) {
                if (!hasClean) {
                    lines.push('║    🧹 IP های تمیز:');
                    hasClean = true;
                }
                for (const n of byType[type]) {
                    lines.push(`║       • ${n.name}`);
                }
            }
        }
        
        // نمایش WARP
        if (byType['warp']) {
            lines.push('║    🌐 WARP:');
            for (const n of byType['warp']) {
                lines.push(`║       • ${n.name}`);
            }
        }
    }
    
    lines.push('╚══════════════════════════════════════════════════════════╝');
    
    return lines.join('\n');
}

/**
 * API پیش‌نمایش اشتراک
 */
export async function handleSubscriptionPreviewAPI(request, uuid, workerDomain) {
    try {
        const preview = await getSubscriptionPreview(request, uuid, workerDomain);
        
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'json';
        
        if (format === 'text') {
            return new Response(preview.preview, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
        
        return jsonResponse({
            success: true,
            ...preview
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * ساخت اشتراک - دقیقا مثل کد قدیمی
 */
export async function generateSubscription(request, uuid, workerDomain) {
    const url = new URL(request.url);
    const target = url.searchParams.get('target') || 'base64';
    
    const links = [];
    
    // دریافت تنظیمات
    const enableVless = getConfigValue('ev', 'yes') !== 'no';
    const enableTrojan = getConfigValue('et', 'no') === 'yes';
    const enableXhttp = getConfigValue('ex', 'no') === 'yes';
    const trojanPassword = getConfigValue('tp', '');
    const disableNonTLS = getConfigValue('dkby', 'no') === 'yes';
    const disablePreferred = getConfigValue('yxby', 'no') === 'yes';
    const enablePreferredDomains = getConfigValue('epd', 'no') === 'yes';
    const enablePreferredIPs = getConfigValue('epi', 'yes') !== 'no';
    const enableGitHubIPs = getConfigValue('egi', 'yes') !== 'no';
    const randomMode = getConfigValue('randomMode', 'no') === 'yes';
    const totalIPCount = parseInt(getConfigValue('totalIPCount', '10'));
    const customYx = getConfigValue('yx', '');
    const customYxURL = getConfigValue('yxURL', '');
    
    // ===== تعداد کانفیگ هر پروتکل =====
    // all = همه نودها، یا عدد مشخص
    const vlessCountSetting = getConfigValue('vlessCount', 'all');
    const trojanCountSetting = getConfigValue('trojanCount', 'all');
    const xhttpCountSetting = getConfigValue('xhttpCount', 'all');
    
    // تنظیمات نمایش نود
    const nodeNameFormat = getConfigValue('nodeNameFormat', 'country-user');
    const customNodeFormat = getConfigValue('customNodeFormat', '');
    const remarkPrefix = getConfigValue('remarkPrefix', 'MozPN');
    const remarkSeparator = getConfigValue('remarkSeparator', ' | ');
    
    // ===== تنظیمات شماره‌گذاری پیشرفته =====
    const indexStart = parseInt(getConfigValue('indexStart', '1')) || 1;
    const indexPadding = parseInt(getConfigValue('indexPadding', '2')) || 2;
    const indexPerCountry = getConfigValue('indexPerCountry', 'yes') === 'yes';
    const indexPerProtocol = getConfigValue('indexPerProtocol', 'no') === 'yes';
    
    // شمارنده‌های ایندکس
    const indexCounters = {
        global: indexStart - 1,
        byCountry: {},
        byProtocol: {}
    };
    
    // دریافت کشورهای انتخاب‌شده از سرویس مرکزی
    const selectedCountries = getActiveCountries();
    
    // دریافت پروکسی‌های سفارشی
    const customProxies = getCustomProxies();
    
    /**
     * فرمت کردن شماره با padding
     * @param {number} num - شماره
     * @param {number} padding - تعداد رقم
     * @returns {string} - شماره فرمت شده
     */
    function formatIndex(num, padding = indexPadding) {
        return String(num).padStart(padding, '0');
    }
    
    /**
     * دریافت شماره بعدی بر اساس تنظیمات
     * @param {string} country - کد کشور
     * @param {string} protocol - نام پروتکل
     * @returns {number} - شماره بعدی
     */
    function getNextIndex(country = '', protocol = '') {
        if (indexPerProtocol && protocol) {
            const key = `${country}_${protocol}`;
            if (!indexCounters.byProtocol[key]) {
                indexCounters.byProtocol[key] = indexStart - 1;
            }
            indexCounters.byProtocol[key]++;
            return indexCounters.byProtocol[key];
        }
        
        if (indexPerCountry && country) {
            if (!indexCounters.byCountry[country]) {
                indexCounters.byCountry[country] = indexStart - 1;
            }
            indexCounters.byCountry[country]++;
            return indexCounters.byCountry[country];
        }
        
        indexCounters.global++;
        return indexCounters.global;
    }
    
    /**
     * تابع فرمت کردن نام نود - پیشرفته با شماره ردیف
     * متغیرهای پشتیبانی شده:
     * {emoji} - ایموجی کشور
     * {country} - نام کشور
     * {user} - پیشوند کاربر (remarkPrefix)
     * {remark} - توضیحات اضافی
     * {ip} - آدرس IP
     * {port} - پورت
     * {index} - شماره ردیف با padding (01, 02, ...)
     * {num} - شماره ردیف بدون padding (1, 2, ...)
     * {protocol} - نام پروتکل (VLESS, Trojan, XHTTP)
     */
    function formatNodeName(data) {
        const { 
            emoji = '', 
            country = '', 
            user = remarkPrefix, 
            remark = '', 
            ip = '', 
            port = '',
            protocol = '',
            countryCode = ''
        } = data;
        
        // دریافت شماره ردیف
        const idx = getNextIndex(countryCode || country, protocol);
        const indexFormatted = formatIndex(idx);
        
        // اگه فرمت سفارشی تنظیم شده
        if (nodeNameFormat === 'custom' && customNodeFormat) {
            return customNodeFormat
                .replace(/\{emoji\}/g, emoji)
                .replace(/\{country\}/g, country)
                .replace(/\{user\}/g, user)
                .replace(/\{remark\}/g, remark)
                .replace(/\{ip\}/g, ip)
                .replace(/\{port\}/g, String(port))
                .replace(/\{index\}/g, indexFormatted)
                .replace(/\{num\}/g, String(idx))
                .replace(/\{protocol\}/g, protocol)
                .trim();
        }
        
        // فرمت‌های پیش‌فرض
        switch (nodeNameFormat) {
            case 'country-user':
                return `${emoji} ${country}${remarkSeparator}${user}${remark ? remarkSeparator + remark : ''}`.trim();
            case 'user-country':
                return `${user}${remarkSeparator}${emoji} ${country}${remark ? remarkSeparator + remark : ''}`.trim();
            case 'country-only':
                return `${emoji} ${country}${remark ? remarkSeparator + remark : ''}`.trim();
            case 'user-only':
                return `${user}${remark ? remarkSeparator + remark : ''}`.trim();
            case 'indexed':
                // فرمت جدید با شماره ردیف
                return `${user}${remarkSeparator}${emoji} ${country} #${indexFormatted}`.trim();
            case 'protocol-indexed':
                // فرمت با پروتکل و شماره
                return `${user}${remarkSeparator}${protocol}${remarkSeparator}${emoji} ${country} #${indexFormatted}`.trim();
            default:
                return `${emoji} ${country}${remarkSeparator}${user}`.trim();
        }
    }
    
    /**
     * ریست کردن شمارنده‌ها (برای هر پروتکل جدید)
     */
    function resetIndexCounters() {
        indexCounters.global = indexStart - 1;
        indexCounters.byCountry = {};
        indexCounters.byProtocol = {};
    }
    
    // تابع کمکی برای افزودن نودها با کنترل تعداد هر پروتکل
    async function addNodesFromList(list) {
        // تابع کمکی برای محاسبه تعداد
        function getCountForProtocol(setting, totalNodes) {
            if (setting === 'all' || setting === '') {
                return totalNodes; // همه نودها
            }
            const num = parseInt(setting);
            if (isNaN(num) || num <= 0) {
                return totalNodes;
            }
            return Math.min(num, totalNodes); // حداکثر به تعداد نودهای موجود
        }
        
        // Apply node name formatting to list with protocol info
        function formatListWithProtocol(items, protocolName) {
            return items.map(item => ({
                ...item,
                formattedName: formatNodeName({
                    emoji: item.emoji || '',
                    country: item.country || item.region || '',
                    user: remarkPrefix,
                    remark: item.isp || item.name || '',
                    ip: item.ip,
                    port: item.port,
                    protocol: protocolName,
                    countryCode: item.regionCode || item.region || ''
                })
            }));
        }
        
        // VLESS
        if (enableVless) {
            // ریست شمارنده برای پروتکل جدید (اگه indexPerProtocol فعاله)
            if (indexPerProtocol) resetIndexCounters();
            
            const vlessCount = getCountForProtocol(vlessCountSetting, list.length);
            const vlessList = vlessCount < list.length 
                ? randomSelect(list, vlessCount) 
                : list;
            const formattedVlessList = formatListWithProtocol(vlessList, 'VLESS');
            links.push(...generateVlessLinksFromList(formattedVlessList, uuid, workerDomain, { disableNonTLS }));
        }
        
        // Trojan
        if (enableTrojan) {
            // ریست شمارنده برای پروتکل جدید (اگه indexPerProtocol فعاله)
            if (indexPerProtocol) resetIndexCounters();
            
            const trojanCount = getCountForProtocol(trojanCountSetting, list.length);
            const trojanList = trojanCount < list.length 
                ? randomSelect(list, trojanCount) 
                : list;
            const formattedTrojanList = formatListWithProtocol(trojanList, 'Trojan');
            const trojanLinks = await generateTrojanLinksFromList(formattedTrojanList, uuid, workerDomain, { 
                disableNonTLS, 
                customPassword: trojanPassword 
            });
            links.push(...trojanLinks);
        }
        
        // XHTTP
        if (enableXhttp) {
            // ریست شمارنده برای پروتکل جدید (اگه indexPerProtocol فعاله)
            if (indexPerProtocol) resetIndexCounters();
            
            const xhttpCount = getCountForProtocol(xhttpCountSetting, list.length);
            const xhttpList = xhttpCount < list.length 
                ? randomSelect(list, xhttpCount) 
                : list;
            const formattedXhttpList = formatListWithProtocol(xhttpList, 'XHTTP');
            links.push(...generateXhttpLinksFromList(formattedXhttpList, uuid, workerDomain));
        }
    }
    
    // لیست نهایی IP ها
    let allIPs = [];
    
    // 1. افزودن آدرس اصلی Worker
    allIPs.push({
        ip: workerDomain,
        port: 443,
        isp: 'Worker-Native'
    });
    
    // 2. افزودن IP های کشورهای انتخاب‌شده
    for (const country of selectedCountries) {
        const ipCount = parseInt(country.ipCount) || 3;
        const proxyUrl = country.proxyUrl || '';
        
        if (proxyUrl) {
            // استفاده از URL سفارشی
            const ips = await fetchIPsFromURL(proxyUrl, ipCount);
            ips.forEach(ip => {
                allIPs.push({
                    ip: ip.address,
                    port: ip.port || 443,
                    isp: `${country.emoji} ${country.name}`,
                    region: country.code
                });
            });
        } else {
            // استفاده از ProxyIP پیش‌فرض
            const defaultProxy = DEFAULT_PROXY_IPS.find(p => p.region === country.code || p.regionCode === country.code);
            if (defaultProxy) {
                for (let i = 0; i < ipCount; i++) {
                    allIPs.push({
                        ip: defaultProxy.domain,
                        port: defaultProxy.port,
                        isp: `${country.emoji} ${country.name} #${i + 1}`,
                        region: country.code
                    });
                }
            }
        }
    }
    
    // 3. افزودن پروکسی‌های سفارشی
    for (const proxy of customProxies) {
        if (!proxy.address) continue;
        const ipCount = parseInt(proxy.ipCount) || 3;
        
        for (let i = 0; i < ipCount; i++) {
            allIPs.push({
                ip: proxy.address,
                port: parseInt(proxy.port) || 443,
                isp: `${proxy.name || 'Custom'} #${i + 1}`,
                region: 'CUSTOM'
            });
        }
    }
    
    // 4. افزودن IP های سفارشی از yx
    if (customYx && !disablePreferred) {
        const yxIPs = parseYxToList(customYx);
        allIPs.push(...yxIPs);
    }
    
    // 5. افزودن دامنه‌های مستقیم
    if (enablePreferredDomains && !disablePreferred) {
        DIRECT_DOMAINS.forEach(d => {
            allIPs.push({
                ip: d.domain,
                port: 443,
                isp: d.name || d.domain
            });
        });
    }
    
    // 6. دریافت IP های داینامیک
    if (enablePreferredIPs && !disablePreferred) {
        try {
            const dynamicIPs = await fetchDynamicIPs();
            allIPs.push(...dynamicIPs);
        } catch (e) {
            console.error('خطا در دریافت IP های داینامیک:', e);
        }
    }
    
    // 7. دریافت IP های GitHub
    if (enableGitHubIPs && !disablePreferred) {
        try {
            const githubIPs = await fetchAndParseNewIPs(customYxURL);
            allIPs.push(...githubIPs);
        } catch (e) {
            console.error('خطا در دریافت IP های GitHub:', e);
        }
    }
    
    // 8. افزودن نودهای WARP (اگر فعال باشه)
    const warpEnabled = getConfigValue('warpEnabled', 'no') === 'yes';
    if (warpEnabled) {
        try {
            const warpConfig = await getWarpConfig();
            if (warpConfig.privateKey) {
                // ساخت نودهای WARP برای کشورهای انتخاب‌شده
                const warpLinks = await generateWarpLinks(warpConfig, selectedCountries, uuid, workerDomain, remarkPrefix);
                links.push(...warpLinks);
            }
        } catch (e) {
            console.error('خطا در ساخت نودهای WARP:', e);
        }
    }
    
    // اگر حالت رندوم فعال باشه
    if (randomMode && allIPs.length > totalIPCount) {
        allIPs = randomSelect(allIPs, totalIPCount);
    }
    
    // ساخت لینک‌ها
    await addNodesFromList(allIPs);
    
    // اگر هیچ لینکی نداریم
    if (links.length === 0) {
        return new Response('No nodes generated. Please check your settings.', {
            status: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
    
    // خروجی بر اساس نوع
    if (target === 'base64') {
        const encoded = toBase64(links.join('\n'));
        return new Response(encoded, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    } else {
        return new Response(links.join('\n'), {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

/**
 * پارس کردن yx به لیست IP
 */
function parseYxToList(yxValue) {
    if (!yxValue || !yxValue.trim()) return [];
    
    const items = yxValue.split(',').map(item => item.trim()).filter(item => item);
    const result = [];
    
    for (const item of items) {
        let nodeName = '';
        let addressPart = item;
        
        if (item.includes('#')) {
            const parts = item.split('#');
            addressPart = parts[0].trim();
            nodeName = parts[1].trim();
        }
        
        // پارس آدرس و پورت
        let address = addressPart;
        let port = 443;
        
        if (addressPart.includes(':')) {
            const lastColon = addressPart.lastIndexOf(':');
            const possiblePort = addressPart.substring(lastColon + 1);
            if (/^\d+$/.test(possiblePort)) {
                port = parseInt(possiblePort);
                address = addressPart.substring(0, lastColon);
            }
        }
        
        if (!nodeName) {
            nodeName = `Custom-${address}`;
        }
        
        result.push({
            ip: address,
            port: port,
            isp: nodeName
        });
    }
    
    return result;
}

/**
 * دریافت IP از URL
 */
async function fetchIPsFromURL(url, count = 3) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        if (!response.ok) {
            return [];
        }
        
        const text = await response.text();
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        
        const ips = [];
        
        for (const line of lines) {
            if (ips.length >= count) break;
            
            let address = line;
            let port = 443;
            let name = '';
            
            if (line.includes('#')) {
                const parts = line.split('#');
                address = parts[0].trim();
                name = parts[1].trim();
            }
            
            if (address.includes(':')) {
                const parts = address.split(':');
                address = parts[0];
                port = parseInt(parts[1]) || 443;
            }
            
            ips.push({ address, port, name });
        }
        
        return ips;
    } catch (error) {
        console.error('خطا در دریافت IP از URL:', error);
        return [];
    }
}

/**
 * دریافت IP های داینامیک - با فیلتر
 */
async function fetchDynamicIPs() {
    const v4Url1 = "https://www.wetest.vip/page/cloudflare/address_v4.html";
    const v6Url1 = "https://www.wetest.vip/page/cloudflare/address_v6.html";
    
    // دریافت تنظیمات فیلتر
    const ipv4Enabled = getConfigValue('ipv4', 'yes') !== 'no';
    const ipv6Enabled = getConfigValue('ipv6', 'yes') !== 'no';
    const ispMobile = getConfigValue('ispMobile', 'yes') !== 'no';
    const ispUnicom = getConfigValue('ispUnicom', 'yes') !== 'no';
    const ispTelecom = getConfigValue('ispTelecom', 'yes') !== 'no';
    
    let results = [];
    
    try {
        const fetchPromises = [];
        
        if (ipv4Enabled) {
            fetchPromises.push(fetchAndParseWetest(v4Url1));
        } else {
            fetchPromises.push(Promise.resolve([]));
        }
        
        if (ipv6Enabled) {
            fetchPromises.push(fetchAndParseWetest(v6Url1));
        } else {
            fetchPromises.push(Promise.resolve([]));
        }
        
        const [v4Data, v6Data] = await Promise.allSettled(fetchPromises);
        
        if (v4Data.status === 'fulfilled' && v4Data.value) {
            results.push(...v4Data.value);
        }
        if (v6Data.status === 'fulfilled' && v6Data.value) {
            results.push(...v6Data.value);
        }
        
        // فیلتر بر اساس ISP
        if (results.length > 0) {
            results = results.filter(item => {
                const isp = item.isp || '';
                if (isp.includes('移动') && !ispMobile) return false;
                if (isp.includes('联通') && !ispUnicom) return false;
                if (isp.includes('电信') && !ispTelecom) return false;
                return true;
            });
        }
        
    } catch (e) {
        console.error('خطا در دریافت IP های داینامیک:', e);
    }
    
    return results;
}

/**
 * پارس کردن صفحه wetest - دقیقا مثل کد قدیمی
 */
async function fetchAndParseWetest(url) {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return [];
        
        const html = await response.text();
        const results = [];
        
        // پارس کردن HTML با regex مثل کد قدیمی
        const rowRegex = /<tr[\s\S]*?<\/tr>/g;
        const cellRegex = /<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>[\s\S]*?<td data-label="数据中心">(.+?)<\/td>/;
        
        let match;
        while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[0];
            const cellMatch = rowHtml.match(cellRegex);
            if (cellMatch && cellMatch[1] && cellMatch[2]) {
                const colo = cellMatch[3] ? cellMatch[3].trim().replace(/<.*?>/g, '') : '';
                results.push({
                    isp: cellMatch[1].trim().replace(/<.*?>/g, ''),
                    ip: cellMatch[2].trim(),
                    port: 443,
                    colo: colo
                });
            }
        }
        
        return results;
    } catch (e) {
        return [];
    }
}

/**
 * دریافت و پارس IP های جدید از GitHub
 */
async function fetchAndParseNewIPs(customUrl = '') {
    const url = customUrl || DEFAULT_PREFERRED_IP_URL;
    
    try {
        // پشتیبانی از چند URL
        const urls = url.includes(',') ? url.split(',').map(u => u.trim()).filter(u => u) : [url];
        const apiResults = await fetchPreferredAPI(urls, '443', 5000);
        
        if (apiResults.length > 0) {
            const results = [];
            const regex = /^(\[[\da-fA-F:]+\]|[\d.]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?(?:#(.+))?$/;
            
            for (const item of apiResults) {
                const match = item.match(regex);
                if (match) {
                    results.push({
                        ip: match[1],
                        port: parseInt(match[2] || '443', 10),
                        isp: match[3]?.trim() || match[1],
                        name: match[3]?.trim() || match[1]
                    });
                }
            }
            return results;
        }
        
        // فالبک به روش ساده
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (!response.ok) return [];
        
        const text = await response.text();
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        
        const results = [];
        
        for (const line of lines) {
            let ip = line;
            let port = 443;
            let name = '';
            
            if (line.includes('#')) {
                const parts = line.split('#');
                ip = parts[0].trim();
                name = parts[1].trim();
            }
            
            if (ip.includes(':')) {
                const lastColon = ip.lastIndexOf(':');
                const possiblePort = ip.substring(lastColon + 1);
                if (/^\d+$/.test(possiblePort)) {
                    port = parseInt(possiblePort);
                    ip = ip.substring(0, lastColon);
                }
            }
            
            results.push({
                ip: ip,
                port: port,
                isp: name || `GitHub-${ip}`,
                name: name || `GitHub-${ip}`
            });
        }
        
        return results;
    } catch (e) {
        console.error('خطا در دریافت IP های GitHub:', e);
        return [];
    }
}

/**
 * دریافت IP از چند URL با پشتیبانی CSV - دقیقا مثل کد قدیمی
 */
async function fetchPreferredAPI(urls, defaultPort = '443', timeout = 3000) {
    if (!urls?.length) return [];
    const results = new Set();
    
    await Promise.allSettled(urls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            let text = '';
            try {
                const buffer = await response.arrayBuffer();
                const contentType = (response.headers.get('content-type') || '').toLowerCase();
                const charset = contentType.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase() || '';

                let decoders = ['utf-8', 'gb2312'];
                if (charset.includes('gb') || charset.includes('gbk') || charset.includes('gb2312')) {
                    decoders = ['gb2312', 'utf-8'];
                }

                let decodeSuccess = false;
                for (const decoder of decoders) {
                    try {
                        const decoded = new TextDecoder(decoder).decode(buffer);
                        if (decoded && decoded.length > 0 && !decoded.includes('\ufffd')) {
                            text = decoded;
                            decodeSuccess = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                if (!decodeSuccess) {
                    text = new TextDecoder('utf-8').decode(buffer);
                }

                if (!text || text.trim().length === 0) {
                    return;
                }
            } catch (e) {
                return;
            }
            
            const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
            const isCSV = lines.length > 1 && lines[0].includes(',');
            const IPV6_PATTERN = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
            
            if (!isCSV) {
                lines.forEach(line => {
                    const hashIndex = line.indexOf('#');
                    const [hostPart, remark] = hashIndex > -1 ? [line.substring(0, hashIndex), line.substring(hashIndex)] : [line, ''];
                    let hasPort = false;
                    if (hostPart.startsWith('[')) {
                        hasPort = /\]:(\d+)$/.test(hostPart);
                    } else {
                        const colonIndex = hostPart.lastIndexOf(':');
                        hasPort = colonIndex > -1 && /^\d+$/.test(hostPart.substring(colonIndex + 1));
                    }
                    const port = new URL(url).searchParams.get('port') || defaultPort;
                    results.add(hasPort ? line : `${hostPart}:${port}${remark}`);
                });
            } else {
                const headers = lines[0].split(',').map(h => h.trim());
                const dataLines = lines.slice(1);
                
                // فرمت اول: IP地址, 端口, 数据中心
                if (headers.includes('IP地址') && headers.includes('端口') && headers.includes('数据中心')) {
                    const ipIdx = headers.indexOf('IP地址');
                    const portIdx = headers.indexOf('端口');
                    const remarkIdx = headers.indexOf('国家') > -1 ? headers.indexOf('国家') :
                        headers.indexOf('城市') > -1 ? headers.indexOf('城市') : headers.indexOf('数据中心');
                    const tlsIdx = headers.indexOf('TLS');
                    
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        if (tlsIdx !== -1 && cols[tlsIdx]?.toLowerCase() !== 'true') return;
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${cols[portIdx]}#${cols[remarkIdx]}`);
                    });
                } 
                // فرمت دوم: IP, 延迟, 下载速度
                else if (headers.some(h => h.includes('IP')) && headers.some(h => h.includes('延迟')) && headers.some(h => h.includes('下载速度'))) {
                    const ipIdx = headers.findIndex(h => h.includes('IP'));
                    const delayIdx = headers.findIndex(h => h.includes('延迟'));
                    const speedIdx = headers.findIndex(h => h.includes('下载速度'));
                    const port = new URL(url).searchParams.get('port') || defaultPort;
                    
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${port}#CF-Preferred ${cols[delayIdx]}ms ${cols[speedIdx]}MB/s`);
                    });
                }
            }
        } catch (e) {}
    }));
    
    return Array.from(results);
}
