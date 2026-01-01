// =============================================
// MozPN - اسکریپت‌های کامل UI
// =============================================

export const CLIENT_SCRIPTS = `
// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupServers();
    
    // بارگذاری تب فعلی از URL
    const hash = window.location.hash.replace('#', '');
    if (hash) switchTab(hash);
});

// ===== Tab Navigation =====
function switchTab(tabId) {
    // مخفی کردن همه تب‌ها
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    // نمایش تب انتخابی
    const tab = document.getElementById('tab-' + tabId);
    const btn = document.querySelector('.nav-tab[data-tab="' + tabId + '"]');
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
    
    // آپدیت URL
    window.location.hash = tabId;
    
    // بارگذاری داده‌های تب
    if (tabId === 'dashboard') loadDashboard();
    else if (tabId === 'warp') loadWarpConfig();
    else if (tabId === 'fragment') loadFragmentConfig();
    else if (tabId === 'failover') loadFailoverConfig();
    else if (tabId === 'reality') loadRealityConfig();
    else if (tabId === 'backup') loadBackupSummary();
}

// ===== Settings =====
function loadSettings() {
    fetch(window.location.pathname + '/api/config')
        .then(r => r.json())
        .then(cfg => {
            document.getElementById('vlessOn').checked = cfg.ev !== 'no';
            document.getElementById('trojanOn').checked = cfg.et === 'yes';
            
            // بارگذاری تنظیمات نام‌گذاری
            if (document.getElementById('nodeNameFormat')) {
                document.getElementById('nodeNameFormat').value = cfg.nodeNameFormat || 'country-user';
                toggleCustomFormat();
            }
            if (document.getElementById('customNodeFormat')) {
                document.getElementById('customNodeFormat').value = cfg.customNodeFormat || '';
            }
            if (document.getElementById('remarkPrefix')) {
                document.getElementById('remarkPrefix').value = cfg.remarkPrefix || '';
            }
            if (document.getElementById('remarkSeparator')) {
                document.getElementById('remarkSeparator').value = cfg.remarkSeparator || ' | ';
            }
            if (document.getElementById('indexStart')) {
                document.getElementById('indexStart').value = cfg.indexStart || '1';
            }
            if (document.getElementById('indexPadding')) {
                document.getElementById('indexPadding').value = cfg.indexPadding || '2';
            }
            
            // نوع شماره‌گذاری
            const indexType = cfg.indexPerProtocol === 'yes' ? 'protocol' : 
                              (cfg.indexPerCountry === 'yes' ? 'country' : 'global');
            const radio = document.querySelector('input[name="indexType"][value="' + indexType + '"]');
            if (radio) radio.checked = true;
            
            // آپدیت پیش‌نمایش
            updateNamingPreview();
            
            if (cfg.selectedCountries) {
                try {
                    const servers = JSON.parse(cfg.selectedCountries);
                    document.querySelectorAll('.server-item input').forEach(cb => {
                        cb.checked = false;
                        cb.closest('.server-item').classList.remove('active');
                    });
                    servers.forEach(s => {
                        const cb = document.querySelector('.server-item input[data-code="' + s.code + '"]');
                        if (cb) {
                            cb.checked = true;
                            cb.closest('.server-item').classList.add('active');
                        }
                    });
                } catch(e) {}
            }
        }).catch(() => {});
}

function setupServers() {
    document.querySelectorAll('.server-item').forEach(item => {
        item.addEventListener('click', () => {
            const cb = item.querySelector('input');
            cb.checked = !cb.checked;
            item.classList.toggle('active', cb.checked);
        });
    });
    
    // Event listeners برای تنظیمات نام‌گذاری
    const namingInputs = ['nodeNameFormat', 'customNodeFormat', 'remarkPrefix', 'remarkSeparator', 'indexStart', 'indexPadding'];
    namingInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateNamingPreview);
        if (el) el.addEventListener('input', updateNamingPreview);
    });
    
    document.querySelectorAll('input[name="indexType"]').forEach(radio => {
        radio.addEventListener('change', updateNamingPreview);
    });
}

// ===== توابع نام‌گذاری =====
function toggleCustomFormat() {
    const format = document.getElementById('nodeNameFormat')?.value;
    const customGroup = document.getElementById('customFormatGroup');
    if (customGroup) {
        customGroup.style.display = format === 'custom' ? 'block' : 'none';
    }
    updateNamingPreview();
}

function updateNamingPreview() {
    const format = document.getElementById('nodeNameFormat')?.value || 'country-user';
    const customFormat = document.getElementById('customNodeFormat')?.value || '';
    const prefix = document.getElementById('remarkPrefix')?.value || 'MozPN';
    const separator = document.getElementById('remarkSeparator')?.value || ' | ';
    const indexStart = parseInt(document.getElementById('indexStart')?.value || '1');
    const indexPadding = parseInt(document.getElementById('indexPadding')?.value || '2');
    
    // نمونه کشورها
    const samples = [
        { emoji: '🇩🇪', country: 'Germany', code: 'DE' },
        { emoji: '🇳🇱', country: 'Netherlands', code: 'NL' }
    ];
    
    const previewEl = document.getElementById('namingPreview');
    if (!previewEl) return;
    
    const names = samples.map((s, i) => {
        const idx = indexStart + i;
        const indexFormatted = String(idx).padStart(indexPadding, '0');
        
        if (format === 'custom' && customFormat) {
            return customFormat
                .replace(/\\{emoji\\}/g, s.emoji)
                .replace(/\\{country\\}/g, s.country)
                .replace(/\\{user\\}/g, prefix)
                .replace(/\\{remark\\}/g, '')
                .replace(/\\{ip\\}/g, '1.2.3.4')
                .replace(/\\{port\\}/g, '443')
                .replace(/\\{index\\}/g, indexFormatted)
                .replace(/\\{num\\}/g, String(idx))
                .replace(/\\{protocol\\}/g, 'VLESS')
                .trim();
        }
        
        switch (format) {
            case 'country-user':
                return s.emoji + ' ' + s.country + separator + prefix;
            case 'user-country':
                return prefix + separator + s.emoji + ' ' + s.country;
            case 'country-only':
                return s.emoji + ' ' + s.country;
            case 'user-only':
                return prefix;
            case 'indexed':
                return prefix + separator + s.emoji + ' ' + s.country + ' #' + indexFormatted;
            case 'protocol-indexed':
                return prefix + separator + 'VLESS' + separator + s.emoji + ' ' + s.country + ' #' + indexFormatted;
            default:
                return s.emoji + ' ' + s.country + separator + prefix;
        }
    });
    
    previewEl.innerHTML = names.map(n => '<span class="preview-name-item">' + n + '</span>').join('');
}

function saveAll() {
    const servers = [];
    const ipCount = parseInt(document.getElementById('ipCountSelect')?.value || '3');
    
    document.querySelectorAll('.server-item input:checked').forEach(cb => {
        servers.push({ code: cb.dataset.code, ipCount: ipCount, proxyUrl: '' });
    });
    
    // تنظیمات نام‌گذاری
    const indexType = document.querySelector('input[name="indexType"]:checked')?.value || 'country';
    
    const cfg = {
        ev: document.getElementById('vlessOn').checked ? 'yes' : 'no',
        et: document.getElementById('trojanOn').checked ? 'yes' : 'no',
        selectedCountries: JSON.stringify(servers),
        // تنظیمات نام‌گذاری
        nodeNameFormat: document.getElementById('nodeNameFormat')?.value || 'country-user',
        customNodeFormat: document.getElementById('customNodeFormat')?.value || '',
        remarkPrefix: document.getElementById('remarkPrefix')?.value || 'MozPN',
        remarkSeparator: document.getElementById('remarkSeparator')?.value || ' | ',
        indexStart: document.getElementById('indexStart')?.value || '1',
        indexPadding: document.getElementById('indexPadding')?.value || '2',
        indexPerCountry: indexType === 'country' ? 'yes' : 'no',
        indexPerProtocol: indexType === 'protocol' ? 'yes' : 'no'
    };
    
    fetch(window.location.pathname + '/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
    })
    .then(() => toast('✅ ذخیره شد', 'success'))
    .catch(() => toast('❌ خطا', 'error'));
}

// ===== Dashboard =====
function loadDashboard() {
    refreshDashboard();
    loadUsersList();
}

function refreshDashboard() {
    fetch(window.location.pathname + '/api/users/stats')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.stats) {
                const s = data.stats;
                document.getElementById('statTotalUsers').textContent = s.total || 0;
                document.getElementById('statActiveUsers').textContent = s.active || 0;
                document.getElementById('statExpiredUsers').textContent = s.expired || 0;
                document.getElementById('statTotalData').textContent = s.totalDataUsedFormatted || '0 B';
                
                // چارت
                const total = s.total || 1;
                document.getElementById('chartActive').style.width = ((s.active / total) * 100) + '%';
                document.getElementById('chartActiveVal').textContent = s.active || 0;
                document.getElementById('chartDisabled').style.width = ((s.disabled / total) * 100) + '%';
                document.getElementById('chartDisabledVal').textContent = s.disabled || 0;
                document.getElementById('chartExpired').style.width = ((s.expired / total) * 100) + '%';
                document.getElementById('chartExpiredVal').textContent = s.expired || 0;
            }
        }).catch(() => {});
}

function loadUsersList() {
    fetch(window.location.pathname + '/api/users')
        .then(r => r.json())
        .then(data => {
            const tbody = document.getElementById('usersTableBody');
            if (!data.success || !data.users || data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--dim)">کاربری یافت نشد</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.users.map(u => \`
                <tr>
                    <td>\${u.name || '-'}</td>
                    <td class="user-uuid">\${u.uuid.substring(0, 8)}...</td>
                    <td><span class="status-badge \${u.active ? 'active' : 'inactive'}">\${u.active ? '✓' : '✕'}</span></td>
                    <td>\${formatBytes(u.dataUsed || 0)}</td>
                    <td>\${u.connectionCount || 0}</td>
                </tr>
            \`).join('');
        }).catch(() => {});
}

// ===== WARP =====
function loadWarpConfig() {
    fetch(window.location.pathname + '/api/warp/config')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.config) {
                const c = data.config;
                document.getElementById('warpEnabled').checked = c.enabled;
                document.getElementById('warpMode').value = c.mode || 'proxy';
                document.getElementById('warpEndpoint').value = c.endpoint || '';
                document.getElementById('warpCountry').value = c.country || 'AUTO';
                updateWarpStatus(c.enabled);
                
                if (c.accountId) {
                    document.getElementById('warpAccountInfo').style.display = 'flex';
                    document.getElementById('warpAccountText').textContent = '✅ اکانت: ' + c.accountId.substring(0, 8) + '...';
                }
            }
        }).catch(() => {});
}

function toggleWarp() {
    const enabled = document.getElementById('warpEnabled').checked;
    updateWarpStatus(enabled);
}

function updateWarpStatus(enabled) {
    const badge = document.getElementById('warpStatus');
    badge.textContent = enabled ? 'فعال' : 'غیرفعال';
    badge.className = 'status-badge ' + (enabled ? 'active' : 'inactive');
}

function warpAutoSetup() {
    toast('⏳ در حال ساخت اکانت...', '');
    fetch(window.location.pathname + '/api/warp/auto-setup', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                toast('✅ ' + data.message, 'success');
                loadWarpConfig();
            } else {
                toast('❌ ' + (data.error || 'خطا'), 'error');
            }
        }).catch(() => toast('❌ خطا در اتصال', 'error'));
}

function warpGetFreeGB() {
    toast('⏳ در حال گرفتن GB رایگان...', '');
    fetch(window.location.pathname + '/api/warp/get-free-gb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast('🎉 ' + data.message, 'success');
        } else {
            toast('❌ ' + (data.error || 'خطا'), 'error');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

function warpUpgrade() {
    const license = document.getElementById('warpLicense').value.trim();
    if (!license) {
        toast('❌ لایسنس را وارد کنید', 'error');
        return;
    }
    
    fetch(window.location.pathname + '/api/warp/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast('🎉 ' + data.message, 'success');
        } else {
            toast('❌ ' + (data.error || 'خطا'), 'error');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

function saveWarpConfig() {
    const cfg = {
        enabled: document.getElementById('warpEnabled').checked,
        mode: document.getElementById('warpMode').value,
        endpoint: document.getElementById('warpEndpoint').value,
        country: document.getElementById('warpCountry').value
    };
    
    fetch(window.location.pathname + '/api/warp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) toast('✅ ذخیره شد', 'success');
        else toast('❌ ' + (data.error || 'خطا'), 'error');
    }).catch(() => toast('❌ خطا', 'error'));
}


// ===== Fragment =====
function loadFragmentConfig() {
    fetch(window.location.pathname + '/api/fragment/config')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.config) {
                const c = data.config;
                document.getElementById('fragmentEnabled').checked = c.enabled;
                document.getElementById('fragmentLength').value = c.length || '';
                document.getElementById('fragmentInterval').value = c.interval || '';
                document.getElementById('fragmentMode').value = c.mode || 'tlshello';
                updateFragmentStatus(c.enabled);
            }
        }).catch(() => {});
}

function toggleFragment() {
    const enabled = document.getElementById('fragmentEnabled').checked;
    updateFragmentStatus(enabled);
}

function updateFragmentStatus(enabled) {
    const badge = document.getElementById('fragmentStatus');
    badge.textContent = enabled ? 'فعال' : 'غیرفعال';
    badge.className = 'status-badge ' + (enabled ? 'active' : 'inactive');
}

function applyFragmentPreset(preset) {
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
    document.querySelector('.preset-card[data-preset="' + preset + '"]')?.classList.add('active');
    
    fetch(window.location.pathname + '/api/fragment/apply-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.config) {
            document.getElementById('fragmentLength').value = data.config.length || '';
            document.getElementById('fragmentInterval').value = data.config.interval || '';
            document.getElementById('fragmentMode').value = data.config.mode || 'tlshello';
            document.getElementById('fragmentEnabled').checked = data.config.enabled;
            updateFragmentStatus(data.config.enabled);
            toast('✅ پیش‌تنظیم اعمال شد', 'success');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

function saveFragmentConfig() {
    const cfg = {
        enabled: document.getElementById('fragmentEnabled').checked,
        length: document.getElementById('fragmentLength').value,
        interval: document.getElementById('fragmentInterval').value,
        mode: document.getElementById('fragmentMode').value
    };
    
    fetch(window.location.pathname + '/api/fragment/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) toast('✅ ذخیره شد', 'success');
        else toast('❌ ' + (data.error || 'خطا'), 'error');
    }).catch(() => toast('❌ خطا', 'error'));
}

function testFragment() {
    fetch(window.location.pathname + '/api/fragment/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'Test data for fragmentation' })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast('✅ تست موفق - ' + data.fragmentCount + ' تکه', 'success');
        } else {
            toast('❌ ' + (data.error || 'خطا'), 'error');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

// ===== Failover =====
function loadFailoverConfig() {
    fetch(window.location.pathname + '/api/failover/config')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.config) {
                const c = data.config;
                document.getElementById('failoverEnabled').checked = c.enabled;
                document.getElementById('failoverInterval').value = c.checkInterval || 30;
                document.getElementById('failoverTimeout').value = c.timeout || 5000;
                updateFailoverStatus(c.enabled);
            }
        }).catch(() => {});
    
    loadEndpoints();
}

function toggleFailover() {
    const enabled = document.getElementById('failoverEnabled').checked;
    updateFailoverStatus(enabled);
}

function updateFailoverStatus(enabled) {
    const badge = document.getElementById('failoverStatus');
    badge.textContent = enabled ? 'فعال' : 'غیرفعال';
    badge.className = 'status-badge ' + (enabled ? 'active' : 'inactive');
}

function loadEndpoints() {
    fetch(window.location.pathname + '/api/failover/endpoints')
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('endpointList');
            if (!data.success || !data.endpoints || data.endpoints.length === 0) {
                list.innerHTML = '<div class="endpoint-item" style="justify-content:center;color:var(--dim)">هیچ Endpoint تعریف نشده</div>';
                return;
            }
            
            list.innerHTML = data.endpoints.map((e, i) => \`
                <div class="endpoint-item">
                    <span class="endpoint-status \${e.healthy ? 'healthy' : 'unhealthy'}"></span>
                    <div class="endpoint-info">
                        <div class="endpoint-name">\${e.name || 'Server ' + (i+1)}</div>
                        <div class="endpoint-address">\${e.address}:\${e.port || 443}</div>
                    </div>
                    \${e.latency ? '<span class="endpoint-latency">' + e.latency + 'ms</span>' : ''}
                    <div class="endpoint-actions">
                        <button class="btn-icon danger" onclick="removeEndpoint(\${i})" title="حذف">🗑️</button>
                    </div>
                </div>
            \`).join('');
        }).catch(() => {});
}

function showAddEndpoint() {
    document.getElementById('addEndpointForm').style.display = 'block';
}

function hideAddEndpoint() {
    document.getElementById('addEndpointForm').style.display = 'none';
}

function addEndpoint() {
    const address = document.getElementById('newEndpointAddress').value.trim();
    const port = parseInt(document.getElementById('newEndpointPort').value) || 443;
    const name = document.getElementById('newEndpointName').value.trim();
    
    if (!address) {
        toast('❌ آدرس را وارد کنید', 'error');
        return;
    }
    
    fetch(window.location.pathname + '/api/failover/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, port, name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast('✅ اضافه شد', 'success');
            hideAddEndpoint();
            loadEndpoints();
            document.getElementById('newEndpointAddress').value = '';
            document.getElementById('newEndpointName').value = '';
        } else {
            toast('❌ ' + (data.error || 'خطا'), 'error');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

function removeEndpoint(index) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    
    fetch(window.location.pathname + '/api/failover/remove-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast('✅ حذف شد', 'success');
            loadEndpoints();
        } else {
            toast('❌ ' + (data.error || 'خطا'), 'error');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

function runHealthCheck() {
    toast('⏳ در حال چک سلامت...', '');
    fetch(window.location.pathname + '/api/failover/health-check', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                toast('✅ ' + data.summary.healthy + '/' + data.summary.total + ' سالم', 'success');
                loadEndpoints();
            } else {
                toast('❌ ' + (data.error || 'خطا'), 'error');
            }
        }).catch(() => toast('❌ خطا', 'error'));
}

function saveFailoverConfig() {
    const cfg = {
        enabled: document.getElementById('failoverEnabled').checked,
        checkInterval: parseInt(document.getElementById('failoverInterval').value) || 30,
        timeout: parseInt(document.getElementById('failoverTimeout').value) || 5000
    };
    
    fetch(window.location.pathname + '/api/failover/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) toast('✅ ذخیره شد', 'success');
        else toast('❌ ' + (data.error || 'خطا'), 'error');
    }).catch(() => toast('❌ خطا', 'error'));
}


// ===== Reality =====
function loadRealityConfig() {
    fetch(window.location.pathname + '/api/reality/config')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.config) {
                const c = data.config;
                document.getElementById('realityEnabled').checked = c.enabled;
                document.getElementById('realityFallback').value = c.fallbackSite || '';
                document.getElementById('realityFingerprint').value = c.fingerprint || 'chrome';
                document.getElementById('realityShortId').value = c.shortId || '';
                document.getElementById('realitySpiderX').value = c.spiderX || '/';
                updateRealityStatus(c.enabled);
                
                if (c.publicKey) {
                    document.getElementById('realityKeysInfo').style.display = 'flex';
                    document.getElementById('realityPublicKey').textContent = c.publicKey;
                }
            }
        }).catch(() => {});
}

function toggleReality() {
    const enabled = document.getElementById('realityEnabled').checked;
    updateRealityStatus(enabled);
}

function updateRealityStatus(enabled) {
    const badge = document.getElementById('realityStatus');
    badge.textContent = enabled ? 'فعال' : 'غیرفعال';
    badge.className = 'status-badge ' + (enabled ? 'active' : 'inactive');
}

function getRandomFallback() {
    fetch(window.location.pathname + '/api/reality/random-site')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.site) {
                document.getElementById('realityFallback').value = data.site;
                toast('✅ سایت انتخاب شد', 'success');
            }
        }).catch(() => toast('❌ خطا', 'error'));
}

function generateShortId() {
    fetch(window.location.pathname + '/api/reality/generate-short-id')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.shortId) {
                document.getElementById('realityShortId').value = data.shortId;
            }
        }).catch(() => {});
}

function generateRealityKeys() {
    toast('⏳ در حال تولید کلید...', '');
    fetch(window.location.pathname + '/api/reality/generate-keys', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                toast('✅ کلیدها تولید شدند', 'success');
                document.getElementById('realityKeysInfo').style.display = 'flex';
                document.getElementById('realityPublicKey').textContent = data.publicKey;
            } else {
                toast('❌ ' + (data.error || 'خطا'), 'error');
            }
        }).catch(() => toast('❌ خطا', 'error'));
}

function validateFallbackSite() {
    const domain = document.getElementById('realityFallback').value.trim();
    if (!domain) {
        toast('❌ دامنه را وارد کنید', 'error');
        return;
    }
    
    toast('⏳ در حال تست...', '');
    fetch(window.location.pathname + '/api/reality/validate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.result && data.result.valid) {
            toast('✅ سایت معتبر است', 'success');
        } else {
            toast('❌ سایت نامعتبر یا غیرقابل دسترس', 'error');
        }
    }).catch(() => toast('❌ خطا', 'error'));
}

function copyRealityKey() {
    const key = document.getElementById('realityPublicKey').textContent;
    copyToClipboard(key);
    toast('📋 کپی شد', 'success');
}

function saveRealityConfig() {
    const cfg = {
        enabled: document.getElementById('realityEnabled').checked,
        fallbackSite: document.getElementById('realityFallback').value,
        fingerprint: document.getElementById('realityFingerprint').value,
        shortId: document.getElementById('realityShortId').value,
        spiderX: document.getElementById('realitySpiderX').value
    };
    
    fetch(window.location.pathname + '/api/reality/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) toast('✅ ذخیره شد', 'success');
        else toast('❌ ' + (data.error || 'خطا'), 'error');
    }).catch(() => toast('❌ خطا', 'error'));
}

// ===== Get Link =====
function getLink(client) {
    document.querySelectorAll('.client-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.client-btn[data-client="' + client + '"]')?.classList.add('active');
    
    const base = window.location.origin + window.location.pathname;
    const sub = base + '/sub';
    let url = sub;
    
    if (client === 'clash') {
        url = 'https://url.v1.mk/sub?target=clash&url=' + encodeURIComponent(sub);
    }
    
    document.getElementById('linkInput').value = url;
    document.getElementById('linkBox').style.display = 'block';
    
    copyToClipboard(url);
    toast('✅ لینک کپی شد!', 'success');
}

// ===== Preview Subscription =====
function showPreview() {
    const previewBox = document.getElementById('previewBox');
    const previewContent = document.getElementById('previewContent');
    
    previewContent.innerHTML = '<div style="text-align:center;padding:20px;">⏳ در حال بارگذاری...</div>';
    previewBox.style.display = 'block';
    
    fetch(window.location.pathname + '/preview?format=json')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                previewContent.innerHTML = renderPreview(data);
            } else {
                previewContent.innerHTML = '<div style="color:var(--red)">❌ خطا در دریافت پیش‌نمایش</div>';
            }
        })
        .catch(() => {
            previewContent.innerHTML = '<div style="color:var(--red)">❌ خطا در اتصال</div>';
        });
}

function hidePreview() {
    document.getElementById('previewBox').style.display = 'none';
}

function renderPreview(data) {
    const s = data.summary;
    const sim = s.simulation;
    
    let html = '<div class="preview-section">';
    
    // تنظیمات
    html += '<div class="preview-header">⚙️ تنظیمات فعلی</div>';
    html += '<div class="preview-grid">';
    html += '<div class="preview-item"><span class="preview-label">پروتکل‌ها:</span>';
    html += '<span class="preview-value">';
    if (s.settings.protocols.vless) html += '<span class="tag">VLESS</span>';
    if (s.settings.protocols.trojan) html += '<span class="tag">Trojan</span>';
    if (s.settings.protocols.xhttp) html += '<span class="tag">XHTTP</span>';
    html += '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">حالت رندوم:</span>';
    html += '<span class="preview-value">' + (s.settings.options.randomMode ? '✅ فعال (' + s.settings.options.totalIPCount + ' نود)' : '❌ غیرفعال') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">پیشوند نام:</span>';
    html += '<span class="preview-value">' + s.settings.options.remarkPrefix + '</span></div>';
    html += '</div>';
    
    // کشورها
    html += '<div class="preview-header">🌍 کشورهای انتخاب‌شده</div>';
    if (s.sources.countries.length === 0) {
        html += '<div class="preview-empty">⚠️ هیچ کشوری انتخاب نشده (از پیش‌فرض استفاده می‌شود)</div>';
    } else {
        html += '<div class="preview-countries">';
        for (const c of s.sources.countries) {
            html += '<div class="preview-country">';
            html += '<span class="country-emoji">' + c.emoji + '</span>';
            html += '<span class="country-name">' + c.name + '</span>';
            html += '<span class="country-count">' + c.requestedCount + ' نود</span>';
            html += '<span class="country-source">' + (c.sources.join(', ') || 'پیش‌فرض') + '</span>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // جمع‌بندی
    html += '<div class="preview-header">📊 جمع‌بندی</div>';
    html += '<div class="preview-summary">';
    html += '<div class="summary-item"><span class="summary-num">' + s.totals.totalNodes + '</span><span class="summary-label">نود</span></div>';
    html += '<div class="summary-item"><span class="summary-num">' + s.totals.totalConfigs + '</span><span class="summary-label">کانفیگ</span></div>';
    html += '</div>';
    
    // شبیه‌سازی نودها
    html += '<div class="preview-header">🎯 شبیه‌سازی نودها</div>';
    if (sim.isRandom) {
        html += '<div class="preview-warning">⚠️ حالت رندوم فعال - نمایش ' + s.settings.options.totalIPCount + ' نود از ' + sim.originalCount + '</div>';
    }
    
    html += '<div class="preview-nodes">';
    const nodesToShow = sim.isRandom && sim.randomSample.length > 0 ? sim.randomSample : sim.nodes;
    
    // گروه‌بندی
    const groups = {};
    for (const n of nodesToShow) {
        const type = n.type;
        if (!groups[type]) groups[type] = [];
        groups[type].push(n);
    }
    
    const typeLabels = {
        'worker': '🔧 Worker',
        'country_proxy': '🌍 کشورها (ProxyIP)',
        'country_custom': '🌍 کشورها (URL سفارشی)',
        'custom': '🔧 پروکسی سفارشی',
        'clean_domain': '🧹 دامنه‌های مستقیم',
        'clean_wetest': '📡 Wetest IPs',
        'clean_github': '🐙 GitHub IPs',
        'warp': '🌐 WARP'
    };
    
    for (const [type, nodes] of Object.entries(groups)) {
        html += '<div class="node-group">';
        html += '<div class="node-group-title">' + (typeLabels[type] || type) + ' (' + nodes.length + ')</div>';
        for (const n of nodes.slice(0, 10)) {
            html += '<div class="node-item">';
            html += '<span class="node-name">' + n.name + '</span>';
            html += '<span class="node-ip">' + n.ip + ':' + n.port + '</span>';
            if (n.source) html += '<span class="node-source">[' + n.source + ']</span>';
            html += '</div>';
        }
        if (nodes.length > 10) {
            html += '<div class="node-more">... و ' + (nodes.length - 10) + ' نود دیگر</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

function showTextPreview() {
    fetch(window.location.pathname + '/preview?format=text')
        .then(r => r.text())
        .then(text => {
            const previewContent = document.getElementById('previewContent');
            previewContent.innerHTML = '<pre class="preview-text">' + text + '</pre>';
        })
        .catch(() => toast('❌ خطا', 'error'));
}

function copyLink() {
    const url = document.getElementById('linkInput').value;
    copyToClipboard(url);
    toast('📋 کپی شد');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

function toggleQR() {
    const box = document.getElementById('qrBox');
    const url = document.getElementById('linkInput').value;
    
    if (box.style.display === 'none') {
        const canvas = document.getElementById('qrCanvas');
        try {
            const qr = qrcode(0, 'M');
            qr.addData(url);
            qr.make();
            
            const ctx = canvas.getContext('2d');
            const size = 180;
            const count = qr.getModuleCount();
            const cell = size / count;
            
            canvas.width = size;
            canvas.height = size;
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, size, size);
            
            ctx.fillStyle = '#000';
            for (let r = 0; r < count; r++) {
                for (let c = 0; c < count; c++) {
                    if (qr.isDark(r, c)) {
                        ctx.fillRect(c * cell, r * cell, cell, cell);
                    }
                }
            }
        } catch(e) {}
        
        box.style.display = 'block';
    } else {
        box.style.display = 'none';
    }
}

// ===== Utils =====
function toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show ' + type;
    setTimeout(() => el.classList.remove('show'), 3000);
}

function changeLang(lang) {
    localStorage.setItem('lang', lang);
    document.cookie = 'preferredLanguage=' + lang + '; path=/; max-age=31536000';
    location.reload();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== Global =====
window.switchTab = switchTab;
window.saveAll = saveAll;
window.getLink = getLink;
window.copyLink = copyLink;
window.toggleQR = toggleQR;
window.changeLang = changeLang;
window.refreshDashboard = refreshDashboard;
window.toggleWarp = toggleWarp;
window.warpAutoSetup = warpAutoSetup;
window.warpGetFreeGB = warpGetFreeGB;
window.warpUpgrade = warpUpgrade;
window.saveWarpConfig = saveWarpConfig;
window.toggleFragment = toggleFragment;
window.applyFragmentPreset = applyFragmentPreset;
window.saveFragmentConfig = saveFragmentConfig;
window.testFragment = testFragment;
window.toggleFailover = toggleFailover;
window.loadEndpoints = loadEndpoints;
window.showAddEndpoint = showAddEndpoint;
window.hideAddEndpoint = hideAddEndpoint;
window.addEndpoint = addEndpoint;
window.removeEndpoint = removeEndpoint;
window.runHealthCheck = runHealthCheck;
window.saveFailoverConfig = saveFailoverConfig;
window.toggleReality = toggleReality;
window.getRandomFallback = getRandomFallback;
window.generateShortId = generateShortId;
window.generateRealityKeys = generateRealityKeys;
window.validateFallbackSite = validateFallbackSite;
window.copyRealityKey = copyRealityKey;
window.saveRealityConfig = saveRealityConfig;
window.showPreview = showPreview;
window.hidePreview = hidePreview;
window.showTextPreview = showTextPreview;

// ===== Backup =====
let pendingBackupData = null;

function loadBackupSummary() {
    const summaryDiv = document.getElementById('backupSummary');
    summaryDiv.innerHTML = '<div class="summary-loading">⏳ در حال بارگذاری...</div>';
    
    fetch(window.location.pathname + '/api/backup/summary')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.summary) {
                summaryDiv.innerHTML = renderBackupSummary(data.summary);
            } else {
                summaryDiv.innerHTML = '<div class="summary-error">❌ خطا در دریافت اطلاعات</div>';
            }
        })
        .catch(() => {
            summaryDiv.innerHTML = '<div class="summary-error">❌ خطا در اتصال</div>';
        });
}

function renderBackupSummary(s) {
    let html = '<div class="summary-grid">';
    
    // آمار
    html += '<div class="summary-card"><span class="summary-icon">⚙️</span><span class="summary-value">' + s.stats.configKeysCount + '</span><span class="summary-label">تنظیم</span></div>';
    html += '<div class="summary-card"><span class="summary-icon">🌍</span><span class="summary-value">' + s.stats.countriesCount + '</span><span class="summary-label">کشور</span></div>';
    html += '<div class="summary-card"><span class="summary-icon">🔧</span><span class="summary-value">' + s.stats.customProxiesCount + '</span><span class="summary-label">پروکسی</span></div>';
    html += '<div class="summary-card"><span class="summary-icon">👥</span><span class="summary-value">' + s.stats.usersCount + '</span><span class="summary-label">کاربر</span></div>';
    html += '</div>';
    
    // پروتکل‌ها
    html += '<div class="summary-section"><span class="section-title">پروتکل‌ها:</span>';
    html += '<span class="feature-badge ' + (s.protocols.vless ? 'active' : '') + '">VLESS</span>';
    html += '<span class="feature-badge ' + (s.protocols.trojan ? 'active' : '') + '">Trojan</span>';
    html += '<span class="feature-badge ' + (s.protocols.xhttp ? 'active' : '') + '">XHTTP</span>';
    html += '</div>';
    
    // قابلیت‌ها
    html += '<div class="summary-section"><span class="section-title">قابلیت‌ها:</span>';
    html += '<span class="feature-badge ' + (s.features.warp ? 'active' : '') + '">WARP</span>';
    html += '<span class="feature-badge ' + (s.features.fragment ? 'active' : '') + '">Fragment</span>';
    html += '<span class="feature-badge ' + (s.features.failover ? 'active' : '') + '">Failover</span>';
    html += '<span class="feature-badge ' + (s.features.reality ? 'active' : '') + '">Reality</span>';
    html += '<span class="feature-badge ' + (s.features.randomMode ? 'active' : '') + '">Random</span>';
    html += '</div>';
    
    // تنظیمات نمایش
    html += '<div class="summary-section"><span class="section-title">نام‌گذاری:</span>';
    html += '<span class="summary-text">پیشوند: <strong>' + s.display.remarkPrefix + '</strong></span>';
    html += '</div>';
    
    return html;
}

function exportBackup() {
    const includeUsers = document.getElementById('exportUsers').checked;
    const includeWarp = document.getElementById('exportWarp').checked;
    const includeSensitive = document.getElementById('exportSensitive').checked;
    
    let url = window.location.pathname + '/api/backup/export?';
    if (!includeUsers) url += 'users=no&';
    if (!includeWarp) url += 'warp=no&';
    if (includeSensitive) url += 'sensitive=yes&';
    
    toast('⏳ در حال آماده‌سازی بکاپ...', '');
    
    // دانلود مستقیم
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mozpn-backup-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast('✅ بکاپ دانلود شد', 'success');
}

function previewBackupFile() {
    const fileInput = document.getElementById('backupFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    document.getElementById('selectedFileName').textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            pendingBackupData = data;
            
            // ارسال برای پیش‌نمایش
            fetch(window.location.pathname + '/api/backup/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(r => r.json())
            .then(preview => {
                if (preview.success) {
                    showBackupPreview(preview);
                } else {
                    toast('❌ ' + (preview.error || 'فایل نامعتبر'), 'error');
                    pendingBackupData = null;
                }
            })
            .catch(() => {
                toast('❌ خطا در بررسی فایل', 'error');
                pendingBackupData = null;
            });
            
        } catch (err) {
            toast('❌ فایل JSON نامعتبر است', 'error');
            pendingBackupData = null;
        }
    };
    reader.readAsText(file);
}

function showBackupPreview(preview) {
    const previewDiv = document.getElementById('backupPreview');
    const contentDiv = document.getElementById('backupPreviewContent');
    const optionsDiv = document.getElementById('importOptions');
    
    let html = '<div class="backup-info">';
    html += '<div class="info-row"><span>نسخه:</span><strong>' + preview.version + '</strong></div>';
    html += '<div class="info-row"><span>تاریخ:</span><strong>' + new Date(preview.exportedAt).toLocaleString('fa-IR') + '</strong></div>';
    html += '</div>';
    
    // آمار
    html += '<div class="backup-stats">';
    html += '<span class="stat-item">⚙️ ' + preview.stats.configKeys + ' تنظیم</span>';
    html += '<span class="stat-item">🌍 ' + preview.stats.countriesCount + ' کشور</span>';
    html += '<span class="stat-item">🔧 ' + preview.stats.customProxiesCount + ' پروکسی</span>';
    html += '<span class="stat-item">👥 ' + preview.stats.usersCount + ' کاربر</span>';
    html += '</div>';
    
    // محتویات
    html += '<div class="backup-contents">';
    html += '<span class="content-title">محتویات:</span>';
    const contents = preview.contents;
    if (contents.hasConfig) html += '<span class="content-badge">✅ تنظیمات</span>';
    if (contents.hasCountries) html += '<span class="content-badge">✅ کشورها</span>';
    if (contents.hasCustomProxies) html += '<span class="content-badge">✅ پروکسی‌ها</span>';
    if (contents.hasWarp) html += '<span class="content-badge">✅ WARP</span>';
    if (contents.hasFragment) html += '<span class="content-badge">✅ Fragment</span>';
    if (contents.hasFailover) html += '<span class="content-badge">✅ Failover</span>';
    if (contents.hasReality) html += '<span class="content-badge">✅ Reality</span>';
    if (contents.hasUsers) html += '<span class="content-badge">✅ کاربران</span>';
    html += '</div>';
    
    // هشدارها
    if (preview.warnings && preview.warnings.length > 0) {
        html += '<div class="backup-warnings">';
        for (const w of preview.warnings) {
            html += '<div class="warning-item">' + w + '</div>';
        }
        html += '</div>';
    }
    
    // کشورها
    if (preview.countries && preview.countries.length > 0) {
        html += '<div class="backup-countries">';
        html += '<span class="content-title">کشورها:</span>';
        for (const c of preview.countries) {
            html += '<span class="country-badge">' + c.emoji + ' ' + c.name + ' (' + c.ipCount + ')</span>';
        }
        html += '</div>';
    }
    
    html += '</div>';
    
    contentDiv.innerHTML = html;
    previewDiv.style.display = 'block';
    optionsDiv.style.display = 'block';
}

function importBackup() {
    if (!pendingBackupData) {
        toast('❌ ابتدا فایل بکاپ را انتخاب کنید', 'error');
        return;
    }
    
    if (!confirm('⚠️ آیا مطمئن هستید؟ این عملیات تنظیمات فعلی را جایگزین می‌کند.')) {
        return;
    }
    
    const options = {
        importConfig: document.getElementById('importConfig').checked,
        importCountries: document.getElementById('importCountries').checked,
        importProxies: document.getElementById('importProxies').checked,
        importWarp: document.getElementById('importWarpSettings').checked,
        importFragment: document.getElementById('importFragment').checked,
        importFailover: document.getElementById('importFailover').checked,
        importReality: document.getElementById('importReality').checked,
        importUsers: document.getElementById('importUsersData').checked,
        mergeMode: document.getElementById('importMode').value,
        confirmed: true
    };
    
    toast('⏳ در حال وارد کردن...', '');
    
    fetch(window.location.pathname + '/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            backup: pendingBackupData,
            options: options
        })
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            toast('✅ ' + result.message, 'success');
            cancelImport();
            loadBackupSummary();
            // ریلود صفحه بعد از 2 ثانیه
            setTimeout(() => location.reload(), 2000);
        } else {
            toast('❌ ' + (result.error || 'خطا در وارد کردن'), 'error');
            if (result.errors) {
                console.error('Import errors:', result.errors);
            }
        }
    })
    .catch(() => toast('❌ خطا در اتصال', 'error'));
}

function cancelImport() {
    pendingBackupData = null;
    document.getElementById('backupFile').value = '';
    document.getElementById('selectedFileName').textContent = '';
    document.getElementById('backupPreview').style.display = 'none';
    document.getElementById('importOptions').style.display = 'none';
}

function confirmReset() {
    if (!confirm('⚠️ آیا مطمئن هستید؟ تمام تنظیمات حذف خواهند شد!')) {
        return;
    }
    
    if (!confirm('⚠️ این عملیات قابل بازگشت نیست! آیا بکاپ گرفته‌اید؟')) {
        return;
    }
    
    toast('⏳ در حال بازنشانی...', '');
    
    fetch(window.location.pathname + '/api/backup/reset', {
        method: 'POST'
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            toast('✅ ' + result.message, 'success');
            setTimeout(() => location.reload(), 2000);
        } else {
            toast('❌ ' + (result.error || 'خطا'), 'error');
        }
    })
    .catch(() => toast('❌ خطا در اتصال', 'error'));
}

// بارگذاری خلاصه بکاپ وقتی تب باز میشه
window.loadBackupSummary = loadBackupSummary;
window.exportBackup = exportBackup;
window.previewBackupFile = previewBackupFile;
window.importBackup = importBackup;
window.cancelImport = cancelImport;
window.confirmReset = confirmReset;
`;
