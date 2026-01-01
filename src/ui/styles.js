// =============================================
// MozPN - استایل با ترتیب مراحل
// =============================================

export const CSS_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
    --gold: #FFD700;
    --gold-dim: #B8860B;
    --bg: #0a0a0a;
    --card: #141414;
    --border: #2a2a2a;
    --text: #fff;
    --dim: #888;
    --green: #4ade80;
    --red: #f87171;
    --blue: #60a5fa;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.5;
}

/* Header */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(10px);
    z-index: 100;
}

.logo {
    font-size: 1.4rem;
    font-weight: bold;
    color: var(--gold);
}

.header-actions select {
    padding: 8px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 6px;
    cursor: pointer;
}

/* Main */
.main {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 16px;
}

/* Steps */
.step {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    margin-bottom: 20px;
    overflow: hidden;
}

.step-final {
    border-color: var(--gold);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.08);
}

.step-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
}

.step-optional .step-header {
    cursor: pointer;
    transition: background 0.2s;
}

.step-optional .step-header:hover {
    background: rgba(255, 255, 255, 0.02);
}

.step-num {
    width: 34px;
    height: 34px;
    min-width: 34px;
    background: var(--gold);
    color: #000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.95rem;
}

.step-info { flex: 1; }

.step-info h2 {
    font-size: 1.05rem;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.step-info p,
.step-hint {
    font-size: 0.85rem;
    color: var(--dim);
    line-height: 1.5;
}

.badge {
    font-size: 0.65rem;
    padding: 3px 8px;
    background: var(--border);
    border-radius: 10px;
    color: var(--dim);
    font-weight: normal;
}

.step-toggle {
    color: var(--dim);
    transition: transform 0.3s;
    margin-top: 5px;
}

.step-content {
    padding: 20px;
}

.step-content.collapsed {
    display: none;
}

/* Info Boxes */
.info-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(255, 215, 0, 0.05);
    border: 1px solid rgba(255, 215, 0, 0.15);
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 0.85rem;
    color: var(--dim);
}

.info-box-small {
    padding: 10px 14px;
    font-size: 0.8rem;
}

.info-box-success {
    background: rgba(74, 222, 128, 0.08);
    border-color: rgba(74, 222, 128, 0.2);
}

.info-icon {
    font-size: 1.1rem;
}

/* Options */
.option-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
}

.option-card {
    display: block;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 18px 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.option-card:hover {
    border-color: var(--dim);
}

.option-card:has(input:checked) {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.05);
}

.option-card input { display: none; }

.option-icon { font-size: 1.8rem; display: block; margin-bottom: 8px; }
.option-name { font-weight: 600; display: block; margin-bottom: 4px; }
.option-desc { font-size: 0.75rem; color: var(--dim); }

/* Server Sections */
.server-section {
    margin-bottom: 20px;
}

.server-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 0.85rem;
    color: var(--dim);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
}

.server-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
    gap: 8px;
}

.server-grid-small {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
}

.server-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.server-item:hover {
    border-color: var(--dim);
    transform: translateY(-1px);
}

.server-item.active,
.server-item:has(input:checked) {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.05);
}

.server-item input { display: none; }

.server-flag { font-size: 1.6rem; margin-bottom: 4px; }
.server-name { font-size: 0.75rem; text-align: center; }

/* IP Count Row */
.ip-count-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
}

.ip-count-row label {
    font-size: 0.85rem;
    color: var(--dim);
}

.ip-count-row select {
    padding: 8px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    cursor: pointer;
}

.ip-count-row .hint {
    font-size: 0.75rem;
    color: var(--dim);
}

/* Test */
.test-options {
    margin-bottom: 15px;
}

.test-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 12px;
    flex-wrap: wrap;
}

.test-input {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1;
    min-width: 100px;
}

.test-input label {
    font-size: 0.8rem;
    color: var(--dim);
}

.test-input input,
.test-input select {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
}

.test-input select {
    cursor: pointer;
}

.test-actions {
    display: flex;
    gap: 10px;
    margin-top: 5px;
}

.btn-danger {
    background: var(--red) !important;
    border-color: var(--red) !important;
    color: #000 !important;
}

.btn-danger:hover {
    background: #dc2626 !important;
}

.progress {
    text-align: center;
    margin: 15px 0;
}

.progress-bar {
    height: 6px;
    background: var(--bg);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar > div {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-dim));
    width: 0%;
    transition: width 0.3s;
}

.results {
    background: var(--bg);
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
}

.results-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid var(--border);
    color: var(--gold);
    font-weight: 500;
    font-size: 0.9rem;
}

#resultsList {
    max-height: 280px;
    overflow-y: auto;
}

.result-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
}

.result-row:last-child { border-bottom: none; }

.result-row input { accent-color: var(--gold); }
.result-row .rank { 
    color: var(--gold); 
    font-weight: bold; 
    min-width: 28px;
}
.result-row .ip { flex: 1; font-family: monospace; font-size: 0.8rem; }
.result-row .ms { color: var(--dim); font-size: 0.8rem; }
.result-row .speed { color: var(--green); font-weight: 600; font-size: 0.8rem; }
.result-row .colo { color: var(--dim); font-size: 0.75rem; }

/* Clients */
.client-section {
    margin-bottom: 20px;
}

.client-label {
    font-size: 0.85rem;
    color: var(--dim);
    margin-bottom: 12px;
}

.client-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 10px;
}

.client-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 10px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
}

.client-btn:hover {
    border-color: var(--gold);
    transform: translateY(-2px);
}

.client-btn.active {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.08);
}

.client-icon { font-size: 1.4rem; }
.client-name { font-weight: 600; font-size: 0.9rem; }
.client-platform { font-size: 0.7rem; color: var(--dim); }

/* Link Box */
.link-box {
    background: var(--bg);
    border: 1px solid var(--gold);
    border-radius: 12px;
    padding: 16px;
}

.link-label {
    font-size: 0.85rem;
    color: var(--gold);
    margin-bottom: 10px;
}

.link-input-wrap {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.link-input-wrap input {
    flex: 1;
    padding: 12px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--gold);
    font-family: monospace;
    font-size: 0.8rem;
}

.btn-copy {
    padding: 12px 14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
}

.btn-copy:hover {
    background: var(--border);
}

.link-actions {
    display: flex;
    gap: 10px;
}

.qr {
    margin-top: 16px;
    text-align: center;
    background: #fff;
    padding: 16px;
    border-radius: 10px;
}

.qr-hint {
    margin-top: 8px;
    font-size: 0.75rem;
    color: #666;
}

/* Usage Guide */
.usage-guide {
    margin-top: 20px;
    padding: 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
}

.guide-title {
    font-size: 0.9rem;
    color: var(--gold);
    margin-bottom: 12px;
}

.guide-steps {
    padding-right: 20px;
    font-size: 0.85rem;
    color: var(--dim);
}

.guide-steps li {
    margin-bottom: 8px;
}

/* Buttons */
.btn {
    padding: 11px 18px;
    background: var(--card);
    border: 2px solid var(--gold);
    border-radius: 8px;
    color: var(--gold);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
}

.btn:hover {
    background: rgba(255, 215, 0, 0.1);
}

.btn-primary {
    background: var(--gold);
    color: #000;
}

.btn-primary:hover {
    background: var(--gold-dim);
}

.btn-outline {
    background: transparent;
}

.btn-large {
    padding: 14px 28px;
    font-size: 1rem;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 0.8rem;
    background: transparent;
    border: 1px solid var(--gold);
    border-radius: 6px;
    color: var(--gold);
    cursor: pointer;
}

.btn-success {
    background: var(--green);
    border-color: var(--green);
    color: #000;
}

/* Save Bar */
.save-bar {
    text-align: center;
    padding: 24px 0 20px;
}

.save-hint {
    margin-top: 10px;
    font-size: 0.8rem;
    color: var(--dim);
}

/* Footer */
.footer {
    text-align: center;
    padding: 20px;
    border-top: 1px solid var(--border);
    color: var(--dim);
    font-size: 0.8rem;
    display: flex;
    justify-content: center;
    gap: 10px;
}

/* Toast */
.toast {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: var(--card);
    border: 1px solid var(--gold);
    padding: 12px 24px;
    border-radius: 8px;
    color: var(--gold);
    z-index: 1000;
    transition: transform 0.3s;
    font-size: 0.9rem;
}

.toast.show { transform: translateX(-50%) translateY(0); }
.toast.error { border-color: var(--red); color: var(--red); }
.toast.success { border-color: var(--green); color: var(--green); }

/* Scrollbar */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: var(--bg);
}

::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--dim);
}

/* Navigation Tabs */
.nav-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
    background: var(--card);
}

.nav-tab {
    padding: 10px 18px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--dim);
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}

.nav-tab:hover {
    border-color: var(--gold);
    color: var(--text);
}

.nav-tab.active {
    background: var(--gold);
    border-color: var(--gold);
    color: #000;
    font-weight: 600;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Dashboard Stats */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.stat-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
}

.stat-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--gold);
    margin-bottom: 4px;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--dim);
}

.stat-card.success .stat-value { color: var(--green); }
.stat-card.danger .stat-value { color: var(--red); }
.stat-card.info .stat-value { color: var(--blue); }

/* Settings Panel */
.settings-panel {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
}

.settings-header h3 {
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-toggle {
    color: var(--dim);
    transition: transform 0.3s;
}

.settings-body {
    padding: 16px;
}

.settings-body.collapsed {
    display: none;
}

/* Form Elements */
.form-group {
    margin-bottom: 16px;
}

.form-group:last-child {
    margin-bottom: 0;
}

.form-label {
    display: block;
    font-size: 0.85rem;
    color: var(--dim);
    margin-bottom: 6px;
}

.form-input,
.form-select {
    width: 100%;
    padding: 10px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 0.9rem;
}

.form-select {
    cursor: pointer;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--gold);
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
}

.form-hint {
    font-size: 0.75rem;
    color: var(--dim);
    margin-top: 4px;
}

/* Toggle Switch */
.toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
}

.toggle-row:last-child {
    border-bottom: none;
}

.toggle-info {
    flex: 1;
}

.toggle-title {
    font-size: 0.9rem;
    margin-bottom: 2px;
}

.toggle-desc {
    font-size: 0.75rem;
    color: var(--dim);
}

.toggle-switch {
    position: relative;
    width: 48px;
    height: 26px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--border);
    border-radius: 26px;
    transition: 0.3s;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background: var(--text);
    border-radius: 50%;
    transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
    background: var(--gold);
}

.toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
    background: #000;
}

/* Endpoint List */
.endpoint-list {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
}

.endpoint-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
}

.endpoint-item:last-child {
    border-bottom: none;
}

.endpoint-status {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--dim);
}

.endpoint-status.healthy {
    background: var(--green);
}

.endpoint-status.unhealthy {
    background: var(--red);
}

.endpoint-info {
    flex: 1;
}

.endpoint-name {
    font-size: 0.9rem;
    margin-bottom: 2px;
}

.endpoint-address {
    font-size: 0.75rem;
    color: var(--dim);
    font-family: monospace;
}

.endpoint-latency {
    font-size: 0.8rem;
    color: var(--green);
}

.endpoint-actions {
    display: flex;
    gap: 6px;
}

.btn-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.btn-icon:hover {
    border-color: var(--gold);
}

.btn-icon.danger:hover {
    border-color: var(--red);
    color: var(--red);
}

/* Preset Cards */
.preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
}

.preset-card {
    padding: 14px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.preset-card:hover {
    border-color: var(--dim);
}

.preset-card.active {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.05);
}

.preset-name {
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 4px;
}

.preset-desc {
    font-size: 0.7rem;
    color: var(--dim);
}

/* Action Buttons Row */
.action-row {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    flex-wrap: wrap;
}

/* Status Badge */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-badge.active {
    background: rgba(74, 222, 128, 0.15);
    color: var(--green);
}

.status-badge.inactive {
    background: rgba(248, 113, 113, 0.15);
    color: var(--red);
}

/* Users Table */
.users-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}

.users-table th,
.users-table td {
    padding: 12px 10px;
    text-align: right;
    border-bottom: 1px solid var(--border);
}

.users-table th {
    color: var(--dim);
    font-weight: 500;
    font-size: 0.8rem;
}

.users-table tr:hover {
    background: rgba(255, 255, 255, 0.02);
}

.users-table .user-uuid {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--gold);
}

/* Chart Container */
.chart-container {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}

.chart-title {
    font-size: 0.9rem;
    color: var(--dim);
    margin-bottom: 12px;
}

.chart-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.chart-label {
    width: 80px;
    font-size: 0.8rem;
    color: var(--dim);
}

.chart-track {
    flex: 1;
    height: 20px;
    background: var(--card);
    border-radius: 4px;
    overflow: hidden;
}

.chart-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-dim));
    border-radius: 4px;
    transition: width 0.5s;
}

.chart-value {
    width: 60px;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 600;
}

/* Responsive */
@media (max-width: 600px) {
    .header { padding: 12px 16px; }
    .main { padding: 16px 12px; }
    .step-header { padding: 14px 16px; }
    .step-content { padding: 16px; }
    .server-grid { grid-template-columns: repeat(3, 1fr); }
    .server-grid-small { grid-template-columns: repeat(4, 1fr); }
    .client-row { grid-template-columns: repeat(2, 1fr); }
    .test-row { flex-direction: column; }
    .test-input { width: 100%; }
    .ip-count-row { flex-direction: column; align-items: flex-start; }
    .nav-tabs { padding: 12px 16px; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .form-row { grid-template-columns: 1fr; }
    .users-table { font-size: 0.75rem; }
    .users-table th, .users-table td { padding: 8px 6px; }
}

/* Preview Box */
.preview-btn-row {
    margin-bottom: 16px;
}

.preview-box {
    background: var(--bg);
    border: 2px solid var(--gold);
    border-radius: 12px;
    margin-bottom: 20px;
    overflow: hidden;
}

.preview-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 215, 0, 0.1);
    border-bottom: 1px solid var(--gold);
    font-weight: 600;
    color: var(--gold);
}

.preview-box-actions {
    display: flex;
    gap: 8px;
}

.btn-small {
    padding: 6px 12px;
    font-size: 0.75rem;
    background: transparent;
    border: 1px solid var(--gold);
    border-radius: 4px;
    color: var(--gold);
    cursor: pointer;
}

.btn-small:hover {
    background: rgba(255, 215, 0, 0.1);
}

.preview-content {
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;
}

.preview-section {
    font-size: 0.85rem;
}

.preview-header {
    font-weight: 600;
    color: var(--gold);
    margin: 16px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
}

.preview-header:first-child {
    margin-top: 0;
}

.preview-grid {
    display: grid;
    gap: 8px;
}

.preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--card);
    border-radius: 6px;
}

.preview-label {
    color: var(--dim);
}

.preview-value {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.tag {
    padding: 2px 8px;
    background: rgba(255, 215, 0, 0.15);
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--gold);
}

.preview-empty {
    padding: 12px;
    text-align: center;
    color: var(--dim);
    background: var(--card);
    border-radius: 6px;
}

.preview-warning {
    padding: 10px 12px;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid var(--red);
    border-radius: 6px;
    color: var(--red);
    font-size: 0.8rem;
    margin-bottom: 12px;
}

.preview-countries {
    display: grid;
    gap: 8px;
}

.preview-country {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--card);
    border-radius: 6px;
}

.country-emoji {
    font-size: 1.2rem;
}

.country-name {
    flex: 1;
    font-weight: 500;
}

.country-count {
    color: var(--gold);
    font-weight: 600;
}

.country-source {
    font-size: 0.7rem;
    color: var(--dim);
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 4px;
}

.preview-summary {
    display: flex;
    gap: 16px;
    justify-content: center;
    padding: 16px;
    background: var(--card);
    border-radius: 8px;
}

.summary-item {
    text-align: center;
}

.summary-num {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: var(--gold);
}

.summary-label {
    font-size: 0.75rem;
    color: var(--dim);
}

.preview-nodes {
    display: grid;
    gap: 12px;
}

.node-group {
    background: var(--card);
    border-radius: 8px;
    overflow: hidden;
}

.node-group-title {
    padding: 10px 12px;
    background: rgba(255, 215, 0, 0.05);
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--gold);
    border-bottom: 1px solid var(--border);
}

.node-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 0.8rem;
}

.node-item:last-child {
    border-bottom: none;
}

.node-name {
    flex: 1;
    color: var(--text);
}

.node-ip {
    font-family: monospace;
    font-size: 0.7rem;
    color: var(--dim);
}

.node-source {
    font-size: 0.65rem;
    color: var(--gold);
    background: rgba(255, 215, 0, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

.node-more {
    padding: 8px 12px;
    text-align: center;
    color: var(--dim);
    font-size: 0.75rem;
    font-style: italic;
}

.preview-text {
    font-family: monospace;
    font-size: 0.75rem;
    white-space: pre;
    overflow-x: auto;
    background: var(--card);
    padding: 16px;
    border-radius: 8px;
    color: var(--text);
    line-height: 1.4;
}

/* Backup Tab Styles */
.backup-summary {
    min-height: 100px;
}

.summary-loading, .summary-error {
    text-align: center;
    padding: 30px;
    color: var(--dim);
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.summary-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.summary-icon {
    font-size: 1.5rem;
}

.summary-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--gold);
}

.summary-label {
    font-size: 0.75rem;
    color: var(--dim);
}

.summary-section {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 12px 0;
    border-top: 1px solid var(--border);
}

.section-title {
    font-size: 0.85rem;
    color: var(--dim);
    min-width: 80px;
}

.feature-badge {
    padding: 4px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.75rem;
    color: var(--dim);
}

.feature-badge.active {
    background: rgba(74, 222, 128, 0.15);
    border-color: var(--green);
    color: var(--green);
}

.summary-text {
    font-size: 0.85rem;
}

/* Export Options */
.export-options {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px;
}

/* File Input */
.file-input-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.file-input-wrap input[type="file"] {
    display: none;
}

.file-input-label {
    padding: 12px 20px;
    background: var(--card);
    border: 2px dashed var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.file-input-label:hover {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.05);
}

.file-name {
    font-size: 0.85rem;
    color: var(--gold);
}

/* Backup Preview */
.backup-preview {
    background: var(--bg);
    border: 1px solid var(--gold);
    border-radius: 10px;
    margin-top: 16px;
    overflow: hidden;
}

.preview-header-bar {
    padding: 12px 16px;
    background: rgba(255, 215, 0, 0.1);
    border-bottom: 1px solid var(--gold);
    font-weight: 600;
    color: var(--gold);
}

#backupPreviewContent {
    padding: 16px;
}

.backup-info {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
}

.info-row {
    font-size: 0.85rem;
}

.info-row span {
    color: var(--dim);
    margin-left: 6px;
}

.backup-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.stat-item {
    font-size: 0.85rem;
    padding: 6px 12px;
    background: var(--card);
    border-radius: 6px;
}

.backup-contents {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.content-title {
    font-size: 0.85rem;
    color: var(--dim);
}

.content-badge {
    padding: 4px 8px;
    background: rgba(74, 222, 128, 0.15);
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--green);
}

.backup-warnings {
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid var(--red);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
}

.warning-item {
    font-size: 0.85rem;
    color: var(--red);
    margin-bottom: 4px;
}

.warning-item:last-child {
    margin-bottom: 0;
}

.backup-countries {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.country-badge {
    padding: 4px 10px;
    background: var(--card);
    border-radius: 6px;
    font-size: 0.8rem;
}

/* Import Options */
.import-options {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    margin-top: 16px;
}

.import-sections {
    margin-top: 16px;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    margin-top: 10px;
}

.checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.checkbox-item:hover {
    border-color: var(--gold);
}

.checkbox-item input {
    accent-color: var(--gold);
}

/* Warning Box */
.warning-box {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid var(--red);
    border-radius: 10px;
}

.warning-icon {
    font-size: 1.5rem;
}

.warning-text {
    font-size: 0.9rem;
    color: var(--red);
    line-height: 1.5;
}

/* Danger Button */
.btn-danger {
    background: var(--red);
    border-color: var(--red);
    color: #fff;
}

.btn-danger:hover {
    background: #dc2626;
}

@media (max-width: 600px) {
    .summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .backup-info {
        flex-direction: column;
        gap: 8px;
    }
    .backup-stats {
        flex-direction: column;
        gap: 8px;
    }
    .checkbox-grid {
        grid-template-columns: 1fr;
    }
}

/* ===== استایل‌های نام‌گذاری ===== */
.preview-name-box {
    background: rgba(255, 215, 0, 0.05);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
}

.preview-name-label {
    font-size: 0.85rem;
    color: var(--gold);
    margin-bottom: 10px;
}

.preview-name-samples {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.preview-name-item {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: monospace;
}

.form-hint {
    font-size: 0.8rem;
    color: var(--dim);
    margin-top: 6px;
}

.form-hint code {
    background: rgba(255, 215, 0, 0.1);
    color: var(--gold);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    margin: 0 2px;
}

.option-card.small {
    padding: 12px;
}

.option-card.small .option-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
}

.option-card.small .option-name {
    font-size: 0.85rem;
}

.option-card.small .option-desc {
    font-size: 0.75rem;
    color: var(--dim);
}
`;