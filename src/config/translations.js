// =============================================
// MozPN - ترجمه‌ها (ساده)
// =============================================

export const TRANSLATIONS = {
    fa: {
        // مراحل
        step1Title: 'تنظیمات اولیه',
        step1Desc: 'پروتکل مورد نظر را انتخاب کنید',
        step2Title: 'انتخاب سرورها',
        step2Desc: 'کشورهای مورد نظر را انتخاب کنید',
        step3Title: 'تست سرعت',
        step3Desc: 'بهترین IP ها را پیدا کنید',
        step4Title: 'دریافت لینک',
        step4Desc: 'کلاینت خود را انتخاب کنید',
        
        // عمومی
        fast: 'سریع و امن',
        bypass: 'عبور از فیلتر',
        optional: 'اختیاری',
        count: 'تعداد',
        start: 'شروع تست',
        stop: 'توقف',
        results: 'نتایج',
        use: 'استفاده',
        auto: 'خودکار',
        copy: 'کپی',
        saveAll: 'ذخیره تنظیمات',
        
        // تست سرعت
        testMode: 'نوع تست',
        speedTest: 'تست سرعت',
        pingTest: 'فقط Ping',
        ipCount: 'تعداد IP',
        downloadSize: 'سایز دانلود (MB)',
        topResults: 'نمایش بهترین',
        bestIPs: 'بهترین IP ها'
    },
    
    en: {
        // Steps
        step1Title: 'Initial Settings',
        step1Desc: 'Select your protocol',
        step2Title: 'Select Servers',
        step2Desc: 'Choose your preferred countries',
        step3Title: 'Speed Test',
        step3Desc: 'Find the best IPs',
        step4Title: 'Get Link',
        step4Desc: 'Select your client',
        
        // General
        fast: 'Fast & Secure',
        bypass: 'Bypass Filters',
        optional: 'Optional',
        count: 'Count',
        start: 'Start Test',
        stop: 'Stop',
        results: 'Results',
        use: 'Use',
        auto: 'Auto',
        copy: 'Copy',
        saveAll: 'Save Settings',
        
        // Speed Test
        testMode: 'Test Mode',
        speedTest: 'Speed Test',
        pingTest: 'Ping Only',
        ipCount: 'IP Count',
        downloadSize: 'Download Size (MB)',
        topResults: 'Show Top',
        bestIPs: 'Best IPs'
    }
};

export function getTranslation(lang = 'fa') {
    return TRANSLATIONS[lang] || TRANSLATIONS.fa;
}

export function detectLanguage(request) {
    const cookie = request.headers.get('Cookie') || '';
    if (cookie.includes('lang=en')) return 'en';
    
    const accept = request.headers.get('Accept-Language') || '';
    if (accept.includes('en')) return 'en';
    
    return 'fa';
}
