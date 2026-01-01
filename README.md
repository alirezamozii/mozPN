# 🍌 MozPN v3.0 (ققنوس)

پلتفرم مدیریت ترافیک هوشمند بر پایه Cloudflare Workers

## ✨ قابلیت‌ها

### 🔐 پروتکل‌ها
- **VLESS** - پروتکل اصلی با پشتیبانی WebSocket
- **Trojan** - پروتکل جایگزین با رمزنگاری قوی
- **XHTTP** - پروتکل HTTP/2 برای عبور از فیلترینگ

### 👥 مدیریت کاربران
- ایجاد/ویرایش/حذف کاربران
- تاریخ انقضا و محدودیت حجم
- فعال/غیرفعال کردن کاربران
- آمار مصرف و اتصالات

### 🌍 مسیریابی هوشمند (GeoIP/GeoSite)
- عبور مستقیم ترافیک ایران
- عبور مستقیم ترافیک چین (اختیاری)
- بلاک تبلیغات و بدافزار
- منابع Chocolate4U

### 🛡️ WARP (WireGuard) - ثبت‌نام خودکار!
- **یک کلیک = اکانت WARP رایگان** - بدون نیاز به اسکنر یا کلید دستی
- ثبت‌نام خودکار در Cloudflare WARP
- ارتقا به WARP+ با لایسنس
- تولید کانفیگ WireGuard
- انتخاب بهترین Endpoint
- پشتیبانی Sing-box و Xray
- **هماهنگ با کشورهای انتخاب‌شده** - نودهای WARP برای هر کشور انتخابی ساخته میشن

### ✂️ Fragmentation
- تکه‌تکه کردن TLS Client Hello
- پیش‌تنظیمات برای اپراتورهای ایران
- تنظیمات سفارشی طول و تاخیر

### 🔄 Smart Failover
- Health Check خودکار
- تغییر مسیر هوشمند
- Load Balancing
- Cron Trigger هر 5 دقیقه

### 🎭 Reality Simulation
- Fallback به سایت‌های معتبر
- TLS Fingerprinting
- تولید کلید X25519

## 🚀 نصب سریع

### 1. Clone کردن
```bash
git clone https://github.com/your-repo/mozpn-deploy.git
cd mozpn-deploy
npm install
```

### 2. تنظیم UUID
فایل `wrangler.toml` را باز کنید و UUID خود را وارد کنید:
```toml
[vars]
u = "your-uuid-here"
```

### 3. ایجاد KV Namespace
```bash
npx wrangler kv:namespace create "C"
```
سپس ID را در `wrangler.toml` وارد کنید.

### 4. Deploy
```bash
npx wrangler deploy
```

## 📡 API ها

همه API ها از مسیر `/{path}/api/` در دسترس هستند.

### مدیریت کاربران
```
GET    /api/users          - لیست کاربران
GET    /api/users/:uuid    - دریافت کاربر
POST   /api/users          - ایجاد کاربر
PUT    /api/users/:uuid    - ویرایش کاربر
DELETE /api/users/:uuid    - حذف کاربر
POST   /api/users/:uuid/extend     - تمدید اشتراک
POST   /api/users/:uuid/reset-data - ریست حجم
POST   /api/users/:uuid/toggle     - تغییر وضعیت
GET    /api/users/stats    - آمار کاربران
```

### مسیریابی
```
GET  /api/routing/check?address=...  - بررسی مسیریابی
GET  /api/routing/singbox-rules      - قوانین Sing-box
GET  /api/routing/v2ray-rules        - قوانین V2Ray
GET  /api/routing/iran-cidr          - لیست CIDR ایران
GET  /api/routing/iran-domains       - لیست دامنه‌های ایران
GET  /api/routing/geo-sources        - منابع GeoIP/GeoSite
```

### WARP
```
GET  /api/warp/config         - دریافت کانفیگ
POST /api/warp/config         - ذخیره کانفیگ
POST /api/warp/auto-setup     - ⭐ ساخت خودکار اکانت WARP (یک کلیک!)
POST /api/warp/register       - ثبت‌نام دستگاه جدید
POST /api/warp/upgrade        - ارتقا به WARP+ با لایسنس
POST /api/warp/get-free-gb    - 🎁 گرفتن گیگابایت رایگان WARP+
GET  /api/warp/account-info   - اطلاعات اکانت
GET  /api/warp/best-endpoint  - بهترین Endpoint
GET  /api/warp/endpoints      - لیست Endpoint ها
GET  /api/warp/countries      - لیست کشورهای WARP
POST /api/warp/set-country    - تغییر کشور WARP
GET  /api/warp/wireguard-config - دانلود کانفیگ WireGuard
GET  /api/warp/singbox-config - کانفیگ Sing-box
GET  /api/warp/xray-config    - کانفیگ Xray
```

### Fragment
```
GET  /api/fragment/config       - دریافت کانفیگ
POST /api/fragment/config       - ذخیره کانفیگ
GET  /api/fragment/presets      - لیست پیش‌تنظیمات
POST /api/fragment/apply-preset - اعمال پیش‌تنظیم
GET  /api/fragment/singbox-config - کانفیگ Sing-box
GET  /api/fragment/xray-config  - کانفیگ Xray
```

### Failover
```
GET  /api/failover/config       - دریافت کانفیگ
POST /api/failover/config       - ذخیره کانفیگ
GET  /api/failover/endpoints    - لیست Endpoint ها
POST /api/failover/endpoints    - افزودن Endpoint
POST /api/failover/health-check - اجرای Health Check
GET  /api/failover/best-endpoint - بهترین Endpoint
POST /api/failover/switch       - تغییر Endpoint
GET  /api/failover/stats        - آمار
```

### Reality
```
GET  /api/reality/config          - دریافت کانفیگ
POST /api/reality/config          - ذخیره کانفیگ
POST /api/reality/generate-keys   - تولید کلید
GET  /api/reality/generate-short-id - تولید Short ID
GET  /api/reality/fallback-sites  - لیست سایت‌های Fallback
GET  /api/reality/fingerprints    - لیست Fingerprint ها
GET  /api/reality/singbox-config  - کانفیگ Sing-box
GET  /api/reality/xray-config     - کانفیگ Xray
```

### کانفیگ کامل
```
GET /api/singbox-config - کانفیگ کامل Sing-box با routing
GET /api/v2ray-config   - کانفیگ کامل V2Ray با routing
```

## 📱 اشتراک

آدرس اشتراک:
```
https://your-worker.workers.dev/{path}/sub
```

پارامترها:
- `target=base64` - خروجی Base64 (پیش‌فرض)
- `target=plain` - خروجی متنی

## ⚙️ تنظیمات

### متغیرهای محیطی (wrangler.toml)
```toml
[vars]
u = "uuid"           # UUID اصلی
d = "mozpn"          # مسیر سفارشی
p = "proxy.com:443"  # ProxyIP پیش‌فرض
s = "user:pass@host:port"  # SOCKS5
homepage = "https://example.com"  # صفحه اصلی سفارشی
```

### تنظیمات KV
همه تنظیمات در KV ذخیره می‌شوند و از طریق پنل قابل تغییر هستند.

## 🔧 پیش‌تنظیمات Fragment

| نام | توضیح | طول | تاخیر |
|-----|-------|-----|-------|
| iran_mci | همراه اول | 10-20 | 10-15ms |
| iran_irancell | ایرانسل | 50-100 | 20-30ms |
| iran_mokhaberat | مخابرات | 100-200 | 10-20ms |
| china_gfw | چین | 1-3 | 1-3ms |
| aggressive | تهاجمی | 10-50 | 5-10ms |

## 📊 ساختار پروژه

```
MozPN-Deploy/
├── src/
│   ├── worker.js           # نقطه ورود اصلی
│   ├── config/
│   │   ├── constants.js    # ثابت‌ها
│   │   ├── theme.js        # تم
│   │   └── translations.js # ترجمه‌ها
│   ├── handlers/
│   │   ├── config.js       # API تنظیمات
│   │   ├── failover.js     # API Failover
│   │   ├── fragment.js     # API Fragment
│   │   ├── reality.js      # API Reality
│   │   ├── routing.js      # API مسیریابی
│   │   ├── subscription.js # تولید اشتراک
│   │   ├── users.js        # API کاربران
│   │   ├── warp.js         # API WARP
│   │   └── websocket.js    # WebSocket Handler
│   ├── protocols/
│   │   ├── trojan.js       # پروتکل Trojan
│   │   ├── vless.js        # پروتکل VLESS
│   │   └── xhttp.js        # پروتکل XHTTP
│   ├── services/
│   │   ├── failoverManager.js  # مدیریت Failover
│   │   ├── fragmentManager.js  # مدیریت Fragment
│   │   ├── geoRouting.js       # مسیریابی جغرافیایی
│   │   ├── kvStore.js          # مدیریت KV
│   │   ├── realityManager.js   # مدیریت Reality
│   │   ├── userManager.js      # مدیریت کاربران
│   │   └── warpManager.js      # مدیریت WARP
│   ├── ui/
│   │   ├── scripts.js      # اسکریپت‌های کلاینت
│   │   ├── styles.js       # استایل‌ها
│   │   └── template.js     # قالب HTML
│   └── utils/
│       ├── helpers.js      # توابع کمکی
│       └── validators.js   # اعتبارسنجی
├── wrangler.toml           # تنظیمات Wrangler
└── package.json
```

## 🔒 امنیت

- رمز عبور برای پنل مدیریت
- احراز هویت کاربران
- مخفی‌سازی کلیدهای خصوصی در API
- Fallback به سایت‌های معتبر

## 📝 لایسنس

MIT License

## 🤝 مشارکت

Pull Request ها خوش‌آمدند!

---

ساخته شده با ❤️ برای آزادی اینترنت
