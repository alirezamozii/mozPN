// =============================================
// MozPN v2.0 - API مدیریت کاربران
// =============================================

import {
    createUser,
    getUser,
    saveUser,
    deleteUser,
    getAllUsers,
    extendSubscription,
    resetDataUsage,
    toggleUserStatus,
    getUsersStats,
    formatBytes,
    formatTimeRemaining
} from '../services/userManager.js';
import { jsonResponse } from '../utils/helpers.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * API مدیریت کاربران
 */
export async function handleUsersAPI(request, kvStore) {
    if (!kvStore) {
        return jsonResponse({
            error: 'KV فعال نیست',
            message: 'برای مدیریت کاربران باید KV را فعال کنید'
        }, 503);
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    
    // GET /api/users - لیست کاربران
    if (request.method === 'GET' && pathParts[pathParts.length - 1] === 'users') {
        return await handleGetUsers(kvStore);
    }
    
    // GET /api/users/stats - آمار کاربران
    if (request.method === 'GET' && pathParts.includes('stats')) {
        return await handleGetStats(kvStore);
    }
    
    // GET /api/users/:uuid - دریافت کاربر
    if (request.method === 'GET' && pathParts.length >= 3) {
        const uuid = pathParts[pathParts.length - 1];
        if (isValidUUID(uuid)) {
            return await handleGetUser(kvStore, uuid);
        }
    }
    
    // POST /api/users - ایجاد کاربر
    if (request.method === 'POST' && pathParts[pathParts.length - 1] === 'users') {
        return await handleCreateUser(request, kvStore);
    }
    
    // PUT /api/users/:uuid - به‌روزرسانی کاربر
    if (request.method === 'PUT') {
        const uuid = pathParts[pathParts.length - 1];
        if (isValidUUID(uuid)) {
            return await handleUpdateUser(request, kvStore, uuid);
        }
    }
    
    // DELETE /api/users/:uuid - حذف کاربر
    if (request.method === 'DELETE') {
        const uuid = pathParts[pathParts.length - 1];
        if (isValidUUID(uuid)) {
            return await handleDeleteUser(kvStore, uuid);
        }
    }
    
    // POST /api/users/:uuid/extend - تمدید اشتراک
    if (request.method === 'POST' && pathParts.includes('extend')) {
        const uuidIndex = pathParts.indexOf('extend') - 1;
        const uuid = pathParts[uuidIndex];
        if (isValidUUID(uuid)) {
            return await handleExtendSubscription(request, kvStore, uuid);
        }
    }
    
    // POST /api/users/:uuid/reset-data - ریست حجم
    if (request.method === 'POST' && pathParts.includes('reset-data')) {
        const uuidIndex = pathParts.indexOf('reset-data') - 1;
        const uuid = pathParts[uuidIndex];
        if (isValidUUID(uuid)) {
            return await handleResetData(kvStore, uuid);
        }
    }
    
    // POST /api/users/:uuid/toggle - تغییر وضعیت
    if (request.method === 'POST' && pathParts.includes('toggle')) {
        const uuidIndex = pathParts.indexOf('toggle') - 1;
        const uuid = pathParts[uuidIndex];
        if (isValidUUID(uuid)) {
            return await handleToggleStatus(kvStore, uuid);
        }
    }
    
    return jsonResponse({ error: 'مسیر یافت نشد' }, 404);
}

/**
 * دریافت لیست کاربران
 */
async function handleGetUsers(kvStore) {
    try {
        const users = await getAllUsers(kvStore);
        
        // فرمت کردن اطلاعات
        const formattedUsers = users.map(user => ({
            ...user,
            dataUsedFormatted: formatBytes(user.dataUsed),
            dataLimitFormatted: user.dataLimit > 0 ? formatBytes(user.dataLimit) : 'نامحدود',
            timeRemaining: formatTimeRemaining(user.expiresAt),
            isExpired: user.expiresAt > 0 && user.expiresAt < Date.now(),
            isDataExceeded: user.dataLimit > 0 && user.dataUsed >= user.dataLimit
        }));
        
        return jsonResponse({
            success: true,
            count: formattedUsers.length,
            users: formattedUsers
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * دریافت آمار کاربران
 */
async function handleGetStats(kvStore) {
    try {
        const stats = await getUsersStats(kvStore);
        
        return jsonResponse({
            success: true,
            stats: {
                ...stats,
                totalDataUsedFormatted: formatBytes(stats.totalDataUsed)
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * دریافت یک کاربر
 */
async function handleGetUser(kvStore, uuid) {
    try {
        const user = await getUser(kvStore, uuid);
        
        if (!user) {
            return jsonResponse({
                success: false,
                error: 'کاربر یافت نشد'
            }, 404);
        }
        
        return jsonResponse({
            success: true,
            user: {
                ...user,
                dataUsedFormatted: formatBytes(user.dataUsed),
                dataLimitFormatted: user.dataLimit > 0 ? formatBytes(user.dataLimit) : 'نامحدود',
                timeRemaining: formatTimeRemaining(user.expiresAt),
                isExpired: user.expiresAt > 0 && user.expiresAt < Date.now(),
                isDataExceeded: user.dataLimit > 0 && user.dataUsed >= user.dataLimit
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * ایجاد کاربر جدید
 */
async function handleCreateUser(request, kvStore) {
    try {
        const data = await request.json();
        
        // اعتبارسنجی UUID
        if (!data.uuid || !isValidUUID(data.uuid)) {
            return jsonResponse({
                success: false,
                error: 'UUID نامعتبر است'
            }, 400);
        }
        
        // بررسی تکراری نبودن
        const existing = await getUser(kvStore, data.uuid);
        if (existing) {
            return jsonResponse({
                success: false,
                error: 'این UUID قبلاً ثبت شده است'
            }, 409);
        }
        
        // محاسبه تاریخ انقضا
        let expiresAt = 0;
        if (data.days && data.days > 0) {
            expiresAt = Date.now() + (data.days * 24 * 60 * 60 * 1000);
        } else if (data.expiresAt) {
            expiresAt = data.expiresAt;
        }
        
        // محاسبه حجم
        let dataLimit = 0;
        if (data.dataLimitGB && data.dataLimitGB > 0) {
            dataLimit = data.dataLimitGB * 1024 * 1024 * 1024;
        } else if (data.dataLimit) {
            dataLimit = data.dataLimit;
        }
        
        const user = createUser(data.uuid, {
            name: data.name,
            expiresAt,
            dataLimit,
            note: data.note
        });
        
        await saveUser(kvStore, user);
        
        return jsonResponse({
            success: true,
            message: 'کاربر ایجاد شد',
            user: {
                ...user,
                dataLimitFormatted: dataLimit > 0 ? formatBytes(dataLimit) : 'نامحدود',
                timeRemaining: formatTimeRemaining(expiresAt)
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * به‌روزرسانی کاربر
 */
async function handleUpdateUser(request, kvStore, uuid) {
    try {
        const data = await request.json();
        const user = await getUser(kvStore, uuid);
        
        if (!user) {
            return jsonResponse({
                success: false,
                error: 'کاربر یافت نشد'
            }, 404);
        }
        
        // به‌روزرسانی فیلدها
        if (data.name !== undefined) user.name = data.name;
        if (data.note !== undefined) user.note = data.note;
        if (data.active !== undefined) user.active = data.active;
        
        // به‌روزرسانی انقضا
        if (data.days !== undefined) {
            if (data.days === 0) {
                user.expiresAt = 0;
            } else {
                user.expiresAt = Date.now() + (data.days * 24 * 60 * 60 * 1000);
            }
        } else if (data.expiresAt !== undefined) {
            user.expiresAt = data.expiresAt;
        }
        
        // به‌روزرسانی حجم
        if (data.dataLimitGB !== undefined) {
            if (data.dataLimitGB === 0) {
                user.dataLimit = 0;
            } else {
                user.dataLimit = data.dataLimitGB * 1024 * 1024 * 1024;
            }
        } else if (data.dataLimit !== undefined) {
            user.dataLimit = data.dataLimit;
        }
        
        await saveUser(kvStore, user);
        
        return jsonResponse({
            success: true,
            message: 'کاربر به‌روزرسانی شد',
            user: {
                ...user,
                dataUsedFormatted: formatBytes(user.dataUsed),
                dataLimitFormatted: user.dataLimit > 0 ? formatBytes(user.dataLimit) : 'نامحدود',
                timeRemaining: formatTimeRemaining(user.expiresAt)
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * حذف کاربر
 */
async function handleDeleteUser(kvStore, uuid) {
    try {
        const user = await getUser(kvStore, uuid);
        
        if (!user) {
            return jsonResponse({
                success: false,
                error: 'کاربر یافت نشد'
            }, 404);
        }
        
        await deleteUser(kvStore, uuid);
        
        return jsonResponse({
            success: true,
            message: 'کاربر حذف شد'
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تمدید اشتراک
 */
async function handleExtendSubscription(request, kvStore, uuid) {
    try {
        const data = await request.json();
        
        if (!data.days || data.days <= 0) {
            return jsonResponse({
                success: false,
                error: 'تعداد روز نامعتبر است'
            }, 400);
        }
        
        const user = await extendSubscription(kvStore, uuid, data.days);
        
        return jsonResponse({
            success: true,
            message: `اشتراک ${data.days} روز تمدید شد`,
            user: {
                ...user,
                timeRemaining: formatTimeRemaining(user.expiresAt)
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * ریست حجم مصرفی
 */
async function handleResetData(kvStore, uuid) {
    try {
        const user = await resetDataUsage(kvStore, uuid);
        
        return jsonResponse({
            success: true,
            message: 'حجم مصرفی ریست شد',
            user: {
                ...user,
                dataUsedFormatted: formatBytes(user.dataUsed)
            }
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تغییر وضعیت فعال/غیرفعال
 */
async function handleToggleStatus(kvStore, uuid) {
    try {
        const user = await toggleUserStatus(kvStore, uuid);
        
        return jsonResponse({
            success: true,
            message: user.active ? 'کاربر فعال شد' : 'کاربر غیرفعال شد',
            user
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * تولید UUID جدید
 */
export function generateNewUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
