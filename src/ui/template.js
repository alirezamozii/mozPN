// =============================================
// MozPN - UI کامل با داشبورد و تنظیمات پیشرفته
// =============================================

import { REGION_CONFIG } from '../config/constants.js';
import { CSS_STYLES } from './styles.js';
import { CLIENT_SCRIPTS } from './scripts.js';
import { getTranslation } from '../config/translations.js';

export function generateMainPage(lang = 'fa', uuid = '', workerDomain = '') {
    const t = getTranslation(lang);
    const dir = lang === 'fa' ? 'rtl' : 'ltr';
    const isFa = lang === 'fa';
    
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MozPN - پنل مدیریت</title>
    <style>${CSS_STYLES}</style>
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
</head>
<body>
    <div class="app">
        <!-- هدر -->
        <header class="header">
            <div class="logo">🍌 MozPN</div>
            <div class="header-actions">
                <select id="langSelect" onchange="changeLang(this.value)">
                    <option value="fa" ${lang === 'fa' ? 'selected' : ''}>فارسی</option>
                    <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
                </select>
            </div>
        </header>
        
        <!-- تب‌های ناوبری -->
        <nav class="nav-tabs">
            <button class="nav-tab active" data-tab="subscription" onclick="switchTab('subscription')">
                🔗 ${isFa ? 'اشتراک' : 'Subscription'}
            </button>
            <button class="nav-tab" data-tab="dashboard" onclick="switchTab('dashboard')">
                📊 ${isFa ? 'داشبورد' : 'Dashboard'}
            </button>
            <button class="nav-tab" data-tab="warp" onclick="switchTab('warp')">
                🌐 WARP
            </button>
            <button class="nav-tab" data-tab="fragment" onclick="switchTab('fragment')">
                🧩 Fragment
            </button>
            <button class="nav-tab" data-tab="failover" onclick="switchTab('failover')">
                🔄 Failover
            </button>
            <button class="nav-tab" data-tab="reality" onclick="switchTab('reality')">
                🎭 Reality
            </button>
            <button class="nav-tab" data-tab="backup" onclick="switchTab('backup')">
                💾 ${isFa ? 'بکاپ' : 'Backup'}
            </button>
        </nav>
        
        <!-- پیام -->
        <div id="toast" class="toast"></div>
        
        <!-- محتوای اصلی -->
        <main class="main">
        
        <!-- ===== تب اشتراک ===== -->
        <div id="tab-subscription" class="tab-content active">
            ${generateSubscriptionTab(isFa, lang)}
        </div>
        
        <!-- ===== تب داشبورد ===== -->
        <div id="tab-dashboard" class="tab-content">
            ${generateDashboardTab(isFa)}
        </div>
        
        <!-- ===== تب WARP ===== -->
        <div id="tab-warp" class="tab-content">
            ${generateWarpTab(isFa)}
        </div>
        
        <!-- ===== تب Fragment ===== -->
        <div id="tab-fragment" class="tab-content">
            ${generateFragmentTab(isFa)}
        </div>
        
        <!-- ===== تب Failover ===== -->
        <div id="tab-failover" class="tab-content">
            ${generateFailoverTab(isFa)}
        </div>
        
        <!-- ===== تب Reality ===== -->
        <div id="tab-reality" class="tab-content">
            ${generateRealityTab(isFa)}
        </div>
        
        <!-- ===== تب بکاپ ===== -->
        <div id="tab-backup" class="tab-content">
            ${generateBackupTab(isFa)}
        </div>
            
        </main>
        
        <!-- فوتر -->
        <footer class="footer">
            <span>MozPN v3.0</span>
            <span>•</span>
            <span>${isFa ? 'ساخته شده با ❤️' : 'Made with ❤️'}</span>
        </footer>
    </div>
    
    <script>${CLIENT_SCRIPTS}</script>
</body>
</html>`;
}


// ===== تب اشتراک =====
function generateSubscriptionTab(isFa, lang) {
    return `
    <!-- مرحله ۱: انتخاب پروتکل -->
    <section class="step">
        <div class="step-header">
            <span class="step-num">۱</span>
            <div class="step-info">
                <h2>${isFa ? 'انتخاب پروتکل' : 'Select Protocol'}</h2>
                <p class="step-hint">${isFa ? 'نوع اتصال VPN را انتخاب کنید.' : 'Choose your VPN connection type.'}</p>
            </div>
        </div>
        <div class="step-content">
            <div class="option-row">
                <label class="option-card">
                    <input type="checkbox" id="vlessOn" checked>
                    <div class="option-body">
                        <span class="option-icon">🔐</span>
                        <span class="option-name">VLESS</span>
                        <span class="option-desc">${isFa ? 'سریع و سبک' : 'Fast & Light'}</span>
                    </div>
                </label>
                <label class="option-card">
                    <input type="checkbox" id="trojanOn">
                    <div class="option-body">
                        <span class="option-icon">🐴</span>
                        <span class="option-name">Trojan</span>
                        <span class="option-desc">${isFa ? 'ضد فیلترینگ' : 'Anti-Filter'}</span>
                    </div>
                </label>
            </div>
        </div>
    </section>
    
    <!-- مرحله ۲: انتخاب لوکیشن -->
    <section class="step">
        <div class="step-header">
            <span class="step-num">۲</span>
            <div class="step-info">
                <h2>${isFa ? 'انتخاب لوکیشن' : 'Select Location'}</h2>
                <p class="step-hint">${isFa ? 'کشورهایی که می‌خواهید IP شما به آنجا تغییر کند.' : 'Select countries for your IP location.'}</p>
            </div>
        </div>
        <div class="step-content">
            <div class="server-section">
                <div class="section-title">${isFa ? '⭐ پیشنهادی' : '⭐ Recommended'}</div>
                <div class="server-grid">${generateServersByPriority(lang, 1)}</div>
            </div>
            <div class="server-section">
                <div class="section-title">${isFa ? '🌍 اروپا و آسیا' : '🌍 Europe & Asia'}</div>
                <div class="server-grid">${generateServersByPriority(lang, 2)}</div>
            </div>
            <div class="server-section">
                <div class="section-title">${isFa ? '☁️ سرویس‌های ابری' : '☁️ Cloud Services'}</div>
                <div class="server-grid server-grid-small">${generateServersByPriority(lang, 3)}</div>
            </div>
            <div class="ip-count-row">
                <label>${isFa ? 'تعداد کانفیگ:' : 'Config count:'}</label>
                <select id="ipCountSelect">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                </select>
            </div>
        </div>
    </section>
    
    <!-- مرحله ۳: دریافت لینک -->
    <section class="step step-final">
        <div class="step-header">
            <span class="step-num">۳</span>
            <div class="step-info">
                <h2>${isFa ? 'دریافت لینک اشتراک' : 'Get Subscription Link'}</h2>
            </div>
        </div>
        <div class="step-content">
            <!-- دکمه پیش‌نمایش -->
            <div class="preview-btn-row">
                <button class="btn btn-outline" onclick="showPreview()">
                    👁️ ${isFa ? 'پیش‌نمایش و شبیه‌سازی' : 'Preview & Simulation'}
                </button>
            </div>
            
            <!-- باکس پیش‌نمایش -->
            <div id="previewBox" class="preview-box" style="display:none;">
                <div class="preview-box-header">
                    <span>📋 ${isFa ? 'پیش‌نمایش اشتراک' : 'Subscription Preview'}</span>
                    <div class="preview-box-actions">
                        <button class="btn btn-small" onclick="showTextPreview()">📝 ${isFa ? 'متنی' : 'Text'}</button>
                        <button class="btn btn-small" onclick="hidePreview()">✕</button>
                    </div>
                </div>
                <div id="previewContent" class="preview-content"></div>
            </div>
            
            <div class="client-section">
                <div class="client-label">${isFa ? 'اپلیکیشن خود را انتخاب کنید:' : 'Select your app:'}</div>
                <div class="client-row">
                    <button class="client-btn" data-client="v2rayng" onclick="getLink('v2rayng')">
                        <span class="client-icon">📱</span>
                        <span class="client-name">V2RayNG</span>
                        <span class="client-platform">Android</span>
                    </button>
                    <button class="client-btn" data-client="v2rayn" onclick="getLink('v2rayn')">
                        <span class="client-icon">💻</span>
                        <span class="client-name">V2RayN</span>
                        <span class="client-platform">Windows</span>
                    </button>
                    <button class="client-btn" data-client="shadowrocket" onclick="getLink('shadowrocket')">
                        <span class="client-icon">🚀</span>
                        <span class="client-name">Shadowrocket</span>
                        <span class="client-platform">iOS</span>
                    </button>
                    <button class="client-btn" data-client="clash" onclick="getLink('clash')">
                        <span class="client-icon">⚔️</span>
                        <span class="client-name">Clash</span>
                        <span class="client-platform">${isFa ? 'همه' : 'All'}</span>
                    </button>
                </div>
            </div>
            <div id="linkBox" class="link-box" style="display:none;">
                <div class="link-label">${isFa ? '🔗 لینک اشتراک:' : '🔗 Subscription link:'}</div>
                <div class="link-input-wrap">
                    <input type="text" id="linkInput" readonly>
                    <button class="btn-copy" onclick="copyLink()">📋</button>
                </div>
                <div class="link-actions">
                    <button class="btn btn-outline" onclick="toggleQR()">📱 QR Code</button>
                </div>
                <div id="qrBox" class="qr" style="display:none;">
                    <canvas id="qrCanvas"></canvas>
                </div>
            </div>
        </div>
    </section>
    
    <!-- ===== بخش تنظیمات نام‌گذاری ===== -->
    <section class="step">
        <div class="step-header">
            <span class="step-num">⚙️</span>
            <div class="step-info">
                <h2>${isFa ? 'تنظیمات نام‌گذاری کانفیگ‌ها' : 'Config Naming Settings'}</h2>
                <p class="step-hint">${isFa ? 'نحوه نمایش نام کانفیگ‌ها در اپلیکیشن را تنظیم کنید' : 'Customize how config names appear in your app'}</p>
            </div>
        </div>
        <div class="step-content">
            <!-- فرمت نام‌گذاری -->
            <div class="form-group">
                <label class="form-label">${isFa ? '📋 فرمت نام‌گذاری' : '📋 Naming Format'}</label>
                <select class="form-select" id="nodeNameFormat" onchange="toggleCustomFormat()">
                    <option value="country-user">${isFa ? '🇩🇪 کشور | کاربر' : '🇩🇪 Country | User'}</option>
                    <option value="user-country">${isFa ? 'کاربر | 🇩🇪 کشور' : 'User | 🇩🇪 Country'}</option>
                    <option value="country-only">${isFa ? 'فقط کشور' : 'Country Only'}</option>
                    <option value="user-only">${isFa ? 'فقط کاربر' : 'User Only'}</option>
                    <option value="indexed">${isFa ? 'با شماره ردیف (کاربر | کشور #01)' : 'With Index (User | Country #01)'}</option>
                    <option value="protocol-indexed">${isFa ? 'پروتکل + شماره (کاربر | VLESS | کشور #01)' : 'Protocol + Index'}</option>
                    <option value="custom">${isFa ? '✏️ سفارشی' : '✏️ Custom'}</option>
                </select>
            </div>
            
            <!-- فرمت سفارشی -->
            <div class="form-group" id="customFormatGroup" style="display:none;">
                <label class="form-label">${isFa ? '✏️ الگوی سفارشی' : '✏️ Custom Pattern'}</label>
                <input type="text" class="form-input" id="customNodeFormat" placeholder="{user} | {emoji} {country} #{index}">
                <div class="form-hint">
                    ${isFa ? 'متغیرها:' : 'Variables:'} 
                    <code>{emoji}</code> <code>{country}</code> <code>{user}</code> <code>{remark}</code> 
                    <code>{ip}</code> <code>{port}</code> <code>{index}</code> <code>{num}</code> <code>{protocol}</code>
                </div>
            </div>
            
            <!-- تنظیمات پایه -->
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">${isFa ? '🏷️ پیشوند نام' : '🏷️ Name Prefix'}</label>
                    <input type="text" class="form-input" id="remarkPrefix" placeholder="${isFa ? 'مثال: MyVPN' : 'Example: MyVPN'}" value="">
                </div>
                <div class="form-group">
                    <label class="form-label">${isFa ? '➖ جداکننده' : '➖ Separator'}</label>
                    <input type="text" class="form-input" id="remarkSeparator" placeholder=" | " value=" | ">
                </div>
            </div>
            
            <!-- تنظیمات شماره‌گذاری -->
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">${isFa ? '🔢 شروع شماره' : '🔢 Start Index'}</label>
                    <select class="form-select" id="indexStart">
                        <option value="0">0</option>
                        <option value="1" selected>1</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">${isFa ? '📏 تعداد رقم' : '📏 Padding'}</label>
                    <select class="form-select" id="indexPadding">
                        <option value="1">${isFa ? '1 رقم (1, 2, 3)' : '1 digit (1, 2, 3)'}</option>
                        <option value="2" selected>${isFa ? '2 رقم (01, 02, 03)' : '2 digits (01, 02, 03)'}</option>
                        <option value="3">${isFa ? '3 رقم (001, 002, 003)' : '3 digits (001, 002, 003)'}</option>
                    </select>
                </div>
            </div>
            
            <!-- نوع شماره‌گذاری -->
            <div class="form-group">
                <label class="form-label">${isFa ? '🔄 نوع شماره‌گذاری' : '🔄 Index Type'}</label>
                <div class="option-row">
                    <label class="option-card small">
                        <input type="radio" name="indexType" value="country" checked>
                        <div class="option-body">
                            <span class="option-name">${isFa ? 'جدا برای هر کشور' : 'Per Country'}</span>
                            <span class="option-desc">${isFa ? 'DE #01, DE #02, NL #01' : 'DE #01, DE #02, NL #01'}</span>
                        </div>
                    </label>
                    <label class="option-card small">
                        <input type="radio" name="indexType" value="global">
                        <div class="option-body">
                            <span class="option-name">${isFa ? 'شماره‌گذاری کلی' : 'Global'}</span>
                            <span class="option-desc">${isFa ? 'DE #01, DE #02, NL #03' : 'DE #01, DE #02, NL #03'}</span>
                        </div>
                    </label>
                    <label class="option-card small">
                        <input type="radio" name="indexType" value="protocol">
                        <div class="option-body">
                            <span class="option-name">${isFa ? 'جدا برای هر پروتکل' : 'Per Protocol'}</span>
                            <span class="option-desc">${isFa ? 'VLESS #01, Trojan #01' : 'VLESS #01, Trojan #01'}</span>
                        </div>
                    </label>
                </div>
            </div>
            
            <!-- پیش‌نمایش نام -->
            <div class="preview-name-box">
                <div class="preview-name-label">${isFa ? '👁️ پیش‌نمایش:' : '👁️ Preview:'}</div>
                <div class="preview-name-samples" id="namingPreview">
                    <span class="preview-name-item">🇩🇪 Germany</span>
                    <span class="preview-name-item">🇳🇱 Netherlands</span>
                </div>
            </div>
        </div>
    </section>
    
    <div class="save-bar">
        <button class="btn btn-primary btn-large" onclick="saveAll()">
            💾 ${isFa ? 'ذخیره تنظیمات' : 'Save Settings'}
        </button>
    </div>`;
}


// ===== تب داشبورد =====
function generateDashboardTab(isFa) {
    return `
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>📊 ${isFa ? 'آمار کلی سیستم' : 'System Statistics'}</h2>
            </div>
            <button class="btn btn-outline" onclick="refreshDashboard()">🔄 ${isFa ? 'بروزرسانی' : 'Refresh'}</button>
        </div>
        <div class="step-content">
            <div class="stats-grid" id="statsGrid">
                <div class="stat-card">
                    <div class="stat-value" id="statTotalUsers">-</div>
                    <div class="stat-label">${isFa ? 'کل کاربران' : 'Total Users'}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-value" id="statActiveUsers">-</div>
                    <div class="stat-label">${isFa ? 'کاربران فعال' : 'Active Users'}</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-value" id="statExpiredUsers">-</div>
                    <div class="stat-label">${isFa ? 'منقضی شده' : 'Expired'}</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-value" id="statTotalData">-</div>
                    <div class="stat-label">${isFa ? 'کل مصرف' : 'Total Usage'}</div>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">${isFa ? '📈 وضعیت کاربران' : '📈 Users Status'}</div>
                <div id="usersChart">
                    <div class="chart-bar">
                        <span class="chart-label">${isFa ? 'فعال' : 'Active'}</span>
                        <div class="chart-track"><div class="chart-fill" id="chartActive" style="width:0%"></div></div>
                        <span class="chart-value" id="chartActiveVal">0</span>
                    </div>
                    <div class="chart-bar">
                        <span class="chart-label">${isFa ? 'غیرفعال' : 'Disabled'}</span>
                        <div class="chart-track"><div class="chart-fill" id="chartDisabled" style="width:0%;background:var(--red)"></div></div>
                        <span class="chart-value" id="chartDisabledVal">0</span>
                    </div>
                    <div class="chart-bar">
                        <span class="chart-label">${isFa ? 'منقضی' : 'Expired'}</span>
                        <div class="chart-track"><div class="chart-fill" id="chartExpired" style="width:0%;background:var(--dim)"></div></div>
                        <span class="chart-value" id="chartExpiredVal">0</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>👥 ${isFa ? 'لیست کاربران' : 'Users List'}</h2>
            </div>
        </div>
        <div class="step-content">
            <div style="overflow-x:auto;">
                <table class="users-table" id="usersTable">
                    <thead>
                        <tr>
                            <th>${isFa ? 'نام' : 'Name'}</th>
                            <th>UUID</th>
                            <th>${isFa ? 'وضعیت' : 'Status'}</th>
                            <th>${isFa ? 'مصرف' : 'Usage'}</th>
                            <th>${isFa ? 'اتصالات' : 'Connections'}</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="5" style="text-align:center;color:var(--dim)">${isFa ? 'در حال بارگذاری...' : 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>`;
}


// ===== تب WARP =====
function generateWarpTab(isFa) {
    return `
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>🌐 ${isFa ? 'تنظیمات WARP' : 'WARP Settings'}</h2>
                <p class="step-hint">${isFa ? 'Cloudflare WARP برای عبور از فیلترینگ و افزایش سرعت' : 'Cloudflare WARP for bypassing filters and speed boost'}</p>
            </div>
            <span class="status-badge" id="warpStatus">${isFa ? 'غیرفعال' : 'Inactive'}</span>
        </div>
        <div class="step-content">
            <div class="toggle-row">
                <div class="toggle-info">
                    <div class="toggle-title">${isFa ? 'فعال‌سازی WARP' : 'Enable WARP'}</div>
                    <div class="toggle-desc">${isFa ? 'ترافیک از طریق WARP عبور می‌کند' : 'Traffic will route through WARP'}</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" id="warpEnabled" onchange="toggleWarp()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">${isFa ? 'حالت WARP' : 'WARP Mode'}</label>
                <select class="form-select" id="warpMode">
                    <option value="proxy">${isFa ? 'پروکسی (پیشنهادی)' : 'Proxy (Recommended)'}</option>
                    <option value="warp">${isFa ? 'کامل' : 'Full'}</option>
                    <option value="warp+doh">${isFa ? 'WARP + DoH' : 'WARP + DoH'}</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Endpoint</label>
                    <input type="text" class="form-input" id="warpEndpoint" placeholder="engage.cloudflareclient.com:2408">
                </div>
                <div class="form-group">
                    <label class="form-label">${isFa ? 'کشور' : 'Country'}</label>
                    <select class="form-select" id="warpCountry">
                        <option value="AUTO">${isFa ? 'خودکار' : 'Auto'}</option>
                        <option value="US">🇺🇸 USA</option>
                        <option value="DE">🇩🇪 Germany</option>
                        <option value="NL">🇳🇱 Netherlands</option>
                        <option value="SG">🇸🇬 Singapore</option>
                    </select>
                </div>
            </div>
            
            <div class="action-row">
                <button class="btn btn-primary" onclick="warpAutoSetup()">🚀 ${isFa ? 'راه‌اندازی خودکار' : 'Auto Setup'}</button>
                <button class="btn btn-outline" onclick="warpGetFreeGB()">🎁 ${isFa ? 'گرفتن GB رایگان' : 'Get Free GB'}</button>
                <button class="btn btn-outline" onclick="saveWarpConfig()">💾 ${isFa ? 'ذخیره' : 'Save'}</button>
            </div>
            
            <div class="info-box" id="warpAccountInfo" style="display:none;margin-top:16px;">
                <span id="warpAccountText"></span>
            </div>
        </div>
    </section>
    
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>🔑 ${isFa ? 'ارتقا به WARP+' : 'Upgrade to WARP+'}</h2>
            </div>
        </div>
        <div class="step-content">
            <div class="form-group">
                <label class="form-label">${isFa ? 'کلید لایسنس WARP+' : 'WARP+ License Key'}</label>
                <input type="text" class="form-input" id="warpLicense" placeholder="xxxxxxxx-xxxxxxxx-xxxxxxxx">
                <p class="form-hint">${isFa ? 'از اپ 1.1.1.1 یا تلگرام بات‌ها بگیرید' : 'Get from 1.1.1.1 app or Telegram bots'}</p>
            </div>
            <button class="btn btn-primary" onclick="warpUpgrade()">⬆️ ${isFa ? 'ارتقا' : 'Upgrade'}</button>
        </div>
    </section>`;
}


// ===== تب Fragment =====
function generateFragmentTab(isFa) {
    return `
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>🧩 ${isFa ? 'تنظیمات Fragment' : 'Fragment Settings'}</h2>
                <p class="step-hint">${isFa ? 'تکه‌تکه کردن بسته‌ها برای عبور از فیلترینگ' : 'Packet fragmentation to bypass filtering'}</p>
            </div>
            <span class="status-badge" id="fragmentStatus">${isFa ? 'غیرفعال' : 'Inactive'}</span>
        </div>
        <div class="step-content">
            <div class="toggle-row">
                <div class="toggle-info">
                    <div class="toggle-title">${isFa ? 'فعال‌سازی Fragment' : 'Enable Fragment'}</div>
                    <div class="toggle-desc">${isFa ? 'بسته‌ها تکه‌تکه ارسال می‌شوند' : 'Packets will be fragmented'}</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" id="fragmentEnabled" onchange="toggleFragment()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">${isFa ? 'پیش‌تنظیم' : 'Preset'}</label>
                <div class="preset-grid" id="fragmentPresets">
                    <div class="preset-card" data-preset="default" onclick="applyFragmentPreset('default')">
                        <div class="preset-name">${isFa ? 'پیش‌فرض' : 'Default'}</div>
                        <div class="preset-desc">${isFa ? 'تنظیمات استاندارد' : 'Standard settings'}</div>
                    </div>
                    <div class="preset-card" data-preset="iran_mci" onclick="applyFragmentPreset('iran_mci')">
                        <div class="preset-name">${isFa ? 'همراه اول' : 'MCI'}</div>
                        <div class="preset-desc">${isFa ? 'بهینه برای MCI' : 'Optimized for MCI'}</div>
                    </div>
                    <div class="preset-card" data-preset="iran_irancell" onclick="applyFragmentPreset('iran_irancell')">
                        <div class="preset-name">${isFa ? 'ایرانسل' : 'Irancell'}</div>
                        <div class="preset-desc">${isFa ? 'بهینه برای MTN' : 'Optimized for MTN'}</div>
                    </div>
                    <div class="preset-card" data-preset="aggressive" onclick="applyFragmentPreset('aggressive')">
                        <div class="preset-name">${isFa ? 'تهاجمی' : 'Aggressive'}</div>
                        <div class="preset-desc">${isFa ? 'فیلترینگ شدید' : 'Heavy filtering'}</div>
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">${isFa ? 'اندازه تکه (Length)' : 'Fragment Length'}</label>
                    <input type="text" class="form-input" id="fragmentLength" placeholder="100-200">
                </div>
                <div class="form-group">
                    <label class="form-label">${isFa ? 'فاصله (Interval)' : 'Interval'}</label>
                    <input type="text" class="form-input" id="fragmentInterval" placeholder="10-20">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">${isFa ? 'حالت' : 'Mode'}</label>
                <select class="form-select" id="fragmentMode">
                    <option value="tlshello">TLS Hello</option>
                    <option value="1-1">1-1</option>
                    <option value="1-2">1-2</option>
                    <option value="1-3">1-3</option>
                </select>
            </div>
            
            <div class="action-row">
                <button class="btn btn-primary" onclick="saveFragmentConfig()">💾 ${isFa ? 'ذخیره' : 'Save'}</button>
                <button class="btn btn-outline" onclick="testFragment()">🧪 ${isFa ? 'تست' : 'Test'}</button>
            </div>
        </div>
    </section>`;
}


// ===== تب Failover =====
function generateFailoverTab(isFa) {
    return `
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>🔄 ${isFa ? 'تنظیمات Failover' : 'Failover Settings'}</h2>
                <p class="step-hint">${isFa ? 'تغییر خودکار سرور در صورت قطعی' : 'Automatic server switching on failure'}</p>
            </div>
            <span class="status-badge" id="failoverStatus">${isFa ? 'غیرفعال' : 'Inactive'}</span>
        </div>
        <div class="step-content">
            <div class="toggle-row">
                <div class="toggle-info">
                    <div class="toggle-title">${isFa ? 'فعال‌سازی Failover' : 'Enable Failover'}</div>
                    <div class="toggle-desc">${isFa ? 'در صورت قطعی به سرور بعدی سوئیچ می‌شود' : 'Switch to next server on failure'}</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" id="failoverEnabled" onchange="toggleFailover()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">${isFa ? 'فاصله چک (ثانیه)' : 'Check Interval (sec)'}</label>
                    <input type="number" class="form-input" id="failoverInterval" value="30" min="10">
                </div>
                <div class="form-group">
                    <label class="form-label">${isFa ? 'تایم‌اوت (ms)' : 'Timeout (ms)'}</label>
                    <input type="number" class="form-input" id="failoverTimeout" value="5000" min="1000">
                </div>
            </div>
            
            <div class="action-row">
                <button class="btn btn-primary" onclick="saveFailoverConfig()">💾 ${isFa ? 'ذخیره' : 'Save'}</button>
                <button class="btn btn-outline" onclick="runHealthCheck()">🏥 ${isFa ? 'چک سلامت' : 'Health Check'}</button>
            </div>
        </div>
    </section>
    
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>📡 ${isFa ? 'لیست Endpoint ها' : 'Endpoints List'}</h2>
            </div>
            <button class="btn btn-outline" onclick="showAddEndpoint()">➕ ${isFa ? 'افزودن' : 'Add'}</button>
        </div>
        <div class="step-content">
            <div class="endpoint-list" id="endpointList">
                <div class="endpoint-item" style="justify-content:center;color:var(--dim)">
                    ${isFa ? 'در حال بارگذاری...' : 'Loading...'}
                </div>
            </div>
            
            <!-- فرم افزودن -->
            <div id="addEndpointForm" style="display:none;margin-top:16px;">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">${isFa ? 'آدرس' : 'Address'}</label>
                        <input type="text" class="form-input" id="newEndpointAddress" placeholder="example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${isFa ? 'پورت' : 'Port'}</label>
                        <input type="number" class="form-input" id="newEndpointPort" value="443">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">${isFa ? 'نام (اختیاری)' : 'Name (optional)'}</label>
                    <input type="text" class="form-input" id="newEndpointName" placeholder="Server 1">
                </div>
                <div class="action-row">
                    <button class="btn btn-primary" onclick="addEndpoint()">✓ ${isFa ? 'افزودن' : 'Add'}</button>
                    <button class="btn btn-outline" onclick="hideAddEndpoint()">✕ ${isFa ? 'لغو' : 'Cancel'}</button>
                </div>
            </div>
        </div>
    </section>`;
}


// ===== تب Reality =====
function generateRealityTab(isFa) {
    return `
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>🎭 ${isFa ? 'تنظیمات Reality' : 'Reality Settings'}</h2>
                <p class="step-hint">${isFa ? 'پروتکل Reality برای امنیت بیشتر' : 'Reality protocol for enhanced security'}</p>
            </div>
            <span class="status-badge" id="realityStatus">${isFa ? 'غیرفعال' : 'Inactive'}</span>
        </div>
        <div class="step-content">
            <div class="toggle-row">
                <div class="toggle-info">
                    <div class="toggle-title">${isFa ? 'فعال‌سازی Reality' : 'Enable Reality'}</div>
                    <div class="toggle-desc">${isFa ? 'استفاده از TLS واقعی سایت‌های معتبر' : 'Use real TLS from trusted sites'}</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" id="realityEnabled" onchange="toggleReality()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">${isFa ? 'سایت Fallback' : 'Fallback Site'}</label>
                <div class="form-row">
                    <input type="text" class="form-input" id="realityFallback" placeholder="www.google.com" style="flex:1">
                    <button class="btn btn-outline" onclick="getRandomFallback()">🎲 ${isFa ? 'تصادفی' : 'Random'}</button>
                </div>
                <p class="form-hint">${isFa ? 'سایتی که TLS آن استفاده می‌شود' : 'Site whose TLS will be used'}</p>
            </div>
            
            <div class="form-group">
                <label class="form-label">Fingerprint</label>
                <select class="form-select" id="realityFingerprint">
                    <option value="chrome">Chrome</option>
                    <option value="firefox">Firefox</option>
                    <option value="safari">Safari</option>
                    <option value="edge">Edge</option>
                    <option value="random">Random</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Short ID</label>
                    <div style="display:flex;gap:8px;">
                        <input type="text" class="form-input" id="realityShortId" placeholder="abc123" style="flex:1">
                        <button class="btn btn-outline" onclick="generateShortId()">🔄</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Spider X</label>
                    <input type="text" class="form-input" id="realitySpiderX" placeholder="/">
                </div>
            </div>
            
            <div class="action-row">
                <button class="btn btn-primary" onclick="saveRealityConfig()">💾 ${isFa ? 'ذخیره' : 'Save'}</button>
                <button class="btn btn-outline" onclick="generateRealityKeys()">🔑 ${isFa ? 'تولید کلید' : 'Generate Keys'}</button>
                <button class="btn btn-outline" onclick="validateFallbackSite()">✓ ${isFa ? 'تست سایت' : 'Test Site'}</button>
            </div>
            
            <div class="info-box" id="realityKeysInfo" style="display:none;margin-top:16px;">
                <div style="width:100%">
                    <div style="margin-bottom:8px;"><strong>Public Key:</strong> <code id="realityPublicKey" style="word-break:break-all;"></code></div>
                    <button class="btn-sm" onclick="copyRealityKey()">📋 ${isFa ? 'کپی' : 'Copy'}</button>
                </div>
            </div>
        </div>
    </section>`;
}


// ===== تب بکاپ =====
function generateBackupTab(isFa) {
    return `
    <!-- خلاصه تنظیمات فعلی -->
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>📊 ${isFa ? 'خلاصه تنظیمات فعلی' : 'Current Settings Summary'}</h2>
            </div>
            <button class="btn btn-outline" onclick="loadBackupSummary()">🔄 ${isFa ? 'بروزرسانی' : 'Refresh'}</button>
        </div>
        <div class="step-content">
            <div id="backupSummary" class="backup-summary">
                <div class="summary-loading">${isFa ? 'در حال بارگذاری...' : 'Loading...'}</div>
            </div>
        </div>
    </section>
    
    <!-- خروجی گرفتن -->
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>📤 ${isFa ? 'خروجی گرفتن (Export)' : 'Export Backup'}</h2>
                <p class="step-hint">${isFa ? 'دانلود فایل بکاپ از تنظیمات فعلی' : 'Download backup file from current settings'}</p>
            </div>
        </div>
        <div class="step-content">
            <div class="export-options">
                <div class="toggle-row">
                    <div class="toggle-info">
                        <div class="toggle-title">${isFa ? 'شامل کاربران' : 'Include Users'}</div>
                        <div class="toggle-desc">${isFa ? 'لیست کاربران در بکاپ ذخیره شود' : 'Save users list in backup'}</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="exportUsers" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="toggle-row">
                    <div class="toggle-info">
                        <div class="toggle-title">${isFa ? 'شامل WARP' : 'Include WARP'}</div>
                        <div class="toggle-desc">${isFa ? 'تنظیمات WARP در بکاپ ذخیره شود' : 'Save WARP settings in backup'}</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="exportWarp" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="toggle-row">
                    <div class="toggle-info">
                        <div class="toggle-title">${isFa ? 'شامل کلیدهای خصوصی' : 'Include Private Keys'}</div>
                        <div class="toggle-desc">${isFa ? '⚠️ کلیدهای WARP و Reality (فقط برای انتقال کامل)' : '⚠️ WARP & Reality keys (for full migration only)'}</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="exportSensitive">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="action-row" style="margin-top:16px;">
                <button class="btn btn-primary btn-large" onclick="exportBackup()">
                    📥 ${isFa ? 'دانلود بکاپ' : 'Download Backup'}
                </button>
            </div>
        </div>
    </section>
    
    <!-- وارد کردن -->
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>📥 ${isFa ? 'وارد کردن (Import)' : 'Import Backup'}</h2>
                <p class="step-hint">${isFa ? 'بازیابی تنظیمات از فایل بکاپ' : 'Restore settings from backup file'}</p>
            </div>
        </div>
        <div class="step-content">
            <div class="form-group">
                <label class="form-label">${isFa ? 'انتخاب فایل بکاپ' : 'Select Backup File'}</label>
                <div class="file-input-wrap">
                    <input type="file" id="backupFile" accept=".json" onchange="previewBackupFile()">
                    <label for="backupFile" class="file-input-label">
                        📁 ${isFa ? 'انتخاب فایل JSON' : 'Choose JSON File'}
                    </label>
                    <span id="selectedFileName" class="file-name"></span>
                </div>
            </div>
            
            <!-- پیش‌نمایش بکاپ -->
            <div id="backupPreview" class="backup-preview" style="display:none;">
                <div class="preview-header-bar">
                    <span>📋 ${isFa ? 'پیش‌نمایش فایل بکاپ' : 'Backup File Preview'}</span>
                </div>
                <div id="backupPreviewContent"></div>
            </div>
            
            <!-- گزینه‌های وارد کردن -->
            <div id="importOptions" class="import-options" style="display:none;">
                <div class="form-group">
                    <label class="form-label">${isFa ? 'حالت وارد کردن' : 'Import Mode'}</label>
                    <select class="form-select" id="importMode">
                        <option value="replace">${isFa ? 'جایگزینی (پیشنهادی)' : 'Replace (Recommended)'}</option>
                        <option value="merge">${isFa ? 'ادغام با تنظیمات فعلی' : 'Merge with current settings'}</option>
                    </select>
                </div>
                
                <div class="import-sections">
                    <div class="section-title">${isFa ? 'بخش‌هایی که وارد شوند:' : 'Sections to import:'}</div>
                    <div class="checkbox-grid">
                        <label class="checkbox-item">
                            <input type="checkbox" id="importConfig" checked>
                            <span>⚙️ ${isFa ? 'تنظیمات اصلی' : 'Main Config'}</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importCountries" checked>
                            <span>🌍 ${isFa ? 'کشورها' : 'Countries'}</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importProxies" checked>
                            <span>🔧 ${isFa ? 'پروکسی‌ها' : 'Proxies'}</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importWarpSettings" checked>
                            <span>🌐 WARP</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importFragment" checked>
                            <span>🧩 Fragment</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importFailover" checked>
                            <span>🔄 Failover</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importReality" checked>
                            <span>🎭 Reality</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="importUsersData">
                            <span>👥 ${isFa ? 'کاربران' : 'Users'}</span>
                        </label>
                    </div>
                </div>
                
                <div class="action-row" style="margin-top:16px;">
                    <button class="btn btn-primary btn-large" onclick="importBackup()">
                        📤 ${isFa ? 'وارد کردن بکاپ' : 'Import Backup'}
                    </button>
                    <button class="btn btn-outline" onclick="cancelImport()">
                        ✕ ${isFa ? 'لغو' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    </section>
    
    <!-- بازنشانی -->
    <section class="step">
        <div class="step-header">
            <div class="step-info">
                <h2>🗑️ ${isFa ? 'بازنشانی تنظیمات' : 'Reset Settings'}</h2>
                <p class="step-hint">${isFa ? '⚠️ این عملیات قابل بازگشت نیست!' : '⚠️ This action cannot be undone!'}</p>
            </div>
        </div>
        <div class="step-content">
            <div class="warning-box">
                <span class="warning-icon">⚠️</span>
                <div class="warning-text">
                    ${isFa 
                        ? 'با بازنشانی، تمام تنظیمات به حالت پیش‌فرض برمی‌گردند. قبل از این کار حتماً بکاپ بگیرید!' 
                        : 'Resetting will restore all settings to default. Make sure to backup first!'}
                </div>
            </div>
            <div class="action-row" style="margin-top:16px;">
                <button class="btn btn-danger" onclick="confirmReset()">
                    🗑️ ${isFa ? 'بازنشانی همه تنظیمات' : 'Reset All Settings'}
                </button>
            </div>
        </div>
    </section>`;
}

// ===== توابع کمکی =====
function generateServersByPriority(lang, priority) {
    const defaults = ['US', 'SG', 'DE', 'NL'];
    let html = '';
    
    for (const [code, cfg] of Object.entries(REGION_CONFIG)) {
        if (cfg.priority !== priority) continue;
        
        const name = lang === 'fa' ? cfg.name : cfg.nameEn;
        const on = defaults.includes(code);
        html += `
            <label class="server-item ${on ? 'active' : ''}">
                <input type="checkbox" data-code="${code}" ${on ? 'checked' : ''}>
                <span class="server-flag">${cfg.emoji}</span>
                <span class="server-name">${name}</span>
            </label>`;
    }
    return html;
}
