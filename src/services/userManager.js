// =============================================
// MozPN v2.0 - سیستم مدیریت کاربران
// مدیریت اشتراک، انقضا و حجم مصرفی
// =============================================

import { getConfigValue, setConfigValue } from './kvStore.js';

// ثابت‌ها
const USER_PREFIX = 'user:';
const USERS_LIST_KEY = 'users_list';

/**
 * ساختار کاربر
 * @typedef {Object} User
 * @property {string} uuid - شناسه یکتا
 * @property {string} name - نام کاربر
 * @property {number} createdAt - تاریخ ایجاد (timestamp)
 * @property {number} expiresAt - تاریخ انقضا (timestamp) - 0 یعنی بدون انقضا
 * @property {number} dataLimit - محدودیت حجم (بایت) - 0 یعنی نامحدود
 * @property {number} dataUsed - حجم مصرف شده (بایت)
 * @property {boolean} active - وضعیت فعال/غیرفعال
 * @property {string} note - یادداشت
 * @property {number} lastConnection - آخرین اتصال (timestamp)
 * @property {number} connectionCount - تعداد اتصالات
 */

/**
 * ایجاد کاربر جدید
 */
export function createUser(uuid, options = {}) {
    const now = Date.now();
    
    return {
        uuid: uuid.toLowerCase(),
        name: options.name || `User-${uuid.substring(0, 8)}`,
        createdAt: now,
        expiresAt: options.expiresAt || 0, // 0 = بدون انقضا
        dataLimit: options.dataLimit || 0, // 0 = نامحدود
        dataUsed: 0,
        active: true,
        note: options.note || '',
        lastConnection: 0,
        connectionCount: 0
    };
}

/**
 * دریافت کاربر از KV
 */
export async function getUser(kvStore, uuid) {
    if (!kvStore || !uuid) return null;
    
    try {
        const key = USER_PREFIX + uuid.toLowerCase();
        const data = await kvStore.get(key);
        
        if (!data) return null;
        
        return JSON.parse(data);
    } catch (error) {
        console.error('خطا در دریافت کاربر:', error);
        return null;
    }
}

/**
 * ذخیره کاربر در KV
 */
export async function saveUser(kvStore, user) {
    if (!kvStore || !user || !user.uuid) {
        throw new Error('پارامترهای نامعتبر');
    }
    
    try {
        const key = USER_PREFIX + user.uuid.toLowerCase();
        await kvStore.put(key, JSON.stringify(user));
        
        // به‌روزرسانی لیست کاربران
        await addToUsersList(kvStore, user.uuid);
        
        return true;
    } catch (error) {
        console.error('خطا در ذخیره کاربر:', error);
        throw error;
    }
}

/**
 * حذف کاربر
 */
export async function deleteUser(kvStore, uuid) {
    if (!kvStore || !uuid) return false;
    
    try {
        const key = USER_PREFIX + uuid.toLowerCase();
        await kvStore.delete(key);
        
        // حذف از لیست
        await removeFromUsersList(kvStore, uuid);
        
        return true;
    } catch (error) {
        console.error('خطا در حذف کاربر:', error);
        return false;
    }
}

/**
 * دریافت لیست همه کاربران
 */
export async function getAllUsers(kvStore) {
    if (!kvStore) return [];
    
    try {
        const listData = await kvStore.get(USERS_LIST_KEY);
        if (!listData) return [];
        
        const uuids = JSON.parse(listData);
        const users = [];
        
        for (const uuid of uuids) {
            const user = await getUser(kvStore, uuid);
            if (user) {
                users.push(user);
            }
        }
        
        return users;
    } catch (error) {
        console.error('خطا در دریافت لیست کاربران:', error);
        return [];
    }
}

/**
 * افزودن به لیست کاربران
 */
async function addToUsersList(kvStore, uuid) {
    try {
        const listData = await kvStore.get(USERS_LIST_KEY);
        let uuids = listData ? JSON.parse(listData) : [];
        
        const normalizedUuid = uuid.toLowerCase();
        if (!uuids.includes(normalizedUuid)) {
            uuids.push(normalizedUuid);
            await kvStore.put(USERS_LIST_KEY, JSON.stringify(uuids));
        }
    } catch (error) {
        console.error('خطا در افزودن به لیست:', error);
    }
}

/**
 * حذف از لیست کاربران
 */
async function removeFromUsersList(kvStore, uuid) {
    try {
        const listData = await kvStore.get(USERS_LIST_KEY);
        if (!listData) return;
        
        let uuids = JSON.parse(listData);
        const normalizedUuid = uuid.toLowerCase();
        uuids = uuids.filter(u => u !== normalizedUuid);
        
        await kvStore.put(USERS_LIST_KEY, JSON.stringify(uuids));
    } catch (error) {
        console.error('خطا در حذف از لیست:', error);
    }
}

/**
 * بررسی اعتبار کاربر (انقضا + حجم + فعال بودن)
 * @returns {Object} { valid: boolean, reason: string }
 */
export function checkUserValidity(user) {
    if (!user) {
        return { valid: false, reason: 'USER_NOT_FOUND' };
    }
    
    // بررسی فعال بودن
    if (!user.active) {
        return { valid: false, reason: 'USER_DISABLED' };
    }
    
    // بررسی انقضا
    if (user.expiresAt > 0 && Date.now() > user.expiresAt) {
        return { valid: false, reason: 'SUBSCRIPTION_EXPIRED' };
    }
    
    // بررسی حجم
    if (user.dataLimit > 0 && user.dataUsed >= user.dataLimit) {
        return { valid: false, reason: 'DATA_LIMIT_EXCEEDED' };
    }
    
    return { valid: true, reason: 'OK' };
}

/**
 * احراز هویت کاربر در زمان اتصال
 */
export async function authenticateUser(kvStore, uuid, enableUserManagement = false) {
    // اگر مدیریت کاربران غیرفعال باشد، همه مجازند
    if (!enableUserManagement) {
        return { valid: true, reason: 'USER_MANAGEMENT_DISABLED' };
    }
    
    const user = await getUser(kvStore, uuid);
    return checkUserValidity(user);
}

/**
 * به‌روزرسانی آمار اتصال کاربر
 */
export async function updateUserConnection(kvStore, uuid, bytesUsed = 0) {
    if (!kvStore || !uuid) return;
    
    try {
        const user = await getUser(kvStore, uuid);
        if (!user) return;
        
        user.lastConnection = Date.now();
        user.connectionCount += 1;
        user.dataUsed += bytesUsed;
        
        await saveUser(kvStore, user);
    } catch (error) {
        console.error('خطا در به‌روزرسانی آمار:', error);
    }
}

/**
 * تمدید اشتراک کاربر
 */
export async function extendSubscription(kvStore, uuid, days) {
    if (!kvStore || !uuid || !days) {
        throw new Error('پارامترهای نامعتبر');
    }
    
    const user = await getUser(kvStore, uuid);
    if (!user) {
        throw new Error('کاربر یافت نشد');
    }
    
    const msToAdd = days * 24 * 60 * 60 * 1000;
    
    // اگر منقضی شده، از الان شروع کن
    if (user.expiresAt > 0 && user.expiresAt < Date.now()) {
        user.expiresAt = Date.now() + msToAdd;
    } else if (user.expiresAt > 0) {
        // اگر هنوز فعال است، به انتها اضافه کن
        user.expiresAt += msToAdd;
    } else {
        // اگر بدون انقضا بود، از الان شروع کن
        user.expiresAt = Date.now() + msToAdd;
    }
    
    await saveUser(kvStore, user);
    return user;
}

/**
 * ریست حجم مصرفی
 */
export async function resetDataUsage(kvStore, uuid) {
    if (!kvStore || !uuid) {
        throw new Error('پارامترهای نامعتبر');
    }
    
    const user = await getUser(kvStore, uuid);
    if (!user) {
        throw new Error('کاربر یافت نشد');
    }
    
    user.dataUsed = 0;
    await saveUser(kvStore, user);
    return user;
}

/**
 * تغییر وضعیت فعال/غیرفعال
 */
export async function toggleUserStatus(kvStore, uuid, active = null) {
    if (!kvStore || !uuid) {
        throw new Error('پارامترهای نامعتبر');
    }
    
    const user = await getUser(kvStore, uuid);
    if (!user) {
        throw new Error('کاربر یافت نشد');
    }
    
    user.active = active !== null ? active : !user.active;
    await saveUser(kvStore, user);
    return user;
}

/**
 * فرمت کردن حجم به واحد خوانا
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * فرمت کردن زمان باقی‌مانده
 */
export function formatTimeRemaining(expiresAt) {
    if (!expiresAt || expiresAt === 0) {
        return 'نامحدود';
    }
    
    const now = Date.now();
    if (expiresAt < now) {
        return 'منقضی شده';
    }
    
    const diff = expiresAt - now;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
        return `${days} روز و ${hours} ساعت`;
    }
    return `${hours} ساعت`;
}

/**
 * دریافت آمار کلی کاربران
 */
export async function getUsersStats(kvStore) {
    const users = await getAllUsers(kvStore);
    
    const stats = {
        total: users.length,
        active: 0,
        expired: 0,
        disabled: 0,
        dataLimitExceeded: 0,
        totalDataUsed: 0,
        totalConnections: 0
    };
    
    const now = Date.now();
    
    for (const user of users) {
        stats.totalDataUsed += user.dataUsed || 0;
        stats.totalConnections += user.connectionCount || 0;
        
        if (!user.active) {
            stats.disabled++;
        } else if (user.expiresAt > 0 && user.expiresAt < now) {
            stats.expired++;
        } else if (user.dataLimit > 0 && user.dataUsed >= user.dataLimit) {
            stats.dataLimitExceeded++;
        } else {
            stats.active++;
        }
    }
    
    return stats;
}
