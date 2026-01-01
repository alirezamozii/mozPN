// =============================================
// MozPN - توابع اعتبارسنجی
// =============================================

/**
 * اعتبارسنجی فرمت UUID
 */
export function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * اعتبارسنجی آدرس IPv4
 */
export function isValidIPv4(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
}

/**
 * اعتبارسنجی آدرس IPv6
 */
export function isValidIPv6(ip) {
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;
    
    const ipv6ShortRegex = /^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    return ipv6ShortRegex.test(ip);
}

/**
 * اعتبارسنجی IP (هر دو نوع)
 */
export function isValidIP(ip) {
    return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * اعتبارسنجی دامنه
 */
export function isValidDomain(domain) {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

/**
 * اعتبارسنجی پورت
 */
export function isValidPort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

/**
 * اعتبارسنجی URL
 */
export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * پارس کردن آدرس و پورت
 */
export function parseAddressAndPort(input) {
    // IPv6 با براکت
    if (input.includes('[') && input.includes(']')) {
        const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
        if (match) {
            return {
                address: match[1],
                port: match[2] ? parseInt(match[2], 10) : null
            };
        }
    }
    
    // IPv4 یا دامنه با پورت
    const lastColonIndex = input.lastIndexOf(':');
    if (lastColonIndex > 0) {
        const address = input.substring(0, lastColonIndex);
        const portStr = input.substring(lastColonIndex + 1);
        const port = parseInt(portStr, 10);
        
        if (isValidPort(port)) {
            return { address, port };
        }
    }
    
    return { address: input, port: null };
}

/**
 * پارس کردن تنظیمات SOCKS5
 */
export function parseSocksConfig(config) {
    if (!config || !config.trim()) {
        return null;
    }
    
    // فرمت: user:pass@host:port یا host:port
    const atIndex = config.lastIndexOf('@');
    let auth = null;
    let hostPort = config;
    
    if (atIndex > 0) {
        const authPart = config.substring(0, atIndex);
        hostPort = config.substring(atIndex + 1);
        
        const colonIndex = authPart.indexOf(':');
        if (colonIndex > 0) {
            auth = {
                username: authPart.substring(0, colonIndex),
                password: authPart.substring(colonIndex + 1)
            };
        }
    }
    
    const { address, port } = parseAddressAndPort(hostPort);
    
    if (!address || !port) {
        throw new Error('فرمت SOCKS نامعتبر');
    }
    
    return {
        host: address,
        port: port,
        auth: auth
    };
}
