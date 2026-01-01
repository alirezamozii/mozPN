// =============================================
// MozPN v2.0 - API مسیریابی جغرافیایی
// =============================================

import {
    isIranianIP,
    isIranianDomain,
    isChineseIP,
    isAdDomain,
    determineRouting,
    generateSingboxRules,
    generateSingboxRuleSets,
    generateV2rayRules,
    generateFullSingboxRouting,
    getIranCIDRList,
    getChinaCIDRList,
    getIranDomainList,
    getAdDomainList,
    getGeoSources,
    checkGeoSourcesHealth
} from '../services/geoRouting.js';
import { jsonResponse } from '../utils/helpers.js';
import { getConfigValue } from '../services/kvStore.js';

/**
 * API مسیریابی
 */
export async function handleRoutingAPI(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];
    
    switch (action) {
        case 'check':
            return handleCheckAddress(request);
        
        case 'singbox-rules':
            return handleSingboxRules(request);
        
        case 'v2ray-rules':
            return handleV2rayRules(request);
        
        case 'geo-sources':
            return handleGeoSources();
        
        case 'health':
            return handleRoutingHealthCheck();
        
        case 'iran-cidr':
            return jsonResponse({
                success: true,
                count: getIranCIDRList().length,
                cidr: getIranCIDRList()
            });
        
        case 'china-cidr':
            return jsonResponse({
                success: true,
                count: getChinaCIDRList().length,
                cidr: getChinaCIDRList()
            });
        
        case 'iran-domains':
            return jsonResponse({
                success: true,
                count: getIranDomainList().length,
                domains: getIranDomainList()
            });
        
        case 'ad-domains':
            return jsonResponse({
                success: true,
                count: getAdDomainList().length,
                domains: getAdDomainList()
            });
        
        default:
            return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
    }
}

/**
 * بررسی آدرس
 */
async function handleCheckAddress(request) {
    const url = new URL(request.url);
    const address = url.searchParams.get('address') || url.searchParams.get('ip') || url.searchParams.get('domain');
    
    if (!address) {
        return jsonResponse({
            success: false,
            error: 'پارامتر address الزامی است'
        }, 400);
    }
    
    // دریافت تنظیمات
    const enableIranDirect = getConfigValue('iranDirect', 'yes') !== 'no';
    const enableChinaDirect = getConfigValue('chinaDirect', 'no') === 'yes';
    const enableAdBlock = getConfigValue('adBlock', 'yes') !== 'no';
    
    const routing = determineRouting(address, {
        enableIranDirect,
        enableChinaDirect,
        enableAdBlock
    });
    
    const result = {
        success: true,
        address,
        routing,
        details: {
            isIranianIP: isIranianIP(address),
            isIranianDomain: isIranianDomain(address),
            isChineseIP: isChineseIP(address),
            isAdDomain: isAdDomain(address)
        },
        settings: {
            iranDirect: enableIranDirect,
            chinaDirect: enableChinaDirect,
            adBlock: enableAdBlock
        }
    };
    
    return jsonResponse(result);
}

/**
 * قوانین Sing-box
 */
async function handleSingboxRules(request) {
    const url = new URL(request.url);
    
    const options = {
        enableIranDirect: url.searchParams.get('iranDirect') !== 'no',
        enableChinaDirect: url.searchParams.get('chinaDirect') === 'yes',
        enableAdBlock: url.searchParams.get('adBlock') !== 'no',
        useRemoteRules: url.searchParams.get('remote') !== 'no'
    };
    
    const fullConfig = url.searchParams.get('full') === 'yes';
    
    if (fullConfig) {
        const routing = generateFullSingboxRouting(options);
        return jsonResponse({
            success: true,
            ...routing
        });
    }
    
    const rules = generateSingboxRules(options);
    const ruleSets = generateSingboxRuleSets(options);
    
    return jsonResponse({
        success: true,
        rules,
        rule_set: ruleSets
    });
}

/**
 * قوانین V2Ray
 */
async function handleV2rayRules(request) {
    const url = new URL(request.url);
    
    const options = {
        enableIranDirect: url.searchParams.get('iranDirect') !== 'no',
        enableChinaDirect: url.searchParams.get('chinaDirect') === 'yes',
        enableAdBlock: url.searchParams.get('adBlock') !== 'no'
    };
    
    const rules = generateV2rayRules(options);
    
    return jsonResponse({
        success: true,
        routing: {
            domainStrategy: 'IPIfNonMatch',
            rules
        }
    });
}

/**
 * منابع GeoIP/GeoSite
 */
function handleGeoSources() {
    const sources = getGeoSources();
    
    return jsonResponse({
        success: true,
        sources,
        usage: {
            singbox: 'از این URL ها در بخش rule_set استفاده کنید',
            v2ray: 'از geosite:ir و geoip:ir استفاده کنید'
        }
    });
}

/**
 * بررسی سلامت منابع
 */
async function handleRoutingHealthCheck() {
    const health = await checkGeoSourcesHealth();
    
    const allHealthy = Object.values(health).every(h => h.available);
    
    return jsonResponse({
        success: true,
        healthy: allHealthy,
        sources: health
    });
}

/**
 * تولید کانفیگ کامل Sing-box با مسیریابی
 */
export function generateSingboxConfig(uuid, workerDomain, options = {}) {
    const {
        enableIranDirect = true,
        enableChinaDirect = false,
        enableAdBlock = true,
        serverAddress = workerDomain,
        serverPort = 443
    } = options;
    
    const routing = generateFullSingboxRouting({
        enableIranDirect,
        enableChinaDirect,
        enableAdBlock
    });
    
    return {
        log: {
            level: 'info',
            timestamp: true
        },
        dns: {
            servers: [
                {
                    tag: 'dns-remote',
                    address: 'https://1.1.1.1/dns-query',
                    address_resolver: 'dns-direct',
                    detour: 'proxy'
                },
                {
                    tag: 'dns-direct',
                    address: '8.8.8.8',
                    detour: 'direct'
                },
                {
                    tag: 'dns-block',
                    address: 'rcode://success'
                }
            ],
            rules: [
                {
                    rule_set: enableAdBlock ? ['geosite-category-ads-all'] : [],
                    server: 'dns-block',
                    disable_cache: true
                },
                {
                    rule_set: enableIranDirect ? ['geosite-ir'] : [],
                    server: 'dns-direct'
                }
            ],
            final: 'dns-remote'
        },
        inbounds: [
            {
                type: 'tun',
                tag: 'tun-in',
                interface_name: 'tun0',
                inet4_address: '172.19.0.1/30',
                mtu: 9000,
                auto_route: true,
                strict_route: true,
                stack: 'system',
                sniff: true,
                sniff_override_destination: true
            }
        ],
        outbounds: [
            {
                type: 'vless',
                tag: 'proxy',
                server: serverAddress,
                server_port: serverPort,
                uuid: uuid,
                tls: {
                    enabled: true,
                    server_name: workerDomain,
                    utls: {
                        enabled: true,
                        fingerprint: 'chrome'
                    }
                },
                transport: {
                    type: 'ws',
                    path: '/?ed=2048',
                    headers: {
                        Host: workerDomain
                    }
                }
            },
            {
                type: 'direct',
                tag: 'direct'
            },
            {
                type: 'block',
                tag: 'block'
            },
            {
                type: 'dns',
                tag: 'dns-out'
            }
        ],
        ...routing,
        experimental: {
            cache_file: {
                enabled: true,
                path: 'cache.db'
            }
        }
    };
}

/**
 * تولید کانفیگ V2Ray با مسیریابی
 */
export function generateV2rayConfig(uuid, workerDomain, options = {}) {
    const {
        enableIranDirect = true,
        enableChinaDirect = false,
        enableAdBlock = true,
        serverAddress = workerDomain,
        serverPort = 443
    } = options;
    
    const routingRules = generateV2rayRules({
        enableIranDirect,
        enableChinaDirect,
        enableAdBlock
    });
    
    return {
        log: {
            loglevel: 'warning'
        },
        dns: {
            servers: [
                {
                    address: 'https://1.1.1.1/dns-query',
                    domains: ['geosite:geolocation-!cn']
                },
                '8.8.8.8',
                'localhost'
            ]
        },
        inbounds: [
            {
                port: 10808,
                protocol: 'socks',
                settings: {
                    auth: 'noauth',
                    udp: true
                },
                sniffing: {
                    enabled: true,
                    destOverride: ['http', 'tls']
                }
            }
        ],
        outbounds: [
            {
                protocol: 'vless',
                tag: 'proxy',
                settings: {
                    vnext: [
                        {
                            address: serverAddress,
                            port: serverPort,
                            users: [
                                {
                                    id: uuid,
                                    encryption: 'none'
                                }
                            ]
                        }
                    ]
                },
                streamSettings: {
                    network: 'ws',
                    security: 'tls',
                    tlsSettings: {
                        serverName: workerDomain,
                        fingerprint: 'chrome'
                    },
                    wsSettings: {
                        path: '/?ed=2048',
                        headers: {
                            Host: workerDomain
                        }
                    }
                }
            },
            {
                protocol: 'freedom',
                tag: 'direct',
                settings: {}
            },
            {
                protocol: 'blackhole',
                tag: 'block',
                settings: {
                    response: {
                        type: 'http'
                    }
                }
            }
        ],
        routing: {
            domainStrategy: 'IPIfNonMatch',
            rules: routingRules
        }
    };
}
