/**
 * NDEXPLORER — Client-side logic (vanilla JS).
 * READ-ONLY: Only GET requests are made.
 */

// ─── State ──────────────────────────────────────────────────────────────────

const state = {
  connected: false,
  loading: false,
  scrollLoading: false,
  cursor: null,
  logCount: 0,
  allLoaded: false,
  activePreset: null,
  autoRefreshSeconds: null,
  autoRefreshTimerId: null,
  autoRefreshRemaining: 0,
  exportRunning: false,
};

let searchController = null;
const logsData = [];
const THEME_STORAGE_KEY = 'ndexplorer-theme';
const DEFAULT_THEME = 'dark';

// ─── DOM refs ───────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const connectScreen = $('#connect-screen');
const connectBtn = $('#connect-btn');
const connectBtnText = $('#connect-btn-text');
const connectBtnSpinner = $('#connect-btn-spinner');
const mainPanel = $('#main-panel');
const filterForm = $('#filter-form');
const filterFrom = $('#filter-from');
const filterTo = $('#filter-to');
const filterStatus = $('#filter-status');
const filterDevice = $('#filter-device');
const filterText = $('#filter-text');
const searchBtn = $('#search-btn');
const searchBtnText = $('#search-btn-text');
const searchBtnSpinner = $('#search-btn-spinner');
const logsList = $('#logs-list');
const logsEmpty = $('#logs-empty');
const logsLoading = $('#logs-loading');
const logsNoResults = $('#logs-no-results');
const logsScrollLoader = $('#logs-scroll-loader');
const logsEnd = $('#logs-end');
const logCounter = $('#log-counter');
const logCount = $('#log-count');
const scrollTopBtn = $('#scroll-top-btn');
const toastContainer = $('#toast-container');
const localFilterTracker = $('#local-filter-tracker');
const autoRefreshBtns = document.querySelectorAll('.auto-refresh-btn');
const arPresetHint = $('#ar-preset-hint');
const localFilterDomain = $('#local-filter-domain');
const localFilterTrackerSearch = $('#local-filter-tracker-search');
const themeToggle = $('#theme-toggle');
const exportOpenBtn = $('#export-open-btn');
const exportModal = $('#export-modal');
const exportCloseBtn = $('#export-close-btn');
const exportFrom = $('#export-from');
const exportTo = $('#export-to');
const exportDevice = $('#export-device');
const exportStartBtn = $('#export-start-btn');
const exportStartText = $('#export-start-text');
const exportStartSpinner = $('#export-start-spinner');
const exportCancelBtn = $('#export-cancel-btn');
const exportStatus = $('#export-status');
const exportRangeWarning = $('#export-range-warning');

const EXPORT_LIMIT = 500;
const EXPORT_MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;
const EXPORT_BATCH_DELAY_MS = 1000;
const EXPORT_TIMEOUT_MS = 15_000;

let exportController = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function show(el) { if (el) el.style.display = ''; }
function hide(el) { if (el) el.style.display = 'none'; }

function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  return function (...args) {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

function debounce(fn, ms) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toLocalDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusColor(status) {
  switch (status) {
    case 'blocked': return 'var(--status-blocked)';
    case 'allowed': return 'var(--status-allowed)';
    case 'error': return 'var(--status-error)';
    default: return 'var(--status-default)';
  }
}

function shortenProtocol(protocol) {
  if (!protocol) return '—';
  return protocol
    .replace('DNS-over-HTTPS', 'DoH')
    .replace('DNS-over-TLS', 'DoT')
    .replace('DNS-over-QUIC', 'DoQ');
}

/** Bold the root domain part inside the full domain string. */
function formatDomainWithRoot(domain, root) {
  if (!root || !domain) return escapeHtml(domain || '—');

  const escapedDomain = escapeHtml(domain);
  const escapedRoot = escapeHtml(root);
  const idx = escapedDomain.lastIndexOf(escapedRoot);
  if (idx === -1) return escapedDomain;

  const prefix = escapedDomain.substring(0, idx);
  return `${prefix}<strong class="domain-root">${escapedRoot}</strong>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toCsvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  const escaped = s.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildCsv(logs) {
  const headers = [
    'timestamp',
    'domain',
    'root',
    'tracker',
    'encrypted',
    'protocol',
    'clientIp',
    'client',
    'deviceId',
    'deviceName',
    'deviceModel',
    'status',
    'reasons',
  ];

  const lines = [headers.join(',')];
  logs.forEach((log) => {
    const reasons = (log.reasons || []).map((r) => r.name || r.id).join('; ');
    const row = [
      log.timestamp,
      log.domain,
      log.root || '',
      log.tracker || '',
      log.encrypted ?? '',
      log.protocol || '',
      log.clientIp || '',
      log.client || '',
      log.device?.id || '',
      log.device?.name || '',
      log.device?.model || '',
      log.status || '',
      reasons,
    ].map(toCsvCell);

    lines.push(row.join(','));
  });

  return `${lines.join('\n')}\n`;
}

function getExportFilename(deviceId, fromIso, toIso) {
  const safeDevice = (deviceId || 'device').replaceAll(/[^a-zA-Z0-9_-]/g, '_');
  const safeFrom = fromIso.replaceAll(/[:.]/g, '-');
  const safeTo = toIso.replaceAll(/[:.]/g, '-');
  return `ndexplorer-logs-${safeDevice}-${safeFrom}-to-${safeTo}.csv`;
}

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function waitMs(ms, signal) {
  if (!ms) return;
  await new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchJsonWithTimeout(url, timeoutMs, signal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const abortByParent = () => timeoutController.abort();

  if (signal) signal.addEventListener('abort', abortByParent, { once: true });

  try {
    const res = await fetch(url, { signal: timeoutController.signal });
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', abortByParent);
  }
}

// ─── Theme ──────────────────────────────────────────────────────────────────

function getStoredTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }
  return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
}

function setTheme(theme) {
  const resolvedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  } catch {
    // Ignore storage errors (e.g. private mode restrictions)
  }

  if (themeToggle) {
    // checked = dark (default), unchecked = light
    themeToggle.checked = resolvedTheme === 'dark';
  }
}

function initTheme() {
  setTheme(getStoredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      setTheme(themeToggle.checked ? 'dark' : 'light');
    });
  }

  const themeWrap = $('#theme-toggle-wrap');
  const themeHint = $('#theme-hint');
  if (themeWrap && themeHint) {
    themeWrap.addEventListener('mouseenter', () => show(themeHint));
    themeWrap.addEventListener('mouseleave', () => hide(themeHint));
  }
}

initTheme();

// ─── Export CSV ──────────────────────────────────────────────────────────────

function setExportStatus(message) {
  if (!exportStatus) return;
  exportStatus.textContent = message;
  show(exportStatus);
}

function updateExportRangeWarning() {
  if (!exportRangeWarning || !exportFrom || !exportTo) return;
  const fromDate = new Date(exportFrom.value);
  const toDate = new Date(exportTo.value);
  const shouldShow =
    !isNaN(fromDate.getTime())
    && !isNaN(toDate.getTime())
    && (toDate.getTime() - fromDate.getTime()) > EXPORT_MAX_RANGE_MS;

  if (shouldShow) show(exportRangeWarning);
  else hide(exportRangeWarning);
}

function syncExportDeviceOptions() {
  if (!filterDevice || !exportDevice) return;
  const currentValue = exportDevice.value;

  exportDevice.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.dataset.i18n = 'export.selectDevice';
  placeholder.textContent = t('export.selectDevice');
  exportDevice.appendChild(placeholder);

  [...filterDevice.options]
    .filter((option) => option.value)
    .forEach((option) => {
      const clone = option.cloneNode(true);
      exportDevice.appendChild(clone);
    });

  const hasCurrent = [...exportDevice.options].some((option) => option.value === currentValue);
  if (currentValue && hasCurrent) {
    exportDevice.value = currentValue;
  } else {
    exportDevice.value = '';
  }
}

function openExportModal() {
  if (!exportModal || !exportFrom || !exportTo) return;
  const now = new Date();
  const to = filterTo?.value ? new Date(filterTo.value) : now;
  const from = filterFrom?.value ? new Date(filterFrom.value) : new Date(to.getTime() - 60 * 60 * 1000);

  exportFrom.value = toLocalDatetimeValue(from);
  exportTo.value = toLocalDatetimeValue(to);
  syncExportDeviceOptions();
  hide(exportStatus);
  hide(exportRangeWarning);
  show(exportModal);
}

function closeExportModal() {
  if (state.exportRunning) return;
  hide(exportModal);
}

function setExportUiRunning(running) {
  state.exportRunning = running;
  if (!exportStartBtn || !exportStartText || !exportCancelBtn) return;

  exportStartBtn.disabled = running;
  if (exportFrom) exportFrom.disabled = running;
  if (exportTo) exportTo.disabled = running;
  if (exportDevice) exportDevice.disabled = running;
  if (exportCloseBtn) exportCloseBtn.disabled = running;

  if (running) {
    exportStartText.dataset.i18n = 'export.exporting';
    exportStartText.textContent = t('export.exporting');
    show(exportStartSpinner);
    hide(exportStartBtn);
    hide(exportCloseBtn);
    show(exportCancelBtn);
  } else {
    exportStartText.dataset.i18n = 'export.start';
    exportStartText.textContent = t('export.start');
    hide(exportStartSpinner);
    show(exportStartBtn);
    show(exportCloseBtn);
    hide(exportCancelBtn);
  }
}

async function startExport() {
  if (state.exportRunning) return;
  if (!exportFrom || !exportTo || !exportDevice) return;

  const fromDate = new Date(exportFrom.value);
  const toDate = new Date(exportTo.value);
  const deviceId = exportDevice.value;

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    showToast(t('error.invalidDate'));
    return;
  }
  if (toDate <= fromDate) {
    showToast(t('export.invalidRange'));
    return;
  }
  if ((toDate.getTime() - fromDate.getTime()) > EXPORT_MAX_RANGE_MS) {
    show(exportRangeWarning);
    return;
  }
  if (!deviceId) {
    showToast(t('export.selectDevice'));
    return;
  }

  exportController = new AbortController();
  setExportUiRunning(true);

  const allLogs = [];
  let cursor = null;
  let page = 0;

  try {
    do {
      page++;
      setExportStatus(`${t('export.downloading')} ${page}...`);

      const params = new URLSearchParams();
      params.set('from', fromDate.toISOString());
      params.set('to', toDate.toISOString());
      params.set('device', deviceId);
      params.set('limit', String(EXPORT_LIMIT));
      if (cursor) params.set('cursor', cursor);

      const data = await fetchJsonWithTimeout(
        `/api/logs?${params.toString()}`,
        EXPORT_TIMEOUT_MS,
        exportController.signal,
      );

      if (data.error || data.errorKey) {
        const msg = data.errorKey ? t(data.errorKey) + (data.detail ? ` (${data.detail})` : '') : data.error;
        throw new Error(msg);
      }

      const logs = data.data || [];
      allLogs.push(...logs);
      cursor = data.meta?.pagination?.cursor || null;

      setExportStatus(`${t('export.exporting')} ${allLogs.length} ${t('header.logs')}`);
      if (cursor) await waitMs(EXPORT_BATCH_DELAY_MS, exportController.signal);
    } while (cursor);

    setExportStatus(t('export.saving'));
    const fromIso = fromDate.toISOString();
    const toIso = toDate.toISOString();
    const csv = buildCsv(allLogs);
    downloadCsv(getExportFilename(deviceId, fromIso, toIso), csv);
    setExportStatus(t('export.done'));
  } catch (err) {
    if (err?.name === 'AbortError') {
      showToast(t('export.cancelled'));
    } else {
      showToast(err.message || t('logs.fetchError'));
    }
  } finally {
    exportController = null;
    setExportUiRunning(false);
  }
}

if (exportOpenBtn) exportOpenBtn.addEventListener('click', openExportModal);
if (exportCloseBtn) exportCloseBtn.addEventListener('click', closeExportModal);
if (exportStartBtn) exportStartBtn.addEventListener('click', startExport);
if (exportFrom) exportFrom.addEventListener('input', updateExportRangeWarning);
if (exportTo) exportTo.addEventListener('input', updateExportRangeWarning);
if (exportCancelBtn) {
  exportCancelBtn.addEventListener('click', () => {
    if (exportController) exportController.abort();
  });
}
if (exportModal) {
  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) closeExportModal();
  });
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-enter toast-msg pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg text-sm max-w-sm shadow-lg';
  toast.innerHTML = `
    <span class="flex-1">${escapeHtml(message)}</span>
    <button class="ml-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-base leading-none" aria-label="${t('toast.close')}">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => removeToast(toast));
  toastContainer.appendChild(toast);
  setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.remove('toast-enter');
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => toast.remove());
}

// ─── Date range presets ─────────────────────────────────────────────────────

const dateRangeBtns = document.querySelectorAll('.date-range-btn');

function setDateRange(range) {
  const now = new Date();
  const to = new Date(now.getTime() + 60 * 1000);
  let from;

  switch (range) {
    case '15m':
      from = new Date(to.getTime() - 15 * 60 * 1000);
      break;
    case '1h':
      from = new Date(to.getTime() - 1 * 60 * 60 * 1000);
      break;
    case '1d':
      from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '3d':
      from = new Date(to.getTime() - 72 * 60 * 60 * 1000);
      break;
    case '7d':
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(to.getTime() - 1 * 60 * 60 * 1000);
  }

  filterFrom.value = toLocalDatetimeValue(from);
  filterTo.value = toLocalDatetimeValue(to);
  state.activePreset = range;

  dateRangeBtns.forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.range === range);
  });

  updateAutoRefreshAvailability();
}

dateRangeBtns.forEach((btn) => {
  btn.addEventListener('click', () => setDateRange(btn.dataset.range));
});

// Manual date change → deselect presets + stop auto-refresh
function clearDateRangeButtons() {
  state.activePreset = null;
  dateRangeBtns.forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
  });
  stopAutoRefresh();
  updateAutoRefreshAvailability();
}

filterFrom.addEventListener('input', clearDateRangeButtons);
filterTo.addEventListener('input', clearDateRangeButtons);

// ─── Connect ────────────────────────────────────────────────────────────────

connectBtn.addEventListener('click', handleConnect);

async function handleConnect() {
  if (state.connected || state.loading) return;

  state.loading = true;
  connectBtn.disabled = true;
  connectBtnText.dataset.i18n = 'connect.loading';
  connectBtnText.textContent = t('connect.loading');
  show(connectBtnSpinner);

  try {
    const res = await fetch('/api/devices');
    const data = await res.json();

    if (data.error || data.errorKey) {
      const msg = data.errorKey ? t(data.errorKey) + (data.detail ? ` (${data.detail})` : '') : data.error;
      throw new Error(msg);
    }

    const devices = data.data || [];
    devices.forEach((device) => {
      const option = document.createElement('option');
      option.value = device.id;
      if (device.id === '__UNIDENTIFIED__') {
        option.textContent = t('devices.unidentified');
        option.dataset.i18n = 'devices.unidentified';
      } else {
        option.textContent = device.name || device.model || device.id;
      }
      filterDevice.appendChild(option);
    });
    syncExportDeviceOptions();

    setDateRange('1h');
    state.connected = true;
    hide(connectScreen);
    show(mainPanel);

  } catch (err) {
    showToast(err.message || t('connect.error'));
    connectBtnText.dataset.i18n = 'connect.button';
    connectBtnText.textContent = t('connect.button');
  } finally {
    state.loading = false;
    connectBtn.disabled = false;
    hide(connectBtnSpinner);
  }
}

// ─── Search / Fetch logs ────────────────────────────────────────────────────

filterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  searchLogs(false);
});

async function searchLogs(isScroll) {
  if (!isScroll) {
    if (searchController) searchController.abort();
    state.cursor = null;
    state.logCount = 0;
    state.allLoaded = false;
    state.scrollLoading = false;
    logsData.length = 0;
    logsList.innerHTML = '';
    hide(logsEnd);
    hide(logsNoResults);
    hide(logsEmpty);
    show(logsLoading);
    hide(logCounter);

    searchBtn.disabled = true;
    searchBtnText.dataset.i18n = 'filters.searching';
    searchBtnText.textContent = t('filters.searching');
    show(searchBtnSpinner);
  } else {
    if (state.scrollLoading || state.allLoaded) return;
    state.scrollLoading = true;
    show(logsScrollLoader);
  }

  const controller = new AbortController();
  searchController = controller;

  try {
    const params = new URLSearchParams();

    if (filterFrom.value) {
      const fromDate = new Date(filterFrom.value);
      if (isNaN(fromDate.getTime())) throw new Error(t('error.invalidDate'));
      params.set('from', fromDate.toISOString());
    }
    if (filterTo.value) {
      const toDate = new Date(filterTo.value);
      if (isNaN(toDate.getTime())) throw new Error(t('error.invalidDate'));
      params.set('to', toDate.toISOString());
    }
    if (filterStatus.value) params.set('status', filterStatus.value);
    if (filterDevice.value) params.set('device', filterDevice.value);
    if (filterText.value.trim()) params.set('search', filterText.value.trim());
    if (isScroll && state.cursor) params.set('cursor', state.cursor);

    const res = await fetch(`/api/logs?${params.toString()}`, { signal: controller.signal });
    const data = await res.json();

    if (data.error || data.errorKey) {
      const msg = data.errorKey ? t(data.errorKey) + (data.detail ? ` (${data.detail})` : '') : data.error;
      throw new Error(msg);
    }

    const logs = data.data || [];
    const cursor = data.meta?.pagination?.cursor || null;

    state.cursor = cursor;
    state.logCount += logs.length;

    if (!isScroll) hide(logsLoading);

    if (state.logCount === 0) {
      show(logsNoResults);
    } else {
      renderLogs(logs);
      show(logCounter);
      logCount.textContent = state.logCount;
      applyLocalFilters();
    }

    if (!cursor) {
      state.allLoaded = true;
      if (state.logCount > 0) show(logsEnd);
    }

  } catch (err) {
    if (err.name === 'AbortError') return;
    showToast(err.message || t('logs.fetchError'));
    if (!isScroll) {
      hide(logsLoading);
      show(logsEmpty);
    }
  } finally {
    if (searchController === controller) {
      if (!isScroll) {
        searchBtn.disabled = false;
        searchBtnText.dataset.i18n = 'filters.search';
        searchBtnText.textContent = t('filters.search');
        hide(searchBtnSpinner);
      } else {
        state.scrollLoading = false;
        hide(logsScrollLoader);
      }
    }
  }
}

// ─── Auto-refresh ───────────────────────────────────────────────────────────

const AR_LABELS = { 30: '30s', 60: '1m', 300: '5m' };

function updateAutoRefreshAvailability() {
  const enabled = state.activePreset === '15m' || state.activePreset === '1h';
  autoRefreshBtns.forEach((btn) => { btn.disabled = !enabled; });
  hide(arPresetHint);
}

// Show hint on hover over disabled buttons
autoRefreshBtns.forEach((btn) => {
  btn.addEventListener('mouseenter', () => { if (btn.disabled) show(arPresetHint); });
  btn.addEventListener('mouseleave', () => { hide(arPresetHint); });
});

autoRefreshBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const seconds = parseInt(btn.dataset.refresh, 10);
    if (state.autoRefreshSeconds === seconds) {
      stopAutoRefresh();
    } else {
      startAutoRefresh(seconds);
    }
  });
});

function startAutoRefresh(seconds) {
  stopAutoRefresh();
  state.autoRefreshSeconds = seconds;
  state.autoRefreshRemaining = seconds;
  updateAutoRefreshButtons();

  state.autoRefreshTimerId = setInterval(() => {
    state.autoRefreshRemaining--;
    updateAutoRefreshButtons();

    if (state.autoRefreshRemaining <= 0) {
      // Keep preset window sliding with current time on each refresh tick.
      if (state.activePreset) setDateRange(state.activePreset);
      searchLogs(false);
      state.autoRefreshRemaining = state.autoRefreshSeconds;
    }
  }, 1000);
}

function stopAutoRefresh() {
  if (state.autoRefreshTimerId) {
    clearInterval(state.autoRefreshTimerId);
    state.autoRefreshTimerId = null;
  }
  state.autoRefreshSeconds = null;
  state.autoRefreshRemaining = 0;
  updateAutoRefreshButtons();
}

function updateAutoRefreshButtons() {
  autoRefreshBtns.forEach((btn) => {
    const seconds = parseInt(btn.dataset.refresh, 10);
    const label = btn.querySelector('.ar-label');
    const isActive = state.autoRefreshSeconds === seconds;

    btn.setAttribute('aria-pressed', isActive);
    label.textContent = isActive
      ? formatCountdown(state.autoRefreshRemaining)
      : (AR_LABELS[seconds] || `${seconds}s`);
  });
}

function formatCountdown(secs) {
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}:00`;
  }
  return `${secs}s`;
}

// Stop auto-refresh on any API filter change
[filterStatus, filterDevice].forEach((el) => {
  el.addEventListener('change', stopAutoRefresh);
});
filterText.addEventListener('input', stopAutoRefresh);

// ─── Render logs ────────────────────────────────────────────────────────────

function renderLogs(logs) {
  const fragment = document.createDocumentFragment();

  logs.forEach((log) => {
    const hasTracker = !!(log.tracker);
    const row = document.createElement('div');
    row.className = 'px-4 py-1.5 grid gap-2 text-xs items-center log-row';
    row.dataset.hasTracker = hasTracker ? 'true' : 'false';
    row.dataset.domain = log.domain || '';
    row.dataset.tracker = log.tracker || '';

    const deviceName = log.device?.name || log.device?.model || '—';
    const root = log.root || '—';
    const tracker = log.tracker || '—';
    const protocol = shortenProtocol(log.protocol);
    const clientIp = log.clientIp || '—';
    const color = statusColor(log.status);

    row.innerHTML = `
      <span class="font-mono" style="color: var(--text-secondary);">${formatDate(log.timestamp)}</span>
      <span class="font-mono truncate" title="${escapeHtml(log.domain)}" style="color: var(--text-muted);">${formatDomainWithRoot(log.domain, log.root)}</span>
      <span class="font-mono truncate" title="${escapeHtml(root)}" style="color: var(--text-muted);">${escapeHtml(root)}</span>
      <span class="font-mono truncate" title="${escapeHtml(tracker)}" style="color: var(--text-muted);">${escapeHtml(tracker)}</span>
      <span class="font-mono" style="color: var(--text-secondary);">${escapeHtml(protocol)}</span>
      <span class="font-mono truncate" title="${escapeHtml(clientIp)}" style="color: var(--text-secondary);">${escapeHtml(clientIp)}</span>
      <span class="font-mono font-medium" style="color: ${color};">${escapeHtml(log.status)}</span>
      <span class="truncate" style="color: var(--text-secondary);" title="${escapeHtml(deviceName)}">${escapeHtml(deviceName)}</span>
    `;

    logsData.push({
      domain: (log.domain || '').toLowerCase(),
      tracker: (log.tracker || '').toLowerCase(),
      hasTracker,
      el: row,
    });
    fragment.appendChild(row);
  });

  logsList.appendChild(fragment);
}

// ─── Local filters ──────────────────────────────────────────────────────────

// ─── Input clear buttons ─────────────────────────────────────────────────

document.querySelectorAll('.input-clear-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.clear);
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    }
  });
});

const debouncedApplyLocalFilters = debounce(applyLocalFilters, 150);

localFilterTracker.addEventListener('change', () => {
  localFilterTrackerSearch.disabled = !localFilterTracker.checked;
  applyLocalFilters();
});
localFilterDomain.addEventListener('input', debouncedApplyLocalFilters);
localFilterTrackerSearch.addEventListener('input', debouncedApplyLocalFilters);

localFilterTrackerSearch.disabled = !localFilterTracker.checked;

function applyLocalFilters() {
  const hideTrackers = !localFilterTracker.checked;
  const domainQuery = localFilterDomain.value.trim().toLowerCase();
  const trackerQuery = localFilterTrackerSearch.value.trim().toLowerCase();
  let visibleCount = 0;
  const anyFilterActive = hideTrackers || domainQuery || trackerQuery;

  logsData.forEach((entry) => {
    let visible = true;

    if (hideTrackers && entry.hasTracker) visible = false;
    if (visible && domainQuery && !entry.domain.includes(domainQuery)) visible = false;
    if (visible && trackerQuery && !entry.tracker.includes(trackerQuery)) visible = false;

    entry.el.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });

  if (state.logCount > 0) {
    logCount.textContent = anyFilterActive ? `${visibleCount} / ${state.logCount}` : state.logCount;
  }
}

// ─── Infinite scroll ────────────────────────────────────────────────────────

function handleInfiniteScroll() {
  if (state.allLoaded || state.scrollLoading || !state.connected) return;
  const { scrollY } = window;
  const { scrollHeight } = document.documentElement;
  const { innerHeight } = window;
  if (scrollHeight - scrollY - innerHeight < 200 && state.cursor) {
    searchLogs(true);
  }
}

// ─── Scroll navigation ─────────────────────────────────────────────────────

const scrollBottomBtn = $('#scroll-bottom-btn');

function updateScrollBtns() {
  const { scrollY } = window;
  const { scrollHeight } = document.documentElement;
  const { innerHeight } = window;
  const scrolledDown = scrollY > 300;
  const nearBottom = scrollHeight - scrollY - innerHeight < 200;
  const hasEnoughContent = state.logCount >= 500;

  if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', scrolledDown);

  const showBottom = hasEnoughContent && !nearBottom;
  if (scrollBottomBtn) scrollBottomBtn.classList.toggle('visible', showBottom);
}

const onScroll = throttle(() => {
  handleInfiniteScroll();
  updateScrollBtns();
}, 100);

window.addEventListener('scroll', onScroll);

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

scrollBottomBtn.addEventListener('click', () => {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
});
