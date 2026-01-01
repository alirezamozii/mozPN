// =============================================
// MozPN v3.0 - سیستم پشتیبان‌گیری و بازیابی
// Export/Import تنظیمات کامل پنل
// Future-proof با پشتیبانی از همه تنظیمات
// =============================================

import { 
    getAllConfig, 
    updateConfig, 
    resetConfig,
    getSelectedCountries,
    setSelectedCountries,
    getCustomProxies,
    setCustomProxies,
    getConfigValue,
    setConfigValue,
    isKVEnabled
} from '../services/kvStore.js';
import { getWarpConfig, saveWarpConfig } from '../services/warpManager.js';
import { getFragmentConfig, saveFragmentConfig } from '../services/fragmentManager.js';
import { getFailoverConfig, saveFailoverConfig } from '../services/failoverManager.js';
import { getRealityConfig, saveRealityConfig } from '../services/realityManager.js';
import { getAllUsers, saveUser, deleteUser } from '../services/userManager.js';
import { jsonResponse } from '../utils/helpers.js';

// نسخه فرمت بکاپ
const BACKUP_VERSION = '3.1';

// لیست کامل کلیدهای تنظیمات برای اطمینان از پوشش کامل
const CONFIG_KEYS = {
    // پروتکل‌ها
    protocols: ['ev', 'et', 'ex', 'tp'],
    
    // تعداد کانفیگ
    counts: ['vlessCount', 'trojanCount', 'xhttpCount', 'totalConfigCount', 'autoDistribute'],
    
    // IP های بهینه
    cleanIPs: ['epi', 'egi', 'epd', 'yx', 'yxURL', 'dkby', 'yxby'],
    
    // فیلتر ISP
    ispFilters: ['ipv4', 'ipv6', 'ispMobile', 'ispUnicom', 'ispTelecom'],
    
    // مسیریابی
    routing: ['iranDirect', 'adBlock', 'chinaDirect'],
    
    // قابلیت‌های پیشرفته
    features: ['fragmentEnabled', 'warpEnabled', 'failoverEnabled', 'realityEnabled'],
    
    // تنظیمات نمایش و نام‌گذاری
    display: ['randomMode', 'totalIPCount', 'remarkPrefix', 'remarkSeparator', 'nodeNameFormat', 'customNodeFormat', 'indexStart', 'indexPadding', 'indexPerCountry', 'indexPerProtocol'],
    
    // کشورها و پروکسی‌ها (JSON)
    arrays: ['selectedCountries', 'customProxies'],
    
    // سایر
    misc: ['panel_password']
};

/**
 * API مدیریت پشتیبان‌گیری
 */
export async function handleBackupAPI(request, kvStore) {
    if (!isKVEnabled()) {
        return jsonResponse({
            success: false,
            error: 'KV فعال نیست',
            message: 'برای استفاده از پشتیبان‌گیری باید KV را فعال کنید'
        }, 503);
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];
    
    switch (action) {
        case 'export':
            return await handleExport(request, kvStore);
        
        case 'import':
            if (request.method === 'POST') {
                return await handleImport(request, kvStore);
            }
            break;
        
        case 'reset':
            if (request.method === 'POST') {
                return await handleReset(kvStore);
            }
            break;
        
        case 'preview':
            if (request.method === 'POST') {
                return await handlePreview(request);
            }
            break;
        
        case 'summary':
            return jsonResponse({
                success: true,
                summary: await getConfigSummary(kvStore)
            });
        
        default:
            return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
    }
    
    return jsonResponse({ error: 'متد پشتیبانی نمی‌شود' }, 405);
}

/**
 * خروجی گرفتن از همه تنظیمات - کامل و هوشمند
 */
async function handleExport(request, kvStore) {
    try {
        const url = new URL(request.url);
        const includeUsers = url.searchParams.get('users') !== 'no';
        const includeWarp = url.searchParams.get('warp') !== 'no';
        const includeSensitive = url.searchParams.get('sensitive') === 'yes';
        const format = url.searchParams.get('format') || 'json'; // json | minimal
        
        // جمع‌آوری همه تنظیمات
        const allConfig = getAllConfig();
        
        const backup = {
            // متادیتا
            _meta: {
                version: BACKUP_VERSION,
                exportedAt: new Date().toISOString(),
                type: 'MozPN-Backup',
                format: format
            },
            
            // تنظیمات اصلی - همه کلیدها
            config: allConfig,
            
            // کشورهای انتخاب‌شده (جدا برای خوانایی)
            selectedCountries: getSelectedCountries(),
            
            // پروکسی‌های سفارشی (جدا برای خوانایی)
            customProxies: getCustomProxies(),
            
            // تنظیمات نمایش و نام‌گذاری (برای دسترسی راحت)
            displaySettings: {
                randomMode: getConfigValue('randomMode', 'no'),
                totalIPCount: getConfigValue('totalIPCount', '10'),
                remarkPrefix: getConfigValue('remarkPrefix', 'MozPN'),
                remarkSeparator: getConfigValue('remarkSeparator', ' | '),
                nodeNameFormat: getConfigValue('nodeNameFormat', 'country-user'),
                customNodeFormat: getConfigValue('customNodeFormat', '')
            },
            
            // تنظیمات پروتکل‌ها
            protocolSettings: {
                vless: getConfigValue('ev', 'yes'),
                trojan: getConfigValue('et', 'no'),
                xhttp: getConfigValue('ex', 'no'),
                trojanPassword: includeSensitive ? getConfigValue('tp', '') : '***REMOVED***',
                vlessCount: getConfigValue('vlessCount', 'all'),
                trojanCount: getConfigValue('trojanCount', 'all'),
                xhttpCount: getConfigValue('xhttpCount', 'all')
            },
            
            // تنظیمات Clean IP
            cleanIPSettings: {
                preferredIPs: getConfigValue('epi', 'yes'),
                githubIPs: getConfigValue('egi', 'yes'),
                preferredDomains: getConfigValue('epd', 'no'),
                customYx: getConfigValue('yx', ''),
                customYxURL: getConfigValue('yxURL', ''),
                disableNonTLS: getConfigValue('dkby', 'no'),
                disablePreferred: getConfigValue('yxby', 'no')
            },
            
            // تنظیمات ISP
            ispSettings: {
                ipv4: getConfigValue('ipv4', 'yes'),
                ipv6: getConfigValue('ipv6', 'no'),
                mobile: getConfigValue('ispMobile', 'yes'),
                unicom: getConfigValue('ispUnicom', 'yes'),
                telecom: getConfigValue('ispTelecom', 'yes')
            },
            
            // تنظیمات مسیریابی
            routingSettings: {
                iranDirect: getConfigValue('iranDirect', 'yes'),
                adBlock: getConfigValue('adBlock', 'yes'),
                chinaDirect: getConfigValue('chinaDirect', 'no')
            },
            
            // تنظیمات Fragment
            fragment: await getFragmentConfig(),
            
            // تنظیمات Failover
            failover: await getFailoverConfig(),
            
            // تنظیمات Reality
            reality: await getRealityConfig()
        };
        
        // تنظیمات WARP (اختیاری)
        if (includeWarp) {
            const warpConfig = await getWarpConfig();
            
            // حذف کلید خصوصی اگه sensitive نخواستن
            if (!includeSensitive && warpConfig.privateKey) {
                warpConfig.privateKey = '***REMOVED***';
                warpConfig.token = '***REMOVED***';
            }
            
            backup.warp = warpConfig;
        }
        
        // حذف کلید خصوصی Reality اگه sensitive نخواستن
        if (!includeSensitive && backup.reality.privateKey) {
            backup.reality.privateKey = '***REMOVED***';
        }
        
        // کاربران (اختیاری)
        if (includeUsers && kvStore) {
            backup.users = await getAllUsers(kvStore);
        }
        
        // آمار کامل
        backup._meta.stats = {
            configKeysCount: Object.keys(allConfig).length,
            countriesCount: backup.selectedCountries?.length || 0,
            customProxiesCount: backup.customProxies?.length || 0,
            usersCount: backup.users?.length || 0,
            failoverEndpointsCount: backup.failover?.backupEndpoints?.length || 0,
            
            // وضعیت قابلیت‌ها
            features: {
                vless: backup.protocolSettings.vless === 'yes',
                trojan: backup.protocolSettings.trojan === 'yes',
                xhttp: backup.protocolSettings.xhttp === 'yes',
                warp: backup.warp?.enabled || false,
                fragment: backup.fragment?.enabled || false,
                failover: backup.failover?.enabled || false,
                reality: backup.reality?.enabled || false,
                randomMode: backup.displaySettings.randomMode === 'yes'
            }
        };
        
        // خروجی به صورت فایل JSON
        const filename = `mozpn-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        // اگه فرمت minimal خواستن، فقط config رو بده
        const outputData = format === 'minimal' 
            ? { _meta: backup._meta, config: backup.config }
            : backup;
        
        return new Response(JSON.stringify(outputData, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'X-Backup-Version': BACKUP_VERSION
            }
        });
        
    } catch (error) {
        return jsonResponse({
            success: false,
            error: 'خطا در خروجی گرفتن',
            message: error.message
        }, 500);
    }
}

/**
 * پیش‌نمایش فایل بکاپ قبل از وارد کردن - کامل‌تر
 */
async function handlePreview(request) {
    try {
        const backupData = await request.json();
        
        // اعتبارسنجی
        const validation = validateBackup(backupData);
        if (!validation.valid) {
            return jsonResponse({
                success: false,
                error: 'فایل بکاپ نامعتبر است',
                details: validation.errors
            }, 400);
        }
        
        // خلاصه محتویات
        const preview = {
            success: true,
            valid: true,
            version: backupData._meta?.version || 'نامشخص',
            exportedAt: backupData._meta?.exportedAt || 'نامشخص',
            
            contents: {
                hasConfig: !!backupData.config && Object.keys(backupData.config).length > 0,
                hasCountries: !!backupData.selectedCountries && backupData.selectedCountries.length > 0,
                hasCustomProxies: !!backupData.customProxies && backupData.customProxies.length > 0,
                hasUsers: !!backupData.users && backupData.users.length > 0,
                hasWarp: !!backupData.warp,
                hasFragment: !!backupData.fragment,
                hasFailover: !!backupData.failover,
                hasReality: !!backupData.reality,
                hasDisplaySettings: !!backupData.displaySettings,
                hasProtocolSettings: !!backupData.protocolSettings,
                hasCleanIPSettings: !!backupData.cleanIPSettings,
                hasISPSettings: !!backupData.ispSettings,
                hasRoutingSettings: !!backupData.routingSettings
            },
            
            stats: {
                configKeys: backupData.config ? Object.keys(backupData.config).length : 0,
                countriesCount: backupData.selectedCountries?.length || 0,
                customProxiesCount: backupData.customProxies?.length || 0,
                usersCount: backupData.users?.length || 0,
                failoverEndpoints: backupData.failover?.backupEndpoints?.length || 0
            },
            
            // نمایش تنظیمات مهم
            settings: {
                remarkPrefix: backupData.displaySettings?.remarkPrefix || backupData.config?.remarkPrefix || 'نامشخص',
                randomMode: backupData.displaySettings?.randomMode || backupData.config?.randomMode || 'no',
                totalIPCount: backupData.displaySettings?.totalIPCount || backupData.config?.totalIPCount || '10',
                protocols: {
                    vless: backupData.protocolSettings?.vless || backupData.config?.ev || 'yes',
                    trojan: backupData.protocolSettings?.trojan || backupData.config?.et || 'no',
                    xhttp: backupData.protocolSettings?.xhttp || backupData.config?.ex || 'no'
                }
            },
            
            // لیست کشورها
            countries: (backupData.selectedCountries || []).map(c => ({
                code: c.code,
                name: c.name,
                emoji: c.emoji,
                ipCount: c.ipCount
            })),
            
            warnings: [],
            
            // سازگاری با نسخه‌های قدیمی
            compatibility: {
                isOldFormat: !backupData._meta?.version || parseFloat(backupData._meta.version) < 3.0,
                canImport: true,
                notes: []
            }
        };
        
        // هشدارها
        if (backupData.warp?.privateKey === '***REMOVED***') {
            preview.warnings.push('⚠️ کلید خصوصی WARP در بکاپ وجود ندارد');
        }
        if (backupData.reality?.privateKey === '***REMOVED***') {
            preview.warnings.push('⚠️ کلید خصوصی Reality در بکاپ وجود ندارد');
        }
        if (backupData.protocolSettings?.trojanPassword === '***REMOVED***') {
            preview.warnings.push('⚠️ رمز Trojan در بکاپ وجود ندارد');
        }
        if (backupData.users && backupData.users.length > 0) {
            preview.warnings.push(`👥 ${backupData.users.length} کاربر وارد خواهد شد`);
        }
        
        // نکات سازگاری
        if (preview.compatibility.isOldFormat) {
            preview.compatibility.notes.push('این بکاپ از نسخه قدیمی‌تر است و ممکن است برخی تنظیمات جدید را نداشته باشد');
        }
        
        return jsonResponse(preview);
        
    } catch (error) {
        return jsonResponse({
            success: false,
            error: 'خطا در خواندن فایل بکاپ',
            message: error.message
        }, 400);
    }
}

/**
 * وارد کردن تنظیمات از بکاپ - هوشمند و کامل
 */
async function handleImport(request, kvStore) {
    try {
        const data = await request.json();
        const backupData = data.backup || data;
        const options = data.options || {};
        
        // اعتبارسنجی
        const validation = validateBackup(backupData);
        if (!validation.valid) {
            return jsonResponse({
                success: false,
                error: 'فایل بکاپ نامعتبر است',
                details: validation.errors
            }, 400);
        }
        
        // گزینه‌های وارد کردن
        const {
            importConfig = true,
            importCountries = true,
            importProxies = true,
            importUsers = false,        // پیش‌فرض غیرفعال برای امنیت
            importWarp = true,
            importFragment = true,
            importFailover = true,
            importReality = true,
            importDisplaySettings = true,
            importProtocolSettings = true,
            importCleanIPSettings = true,
            importISPSettings = true,
            importRoutingSettings = true,
            mergeMode = 'replace',      // replace | merge
            confirmed = false           // تایید کاربر
        } = options;
        
        // هشدار اگه تایید نشده
        if (!confirmed) {
            return jsonResponse({
                success: false,
                requireConfirmation: true,
                warning: '⚠️ هشدار: این عملیات تنظیمات فعلی شما را جایگزین می‌کند!',
                message: 'برای ادامه، پارامتر confirmed: true را ارسال کنید',
                willImport: {
                    config: importConfig,
                    countries: importCountries,
                    proxies: importProxies,
                    users: importUsers,
                    warp: importWarp,
                    fragment: importFragment,
                    failover: importFailover,
                    reality: importReality,
                    displaySettings: importDisplaySettings,
                    protocolSettings: importProtocolSettings
                }
            }, 400);
        }
        
        const results = {
            success: true,
            imported: [],
            skipped: [],
            errors: []
        };
        
        // 1. تنظیمات اصلی (config)
        if (importConfig && backupData.config) {
            try {
                if (mergeMode === 'merge') {
                    const currentConfig = getAllConfig();
                    await updateConfig({ ...currentConfig, ...backupData.config });
                } else {
                    await updateConfig(backupData.config);
                }
                results.imported.push('config');
            } catch (e) {
                results.errors.push({ section: 'config', error: e.message });
            }
        }
        
        // 2. تنظیمات نمایش (displaySettings) - اگه جدا بود
        if (importDisplaySettings && backupData.displaySettings) {
            try {
                const displayConfig = {
                    randomMode: backupData.displaySettings.randomMode,
                    totalIPCount: backupData.displaySettings.totalIPCount,
                    remarkPrefix: backupData.displaySettings.remarkPrefix,
                    remarkSeparator: backupData.displaySettings.remarkSeparator,
                    nodeNameFormat: backupData.displaySettings.nodeNameFormat,
                    customNodeFormat: backupData.displaySettings.customNodeFormat
                };
                
                // فقط مقادیر غیر undefined رو آپدیت کن
                const filteredConfig = Object.fromEntries(
                    Object.entries(displayConfig).filter(([_, v]) => v !== undefined)
                );
                
                if (Object.keys(filteredConfig).length > 0) {
                    const currentConfig = getAllConfig();
                    await updateConfig({ ...currentConfig, ...filteredConfig });
                    results.imported.push('displaySettings');
                }
            } catch (e) {
                results.errors.push({ section: 'displaySettings', error: e.message });
            }
        }
        
        // 3. تنظیمات پروتکل‌ها (protocolSettings) - اگه جدا بود
        if (importProtocolSettings && backupData.protocolSettings) {
            try {
                const protocolConfig = {
                    ev: backupData.protocolSettings.vless,
                    et: backupData.protocolSettings.trojan,
                    ex: backupData.protocolSettings.xhttp,
                    vlessCount: backupData.protocolSettings.vlessCount,
                    trojanCount: backupData.protocolSettings.trojanCount,
                    xhttpCount: backupData.protocolSettings.xhttpCount
                };
                
                // رمز Trojan فقط اگه موجود باشه
                if (backupData.protocolSettings.trojanPassword && 
                    backupData.protocolSettings.trojanPassword !== '***REMOVED***') {
                    protocolConfig.tp = backupData.protocolSettings.trojanPassword;
                }
                
                const filteredConfig = Object.fromEntries(
                    Object.entries(protocolConfig).filter(([_, v]) => v !== undefined)
                );
                
                if (Object.keys(filteredConfig).length > 0) {
                    const currentConfig = getAllConfig();
                    await updateConfig({ ...currentConfig, ...filteredConfig });
                    results.imported.push('protocolSettings');
                }
            } catch (e) {
                results.errors.push({ section: 'protocolSettings', error: e.message });
            }
        }
        
        // 4. تنظیمات Clean IP
        if (importCleanIPSettings && backupData.cleanIPSettings) {
            try {
                const cleanIPConfig = {
                    epi: backupData.cleanIPSettings.preferredIPs,
                    egi: backupData.cleanIPSettings.githubIPs,
                    epd: backupData.cleanIPSettings.preferredDomains,
                    yx: backupData.cleanIPSettings.customYx,
                    yxURL: backupData.cleanIPSettings.customYxURL,
                    dkby: backupData.cleanIPSettings.disableNonTLS,
                    yxby: backupData.cleanIPSettings.disablePreferred
                };
                
                const filteredConfig = Object.fromEntries(
                    Object.entries(cleanIPConfig).filter(([_, v]) => v !== undefined)
                );
                
                if (Object.keys(filteredConfig).length > 0) {
                    const currentConfig = getAllConfig();
                    await updateConfig({ ...currentConfig, ...filteredConfig });
                    results.imported.push('cleanIPSettings');
                }
            } catch (e) {
                results.errors.push({ section: 'cleanIPSettings', error: e.message });
            }
        }
        
        // 5. تنظیمات ISP
        if (importISPSettings && backupData.ispSettings) {
            try {
                const ispConfig = {
                    ipv4: backupData.ispSettings.ipv4,
                    ipv6: backupData.ispSettings.ipv6,
                    ispMobile: backupData.ispSettings.mobile,
                    ispUnicom: backupData.ispSettings.unicom,
                    ispTelecom: backupData.ispSettings.telecom
                };
                
                const filteredConfig = Object.fromEntries(
                    Object.entries(ispConfig).filter(([_, v]) => v !== undefined)
                );
                
                if (Object.keys(filteredConfig).length > 0) {
                    const currentConfig = getAllConfig();
                    await updateConfig({ ...currentConfig, ...filteredConfig });
                    results.imported.push('ispSettings');
                }
            } catch (e) {
                results.errors.push({ section: 'ispSettings', error: e.message });
            }
        }
        
        // 6. تنظیمات مسیریابی
        if (importRoutingSettings && backupData.routingSettings) {
            try {
                const routingConfig = {
                    iranDirect: backupData.routingSettings.iranDirect,
                    adBlock: backupData.routingSettings.adBlock,
                    chinaDirect: backupData.routingSettings.chinaDirect
                };
                
                const filteredConfig = Object.fromEntries(
                    Object.entries(routingConfig).filter(([_, v]) => v !== undefined)
                );
                
                if (Object.keys(filteredConfig).length > 0) {
                    const currentConfig = getAllConfig();
                    await updateConfig({ ...currentConfig, ...filteredConfig });
                    results.imported.push('routingSettings');
                }
            } catch (e) {
                results.errors.push({ section: 'routingSettings', error: e.message });
            }
        }
        
        // 7. کشورهای انتخاب‌شده
        if (importCountries && backupData.selectedCountries) {
            try {
                if (mergeMode === 'merge') {
                    const current = getSelectedCountries();
                    const merged = mergeArraysByKey(current, backupData.selectedCountries, 'code');
                    await setSelectedCountries(merged);
                } else {
                    await setSelectedCountries(backupData.selectedCountries);
                }
                results.imported.push(`selectedCountries (${backupData.selectedCountries.length})`);
            } catch (e) {
                results.errors.push({ section: 'selectedCountries', error: e.message });
            }
        }
        
        // 8. پروکسی‌های سفارشی
        if (importProxies && backupData.customProxies) {
            try {
                if (mergeMode === 'merge') {
                    const current = getCustomProxies();
                    const merged = mergeArraysByKey(current, backupData.customProxies, 'address');
                    await setCustomProxies(merged);
                } else {
                    await setCustomProxies(backupData.customProxies);
                }
                results.imported.push(`customProxies (${backupData.customProxies.length})`);
            } catch (e) {
                results.errors.push({ section: 'customProxies', error: e.message });
            }
        }
        
        // 9. تنظیمات WARP
        if (importWarp && backupData.warp) {
            try {
                // نادیده گرفتن کلیدهای حذف‌شده
                const warpData = { ...backupData.warp };
                if (warpData.privateKey === '***REMOVED***') {
                    delete warpData.privateKey;
                    delete warpData.token;
                }
                
                if (mergeMode === 'merge') {
                    const current = await getWarpConfig();
                    await saveWarpConfig({ ...current, ...warpData });
                } else {
                    await saveWarpConfig(warpData);
                }
                results.imported.push('warp');
            } catch (e) {
                results.errors.push({ section: 'warp', error: e.message });
            }
        }
        
        // 10. تنظیمات Fragment
        if (importFragment && backupData.fragment) {
            try {
                if (mergeMode === 'merge') {
                    const current = await getFragmentConfig();
                    await saveFragmentConfig({ ...current, ...backupData.fragment });
                } else {
                    await saveFragmentConfig(backupData.fragment);
                }
                results.imported.push('fragment');
            } catch (e) {
                results.errors.push({ section: 'fragment', error: e.message });
            }
        }
        
        // 11. تنظیمات Failover
        if (importFailover && backupData.failover) {
            try {
                if (mergeMode === 'merge') {
                    const current = await getFailoverConfig();
                    // ادغام endpoint ها
                    const mergedEndpoints = mergeArraysByKey(
                        current.backupEndpoints || [],
                        backupData.failover.backupEndpoints || [],
                        'address'
                    );
                    await saveFailoverConfig({
                        ...current,
                        ...backupData.failover,
                        backupEndpoints: mergedEndpoints
                    });
                } else {
                    await saveFailoverConfig(backupData.failover);
                }
                results.imported.push('failover');
            } catch (e) {
                results.errors.push({ section: 'failover', error: e.message });
            }
        }
        
        // 12. تنظیمات Reality
        if (importReality && backupData.reality) {
            try {
                const realityData = { ...backupData.reality };
                if (realityData.privateKey === '***REMOVED***') {
                    delete realityData.privateKey;
                }
                
                if (mergeMode === 'merge') {
                    const current = await getRealityConfig();
                    await saveRealityConfig({ ...current, ...realityData });
                } else {
                    await saveRealityConfig(realityData);
                }
                results.imported.push('reality');
            } catch (e) {
                results.errors.push({ section: 'reality', error: e.message });
            }
        }
        
        // 13. کاربران (با احتیاط)
        if (importUsers && backupData.users && kvStore) {
            try {
                let importedCount = 0;
                let skippedCount = 0;
                
                for (const user of backupData.users) {
                    if (!user.uuid) continue;
                    
                    try {
                        await saveUser(kvStore, user);
                        importedCount++;
                    } catch (e) {
                        skippedCount++;
                    }
                }
                
                results.imported.push(`users (${importedCount} imported, ${skippedCount} skipped)`);
            } catch (e) {
                results.errors.push({ section: 'users', error: e.message });
            }
        }
        
        // نتیجه نهایی
        results.success = results.errors.length === 0;
        results.message = results.success 
            ? '✅ تنظیمات با موفقیت وارد شد'
            : '⚠️ برخی بخش‌ها با خطا مواجه شدند';
        results.totalImported = results.imported.length;
        
        return jsonResponse(results);
        
    } catch (error) {
        return jsonResponse({
            success: false,
            error: 'خطا در وارد کردن تنظیمات',
            message: error.message
        }, 500);
    }
}

/**
 * بازنشانی کامل تنظیمات
 */
async function handleReset(kvStore) {
    try {
        // بازنشانی تنظیمات اصلی
        await resetConfig();
        
        // بازنشانی WARP
        await saveWarpConfig({});
        
        // بازنشانی Fragment
        await saveFragmentConfig({ enabled: false });
        
        // بازنشانی Failover
        await saveFailoverConfig({ enabled: false, backupEndpoints: [] });
        
        // بازنشانی Reality
        await saveRealityConfig({ enabled: false });
        
        return jsonResponse({
            success: true,
            message: '✅ همه تنظیمات بازنشانی شد',
            warning: 'کاربران حذف نشدند. برای حذف کاربران از API مربوطه استفاده کنید.'
        });
        
    } catch (error) {
        return jsonResponse({
            success: false,
            error: 'خطا در بازنشانی',
            message: error.message
        }, 500);
    }
}

/**
 * اعتبارسنجی فایل بکاپ
 */
function validateBackup(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
        errors.push('فایل بکاپ باید یک آبجکت JSON باشد');
        return { valid: false, errors };
    }
    
    // بررسی متادیتا
    if (!data._meta) {
        errors.push('متادیتای بکاپ یافت نشد (_meta)');
    } else {
        if (data._meta.type !== 'MozPN-Backup') {
            errors.push('نوع فایل بکاپ نامعتبر است');
        }
    }
    
    // بررسی ساختار کشورها
    if (data.selectedCountries && !Array.isArray(data.selectedCountries)) {
        errors.push('فرمت selectedCountries نامعتبر است');
    }
    
    // بررسی ساختار پروکسی‌ها
    if (data.customProxies && !Array.isArray(data.customProxies)) {
        errors.push('فرمت customProxies نامعتبر است');
    }
    
    // بررسی ساختار کاربران
    if (data.users && !Array.isArray(data.users)) {
        errors.push('فرمت users نامعتبر است');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * ادغام آرایه‌ها بر اساس کلید
 */
function mergeArraysByKey(arr1, arr2, key) {
    const map = new Map();
    
    // اول آرایه اول
    for (const item of (arr1 || [])) {
        if (item[key]) {
            map.set(item[key], item);
        }
    }
    
    // سپس آرایه دوم (جایگزین می‌شود)
    for (const item of (arr2 || [])) {
        if (item[key]) {
            map.set(item[key], item);
        }
    }
    
    return Array.from(map.values());
}

/**
 * تولید خلاصه تنظیمات فعلی - کامل
 */
export async function getConfigSummary(kvStore) {
    const allConfig = getAllConfig();
    
    const summary = {
        // آمار کلی
        stats: {
            configKeysCount: Object.keys(allConfig).length,
            countriesCount: getSelectedCountries()?.length || 0,
            customProxiesCount: getCustomProxies()?.length || 0,
            usersCount: 0
        },
        
        // وضعیت پروتکل‌ها
        protocols: {
            vless: getConfigValue('ev', 'yes') === 'yes',
            trojan: getConfigValue('et', 'no') === 'yes',
            xhttp: getConfigValue('ex', 'no') === 'yes'
        },
        
        // وضعیت قابلیت‌ها
        features: {
            warp: false,
            fragment: false,
            failover: false,
            reality: false,
            randomMode: getConfigValue('randomMode', 'no') === 'yes'
        },
        
        // تنظیمات نمایش
        display: {
            remarkPrefix: getConfigValue('remarkPrefix', 'MozPN'),
            totalIPCount: getConfigValue('totalIPCount', '10'),
            nodeNameFormat: getConfigValue('nodeNameFormat', 'country-user')
        },
        
        // کشورهای انتخاب‌شده
        countries: getSelectedCountries().map(c => ({
            code: c.code,
            name: c.name,
            emoji: c.emoji,
            ipCount: c.ipCount
        })),
        
        // تنظیمات Clean IP
        cleanIPs: {
            preferredIPs: getConfigValue('epi', 'yes') === 'yes',
            githubIPs: getConfigValue('egi', 'yes') === 'yes',
            preferredDomains: getConfigValue('epd', 'no') === 'yes'
        },
        
        // تنظیمات مسیریابی
        routing: {
            iranDirect: getConfigValue('iranDirect', 'yes') === 'yes',
            adBlock: getConfigValue('adBlock', 'yes') === 'yes'
        }
    };
    
    try {
        if (kvStore) {
            const users = await getAllUsers(kvStore);
            summary.stats.usersCount = users.length;
        }
        
        const warp = await getWarpConfig();
        summary.features.warp = !!warp.privateKey || warp.enabled;
        
        const fragment = await getFragmentConfig();
        summary.features.fragment = fragment.enabled;
        
        const failover = await getFailoverConfig();
        summary.features.failover = failover.enabled;
        summary.stats.failoverEndpoints = failover.backupEndpoints?.length || 0;
        
        const reality = await getRealityConfig();
        summary.features.reality = reality.enabled;
    } catch (e) {
        console.error('Error getting config summary:', e);
    }
    
    return summary;
}
