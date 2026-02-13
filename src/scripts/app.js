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
};

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
const trackerToggleDot = $('#tracker-toggle-dot');

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
  return `${prefix}<strong style="color: var(--text-primary); font-weight: 600;">${escapedRoot}</strong>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-enter pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg text-sm max-w-sm shadow-lg';
  toast.style.cssText = `background-color: var(--toast-error); color: white;`;
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
  let from;

  switch (range) {
    case '1h':
      from = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      break;
    case '24h':
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '3d':
      from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  }

  filterFrom.value = toLocalDatetimeValue(from);
  filterTo.value = toLocalDatetimeValue(now);
  state.activePreset = range;

  dateRangeBtns.forEach((btn) => {
    if (btn.dataset.range === range) {
      btn.style.backgroundColor = 'var(--accent)';
      btn.style.color = 'white';
      btn.style.borderColor = 'var(--accent)';
    } else {
      btn.style.backgroundColor = 'var(--bg-tertiary)';
      btn.style.color = 'var(--text-secondary)';
      btn.style.borderColor = 'var(--border)';
    }
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
    btn.style.backgroundColor = 'var(--bg-tertiary)';
    btn.style.color = 'var(--text-secondary)';
    btn.style.borderColor = 'var(--border)';
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
    state.cursor = null;
    state.logCount = 0;
    state.allLoaded = false;
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
    if (isScroll && state.cursor) params.set('cursor', state.cursor);

    const res = await fetch(`/api/logs?${params.toString()}`);
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
    showToast(err.message || t('logs.fetchError'));
    if (!isScroll) {
      hide(logsLoading);
      show(logsEmpty);
    }
  } finally {
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

// ─── Auto-refresh ───────────────────────────────────────────────────────────

const AR_LABELS = { 30: '30s', 60: '1m', 300: '5m' };

function updateAutoRefreshAvailability() {
  const enabled = state.activePreset === '1h';
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
      setDateRange('1h');
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

    if (isActive) {
      btn.style.backgroundColor = '#22c55e';
      btn.style.color = 'white';
      btn.style.borderColor = '#16a34a';
      label.textContent = formatCountdown(state.autoRefreshRemaining);
    } else {
      btn.style.backgroundColor = 'var(--bg-tertiary)';
      btn.style.color = 'var(--text-secondary)';
      btn.style.borderColor = 'var(--border)';
      label.textContent = AR_LABELS[seconds] || `${seconds}s`;
    }
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
    row.style.cssText = `grid-template-columns: 140px minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1.5fr) 90px 80px minmax(0, 1fr); border-bottom: 1px solid var(--border);`;

    const deviceName = log.device?.name || log.device?.model || '—';
    const root = log.root || '—';
    const tracker = log.tracker || '—';
    const protocol = shortenProtocol(log.protocol);
    const color = statusColor(log.status);

    row.innerHTML = `
      <span class="font-mono" style="color: var(--text-secondary);">${formatDate(log.timestamp)}</span>
      <span class="font-mono truncate" title="${escapeHtml(log.domain)}" style="color: var(--text-muted);">${formatDomainWithRoot(log.domain, log.root)}</span>
      <span class="font-mono truncate" title="${escapeHtml(root)}" style="color: var(--text-muted);">${escapeHtml(root)}</span>
      <span class="font-mono truncate" title="${escapeHtml(tracker)}" style="color: var(--text-muted);">${escapeHtml(tracker)}</span>
      <span class="font-mono" style="color: var(--text-secondary);">${escapeHtml(protocol)}</span>
      <span class="font-mono font-medium" style="color: ${color};">${escapeHtml(log.status)}</span>
      <span class="truncate" style="color: var(--text-secondary);" title="${escapeHtml(deviceName)}">${escapeHtml(deviceName)}</span>
    `;

    fragment.appendChild(row);
  });

  logsList.appendChild(fragment);
}

// ─── Local filters ──────────────────────────────────────────────────────────

localFilterTracker.addEventListener('change', () => {
  updateToggleVisual();
  applyLocalFilters();
});
localFilterDomain.addEventListener('input', applyLocalFilters);
localFilterTrackerSearch.addEventListener('input', applyLocalFilters);

function updateToggleVisual() {
  const checked = localFilterTracker.checked;
  const track = trackerToggleDot.previousElementSibling;
  if (checked) {
    track.style.backgroundColor = 'var(--toggle-on)';
    track.style.borderColor = 'var(--toggle-on-border)';
    trackerToggleDot.style.transform = 'translateX(20px)';
    trackerToggleDot.style.backgroundColor = 'white';
  } else {
    track.style.backgroundColor = 'var(--bg-tertiary)';
    track.style.borderColor = 'var(--border)';
    trackerToggleDot.style.transform = 'translateX(0)';
    trackerToggleDot.style.backgroundColor = 'var(--text-muted)';
  }
}

updateToggleVisual();

function applyLocalFilters() {
  const hideTrackers = !localFilterTracker.checked;
  const domainQuery = localFilterDomain.value.trim().toLowerCase();
  const trackerQuery = localFilterTrackerSearch.value.trim().toLowerCase();
  const rows = logsList.querySelectorAll('.log-row');
  let visibleCount = 0;
  const anyFilterActive = hideTrackers || domainQuery || trackerQuery;

  rows.forEach((row) => {
    const hasTracker = row.dataset.hasTracker === 'true';
    const domain = (row.dataset.domain || '').toLowerCase();
    const tracker = (row.dataset.tracker || '').toLowerCase();
    let visible = true;

    if (hideTrackers && hasTracker) visible = false;
    if (visible && domainQuery && !domain.includes(domainQuery)) visible = false;
    if (visible && trackerQuery && !tracker.includes(trackerQuery)) visible = false;

    row.style.display = visible ? '' : 'none';
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

  if (scrollTopBtn) {
    scrollTopBtn.style.opacity = scrolledDown ? '1' : '0';
    scrollTopBtn.style.pointerEvents = scrolledDown ? 'auto' : 'none';
  }

  const showBottom = hasEnoughContent && !nearBottom;
  if (scrollBottomBtn) {
    scrollBottomBtn.style.opacity = showBottom ? '1' : '0';
    scrollBottomBtn.style.pointerEvents = showBottom ? 'auto' : 'none';
  }
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
