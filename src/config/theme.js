// =============================================
// MozPN - تم موزی 🍌
// همه رنگ‌ها از اینجا مدیریت میشن
// =============================================

export const THEME = {
    // رنگ‌های اصلی
    primary: '#FFD700',           // زرد موزی اصلی
    primaryDark: '#DAA520',       // زرد تیره‌تر
    primaryDarker: '#B8860B',     // زرد خیلی تیره
    primaryMuted: '#8B7500',      // زرد کم‌رنگ
    
    // پس‌زمینه‌ها
    bgMain: '#0a0a0a',            // پس‌زمینه اصلی
    bgGradientMid: '#1a1400',     // وسط گرادیانت
    bgCard: 'rgba(20, 15, 0, 0.9)',
    bgCardHover: 'rgba(50, 40, 0, 0.6)',
    bgInput: 'rgba(0, 0, 0, 0.8)',
    bgItem: 'rgba(30, 25, 0, 0.6)',
    bgItemSelected: 'rgba(80, 65, 0, 0.4)',
    bgSettings: 'rgba(40, 35, 0, 0.5)',
    bgRandom: 'rgba(50, 45, 30, 0.3)',
    
    // سایه‌ها و گلو
    glowPrimary: 'rgba(255, 215, 0, 0.3)',
    shadowPrimary: '0 0 20px rgba(255, 215, 0, 0.3)',
    shadowHover: '0 0 15px #FFD700',
    textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700',
    textShadowSmall: '0 0 5px #FFD700',
    
    // رنگ‌های خاص
    randomOption: '#F0C040',      // گزینه رندوم
    border: '#4A4000',            // بوردر عادی
    
    // رنگ‌های وضعیت
    danger: '#ff4444',
    warning: '#ff8800',
    success: '#FFD700',           // موفقیت هم زرد موزی
};

// CSS Variables برای استفاده راحت‌تر
export const CSS_VARIABLES = `
:root {
    --moz-primary: ${THEME.primary};
    --moz-primary-dark: ${THEME.primaryDark};
    --moz-primary-darker: ${THEME.primaryDarker};
    --moz-primary-muted: ${THEME.primaryMuted};
    --moz-bg-main: ${THEME.bgMain};
    --moz-bg-card: ${THEME.bgCard};
    --moz-bg-input: ${THEME.bgInput};
    --moz-glow: ${THEME.glowPrimary};
    --moz-danger: ${THEME.danger};
    --moz-warning: ${THEME.warning};
}
`;
