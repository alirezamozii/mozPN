// =============================================
// MozPN Worker - نسخه 3.0 (ققنوس)
// ساخته شده با ❤️
// =============================================

import { handleWsRequest } from './handlers/websocket.js';
import { generateSubscription, handleSubscriptionPreviewAPI } from './handlers/subscription.js';
import { handleConfigAPI, handleRegionAPI, handlePreferredIPsAPI } from './handlers/config.js';
import { handleUsersAPI } from './handlers/users.js';
import { handleRoutingAPI, generateSingboxConfig, generateV2rayConfig } from './handlers/routing.js';
import { handleWarpAPI } from './handlers/warp.js';
import { handleFragmentAPI } from './handlers/fragment.js';
import { handleFailoverAPI } from './handlers/failover.js';
import { handleRealityAPI } from './handlers/reality.js';
import { handleBackupAPI } from './handlers/backup.js';
import { scheduledHealthCheck } from './services/failoverManager.js';
import { handleFallback, isValidRequest } from './services/realityManager.js';
import { generateMainPage } from './ui/template.js';
import { initKVStore, getConfigValue, getPassword, setPassword } from './services/kvStore.js';
import { authenticateUser, updateUserConnection } from './services/userManager.js';
import { isValidUUID } from './utils/validators.js';
import { detectLanguage } from './config/translations.js';
import { htmlResponse, jsonResponse } from './utils/helpers.js';
import { DEFAULT_PROXY_IPS } from './config/constants.js';
import { handleXhttpPost } from './protocols/xhttp.js';

// متغیر سراسری برای KV
let workerKvStore = null;

export default {
    async fetch(request, env, ctx) {
        try {
            // راه‌اندازی KV
            await initKVStore(env);
            workerKvStore = env.C || null;
            
            // دریافت UUID از env
            const uuid = (env.u || env.U || '').toLowerCase();
            
            if (!uuid || !isValidUUID(uuid)) {
                return jsonResponse({
                    error: 'UUID نامعتبر',
                    message: 'لطفا متغیر u را در wrangler.toml تنظیم کنید'
                }, 400);
            }
            
            const url = new URL(request.url);
            const workerDomain = url.hostname;
            
            // مسیر سفارشی - پیش‌فرض /mozpn
            const customPath = getConfigValue('d', env.d || env.D || 'mozpn');
            const basePath = `/${customPath.replace(/^\//, '')}`;
            
            // تنظیمات پروتکل
            const enableVless = getConfigValue('ev', 'yes') !== 'no';
            const enableTrojan = getConfigValue('et', 'no') === 'yes';
            const enableXhttp = getConfigValue('ex', 'no') === 'yes';
            const trojanPassword = getConfigValue('tp', '');
            const fallbackAddress = getConfigValue('p', env.p || env.P || '');
            const currentRegion = await detectWorkerRegion(request);
            
            // تنظیمات مدیریت کاربران
            const enableUserManagement = getConfigValue('userManagement', 'no') === 'yes';
            
            // مدیریت POST برای xhttp
            if (request.method === 'POST' && enableXhttp) {
                const r = await handleXhttpPost(request, uuid, fallbackAddress);
                if (r) {
                    ctx.waitUntil(r.closed);
                    return new Response(r.readable, {
                        headers: {
                            'X-Accel-Buffering': 'no',
                            'Cache-Control': 'no-store',
                            'Connection': 'keep-alive',
                            'User-Agent': 'Go-http-client/2.0',
                            'Content-Type': 'application/grpc'
                        }
                    });
                }
                return new Response('Internal Server Error', { status: 500 });
            }
            
            // WebSocket
            if (request.headers.get('Upgrade') === 'websocket') {
                // احراز هویت کاربر (اگر مدیریت کاربران فعال باشد)
                if (enableUserManagement && workerKvStore) {
                    const authResult = await authenticateUser(workerKvStore, uuid, enableUserManagement);
                    if (!authResult.valid) {
                        // ارسال پیام خطا به کلاینت
                        const errorMessages = {
                            'USER_NOT_FOUND': 'کاربر یافت نشد',
                            'USER_DISABLED': 'حساب کاربری غیرفعال است',
                            'SUBSCRIPTION_EXPIRED': 'اشتراک منقضی شده است',
                            'DATA_LIMIT_EXCEEDED': 'حجم مصرفی تمام شده است'
                        };
                        
                        return new Response(errorMessages[authResult.reason] || 'خطای احراز هویت', {
                            status: 403,
                            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                        });
                    }
                }
                
                const config = {
                    uuid,
                    enableVless,
                    enableTrojan,
                    trojanPassword,
                    fallbackAddress,
                    currentRegion,
                    socksConfig: parseSocksConfig(getConfigValue('s', env.s || env.S || '')),
                    backupIPs: DEFAULT_PROXY_IPS
                };
                
                return await handleWsRequest(request, config);
            }
            
            // ===== API های جدید =====
            
            // API مدیریت کاربران
            if (url.pathname.includes('/api/users')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleUsersAPI(request, workerKvStore);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API مسیریابی جغرافیایی
            if (url.pathname.includes('/api/routing')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleRoutingAPI(request);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API کانفیگ Sing-box
            if (url.pathname.includes('/api/singbox-config')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        const config = generateSingboxConfig(uuid, workerDomain, {
                            enableIranDirect: getConfigValue('iranDirect', 'yes') !== 'no',
                            enableChinaDirect: getConfigValue('chinaDirect', 'no') === 'yes',
                            enableAdBlock: getConfigValue('adBlock', 'yes') !== 'no'
                        });
                        return jsonResponse(config);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API کانفیگ V2Ray
            if (url.pathname.includes('/api/v2ray-config')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        const config = generateV2rayConfig(uuid, workerDomain, {
                            enableIranDirect: getConfigValue('iranDirect', 'yes') !== 'no',
                            enableChinaDirect: getConfigValue('chinaDirect', 'no') === 'yes',
                            enableAdBlock: getConfigValue('adBlock', 'yes') !== 'no'
                        });
                        return jsonResponse(config);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API تنظیمات
            if (url.pathname.includes('/api/config')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleConfigAPI(request);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API IP های بهینه
            if (url.pathname.includes('/api/preferred-ips')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handlePreferredIPsAPI(request);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API مدیریت WARP
            if (url.pathname.includes('/api/warp')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleWarpAPI(request);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API مدیریت Fragment
            if (url.pathname.includes('/api/fragment')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleFragmentAPI(request);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API مدیریت Failover
            if (url.pathname.includes('/api/failover')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleFailoverAPI(request, env);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API مدیریت Reality
            if (url.pathname.includes('/api/reality')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleRealityAPI(request);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API پشتیبان‌گیری و بازیابی
            if (url.pathname.includes('/api/backup')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                const apiIndex = pathParts.indexOf('api');
                
                if (apiIndex > 0) {
                    const pathIdentifier = pathParts.slice(0, apiIndex).join('/');
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleBackupAPI(request, workerKvStore);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API منطقه
            if (url.pathname.endsWith('/region')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                
                if (pathParts.length === 2 && pathParts[1] === 'region') {
                    const pathIdentifier = pathParts[0];
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return await handleRegionAPI(request, currentRegion);
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // API تست
            if (url.pathname.endsWith('/test-api')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                
                if (pathParts.length === 2 && pathParts[1] === 'test-api') {
                    const pathIdentifier = pathParts[0];
                    
                    if (isValidPath(pathIdentifier, uuid, customPath)) {
                        return jsonResponse({
                            detectedRegion: currentRegion,
                            message: 'تست API موفق',
                            version: '3.0',
                            features: {
                                userManagement: enableUserManagement,
                                vless: enableVless,
                                trojan: enableTrojan,
                                xhttp: enableXhttp,
                                iranDirect: getConfigValue('iranDirect', 'yes') !== 'no',
                                adBlock: getConfigValue('adBlock', 'yes') !== 'no',
                                warp: getConfigValue('warpEnabled', 'no') === 'yes',
                                fragment: getConfigValue('fragmentEnabled', 'no') === 'yes',
                                failover: getConfigValue('failoverEnabled', 'no') === 'yes',
                                reality: getConfigValue('realityEnabled', 'no') === 'yes'
                            },
                            apis: {
                                users: `${basePath}/api/users`,
                                routing: `${basePath}/api/routing`,
                                warp: `${basePath}/api/warp`,
                                fragment: `${basePath}/api/fragment`,
                                failover: `${basePath}/api/failover`,
                                reality: `${basePath}/api/reality`,
                                backup: `${basePath}/api/backup`,
                                singbox: `${basePath}/api/singbox-config`,
                                v2ray: `${basePath}/api/v2ray-config`,
                                preview: `${basePath}/preview`,
                                subscription: `${basePath}/sub`
                            },
                            timestamp: new Date().toISOString()
                        });
                    }
                    return jsonResponse({ error: 'مسیر نامعتبر' }, 403);
                }
            }
            
            // اشتراک
            if (url.pathname === `${basePath}/sub` || url.pathname === `${basePath}/sub/`) {
                return await generateSubscription(request, uuid, workerDomain);
            }
            
            // پیش‌نمایش اشتراک - نشون میده چه کانفیگ‌هایی ساخته میشه
            if (url.pathname === `${basePath}/preview` || url.pathname === `${basePath}/preview/`) {
                return await handleSubscriptionPreviewAPI(request, uuid, workerDomain);
            }
            
            // صفحه اصلی پنل - با چک کردن رمز
            if (url.pathname === basePath || url.pathname === `${basePath}/`) {
                const lang = detectLanguage(request);
                
                // چک کردن رمز از کوکی
                const cookieHeader = request.headers.get('Cookie') || '';
                const isAuthenticated = cookieHeader.includes('mozpn_auth=true');
                
                // اگه رمز تنظیم شده و کاربر لاگین نکرده
                const savedPassword = await getPassword();
                if (savedPassword && !isAuthenticated) {
                    return htmlResponse(generateLoginPage(lang, basePath));
                }
                
                const html = generateMainPage(lang, uuid, workerDomain);
                return htmlResponse(html);
            }
            
            // API لاگین
            if (url.pathname === `${basePath}/login` && request.method === 'POST') {
                try {
                    const formData = await request.formData();
                    const password = formData.get('password') || '';
                    const savedPassword = await getPassword();
                    
                    if (password === savedPassword) {
                        return new Response(null, {
                            status: 302,
                            headers: {
                                'Location': basePath,
                                'Set-Cookie': 'mozpn_auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400'
                            }
                        });
                    } else {
                        const lang = detectLanguage(request);
                        return htmlResponse(generateLoginPage(lang, basePath, true));
                    }
                } catch (e) {
                    return jsonResponse({ error: 'خطا در لاگین' }, 500);
                }
            }
            
            // API تنظیم رمز
            if (url.pathname === `${basePath}/set-password` && request.method === 'POST') {
                try {
                    const data = await request.json();
                    const newPassword = data.password || '';
                    
                    if (newPassword.length < 4) {
                        return jsonResponse({ success: false, message: 'رمز باید حداقل 4 کاراکتر باشد' }, 400);
                    }
                    
                    await setPassword(newPassword);
                    return jsonResponse({ success: true, message: 'رمز ذخیره شد' });
                } catch (e) {
                    return jsonResponse({ error: 'خطا در ذخیره رمز' }, 500);
                }
            }
            
            // API خروج
            if (url.pathname === `${basePath}/logout`) {
                return new Response(null, {
                    status: 302,
                    headers: {
                        'Location': basePath,
                        'Set-Cookie': 'mozpn_auth=; Path=/; HttpOnly; Max-Age=0'
                    }
                });
            }
            
            // صفحه خانه - ریدایرکت به Cloudflare Speed Test برای استتار
            if (url.pathname === '/') {
                // چک کردن homepage سفارشی
                const customHomepage = getConfigValue('homepage', env.homepage || env.HOMEPAGE || '');
                if (customHomepage && customHomepage.trim()) {
                    try {
                        const homepageResponse = await fetch(customHomepage.trim(), {
                            headers: {
                                'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
                            }
                        });
                        if (homepageResponse.ok) {
                            const content = await homepageResponse.text();
                            const contentType = homepageResponse.headers.get('Content-Type') || 'text/html';
                            return new Response(content, {
                                headers: { 'Content-Type': contentType }
                            });
                        }
                    } catch (e) {
                        // اگه خطا داد، ریدایرکت به speed test
                    }
                }
                
                // پیش‌فرض: ریدایرکت به Cloudflare Speed Test
                return Response.redirect('https://speed.cloudflare.com', 302);
            }
            
            // 404
            return jsonResponse({
                error: 'یافت نشد',
                message: 'مسیر درخواستی وجود ندارد'
            }, 404);
            
        } catch (error) {
            console.error('خطا در Worker:', error);
            return jsonResponse({
                error: 'خطای سرور',
                message: error.message
            }, 500);
        }
    },
    
    /**
     * Scheduled Handler برای Health Check خودکار
     * این تابع هر 5 دقیقه توسط Cloudflare فراخوانی می‌شود
     */
    async scheduled(event, env, ctx) {
        try {
            await initKVStore(env);
            const result = await scheduledHealthCheck(env);
            console.log('Health Check Result:', JSON.stringify(result));
        } catch (error) {
            console.error('خطا در Scheduled Health Check:', error);
        }
    }
};

/**
 * بررسی اعتبار مسیر
 */
function isValidPath(pathIdentifier, uuid, customPath) {
    if (customPath && customPath.trim()) {
        const cleanCustomPath = customPath.trim().startsWith('/') 
            ? customPath.trim().substring(1) 
            : customPath.trim();
        return pathIdentifier === cleanCustomPath;
    }
    return isValidUUID(pathIdentifier) && pathIdentifier === uuid;
}

/**
 * تشخیص منطقه Worker
 */
async function detectWorkerRegion(request) {
    try {
        const cfCountry = request.cf?.country;
        
        if (cfCountry) {
            const countryToRegion = {
                'US': 'US', 'SG': 'SG', 'JP': 'JP', 'KR': 'KR',
                'DE': 'DE', 'SE': 'SE', 'NL': 'NL', 'FI': 'FI', 'GB': 'GB',
                'CN': 'SG', 'TW': 'JP', 'AU': 'SG', 'CA': 'US',
                'FR': 'DE', 'IT': 'DE', 'ES': 'DE', 'CH': 'DE',
                'AT': 'DE', 'BE': 'NL', 'DK': 'SE', 'NO': 'SE', 'IE': 'GB',
                'IR': 'DE', 'TR': 'DE'
            };
            
            return countryToRegion[cfCountry] || 'SG';
        }
        
        return 'SG';
    } catch {
        return 'SG';
    }
}

/**
 * پارس تنظیمات SOCKS5
 */
function parseSocksConfig(address) {
    if (!address || !address.trim()) return null;
    
    try {
        let [latter, former] = address.split("@").reverse();
        let username, password, hostname, socksPort;
        
        if (former) {
            const formers = former.split(":");
            if (formers.length !== 2) return null;
            [username, password] = formers;
        }
        
        const latters = latter.split(":");
        socksPort = Number(latters.pop());
        if (isNaN(socksPort)) return null;
        
        hostname = latters.join(":");
        if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) return null;
        
        return { username, password, hostname, socksPort };
    } catch {
        return null;
    }
}

/**
 * صفحه ورود رمز
 */
function generateLoginPage(lang, basePath, hasError = false) {
    const t = lang === 'fa' ? {
        title: 'ورود به MozPN',
        enterPassword: 'رمز عبور را وارد کنید',
        placeholder: 'رمز عبور...',
        login: 'ورود',
        error: 'رمز اشتباه است'
    } : {
        title: 'Login to MozPN',
        enterPassword: 'Enter your password',
        placeholder: 'Password...',
        login: 'Login',
        error: 'Wrong password'
    };
    
    const dir = lang === 'fa' ? 'rtl' : 'ltr';
    
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            direction: ${dir};
        }
        .login-box {
            width: 90%;
            max-width: 400px;
            background: rgba(26, 26, 46, 0.95);
            border: 2px solid #FFD700;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.8em;
            color: #FFD700;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }
        .icon {
            text-align: center;
            font-size: 4em;
            margin-bottom: 20px;
        }
        input {
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid #FFD700;
            border-radius: 10px;
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }
        input:focus {
            outline: none;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
        }
        input::placeholder { color: #888; }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #FFD700, #DAA520);
            border: none;
            border-radius: 10px;
            color: #1a1a2e;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
        }
        .error {
            background: rgba(255, 68, 68, 0.2);
            border: 1px solid #ff4444;
            color: #ff4444;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="icon">🔐</div>
        <h1>${t.title}</h1>
        ${hasError ? `<div class="error">${t.error}</div>` : ''}
        <form method="POST" action="${basePath}/login">
            <input type="password" name="password" placeholder="${t.placeholder}" required autofocus>
            <button type="submit">${t.login}</button>
        </form>
    </div>
</body>
</html>`;
}
