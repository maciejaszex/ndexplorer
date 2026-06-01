/**
 * NDEXPLORER — shared log presentation & filtering logic.
 *
 * Pure (or DOM-only) helpers used by BOTH the browser controller
 * (`src/scripts/app.js`) and the test suite. Keeping this single source of
 * truth avoids the previous duplication where tests re-implemented the logic.
 *
 * No network access, no NextDNS calls — presentation/formatting only.
 */

export interface LogLike {
  timestamp: string;
  domain?: string;
  root?: string;
  tracker?: string;
  protocol?: string;
  clientIp?: string;
  status: string;
  device?: { id?: string; name?: string; model?: string };
  reasons?: Array<{ id?: string; name?: string }>;
}

export interface FilterOptions {
  hideTrackers?: boolean;
  domainQuery?: string;
  trackerQuery?: string;
}

export interface RowMeta {
  hasTracker: boolean;
  domain: string;
  tracker: string;
}

// ─── Formatting ───────────────────────────────────────────────────────────

export function escapeHtml(str: string | undefined | null): string {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

export function statusColor(status: string): string {
  switch (status) {
    case 'blocked': return 'var(--status-blocked)';
    case 'allowed': return 'var(--status-allowed)';
    case 'error': return 'var(--status-error)';
    default: return 'var(--status-default)';
  }
}

export function shortenProtocol(protocol: string | undefined): string {
  if (!protocol) return '—';
  return protocol
    .replace('DNS-over-HTTPS', 'DoH')
    .replace('DNS-over-TLS', 'DoT')
    .replace('DNS-over-QUIC', 'DoQ');
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatCountdown(secs: number): string {
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}:00`;
  }
  return `${secs}s`;
}

/** Bold the root domain part inside the full domain string (escaped). */
export function formatDomainWithRoot(domain: string | undefined, root: string | undefined): string {
  if (!root || !domain) return escapeHtml(domain || '—');

  const escapedDomain = escapeHtml(domain);
  const escapedRoot = escapeHtml(root);
  const idx = escapedDomain.lastIndexOf(escapedRoot);
  if (idx === -1) return escapedDomain;

  const prefix = escapedDomain.substring(0, idx);
  return `${prefix}<strong class="domain-root">${escapedRoot}</strong>`;
}

// ─── CSV export ─────────────────────────────────────────────────────────────

export function toCsvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Neutralize CSV formula injection: a leading =, +, -, @, tab or CR can be
  // interpreted as a formula by spreadsheet apps (Excel/Sheets). Prefix with '.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  const escaped = s.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function buildCsv(logs: LogLike[]): string {
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
      (log as { encrypted?: boolean }).encrypted ?? '',
      log.protocol || '',
      log.clientIp || '',
      (log as { client?: string }).client || '',
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

export function getExportFilename(deviceId: string, fromIso: string, toIso: string): string {
  const safeDevice = (deviceId || 'device').replaceAll(/[^a-zA-Z0-9_-]/g, '_');
  const safeFrom = fromIso.replaceAll(/[:.]/g, '-');
  const safeTo = toIso.replaceAll(/[:.]/g, '-');
  return `ndexplorer-logs-${safeDevice}-${safeFrom}-to-${safeTo}.csv`;
}

// ─── Timing utilities ────────────────────────────────────────────────────────

export function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: A) {
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

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: A) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ─── Rendering & filtering ───────────────────────────────────────────────────

/** Build a single log row element (with dataset metadata) for the log list. */
export function createLogRow(log: LogLike): HTMLDivElement {
  const hasTracker = !!log.tracker;
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
      <span class="font-mono truncate" style="color: var(--text-muted);">${formatDomainWithRoot(log.domain, log.root)}</span>
      <span class="font-mono truncate" style="color: var(--text-muted);">${escapeHtml(root)}</span>
      <span class="font-mono truncate" style="color: var(--text-muted);">${escapeHtml(tracker)}</span>
      <span class="font-mono" style="color: var(--text-secondary);">${escapeHtml(protocol)}</span>
      <span class="font-mono truncate" style="color: var(--text-secondary);">${escapeHtml(clientIp)}</span>
      <span class="font-mono font-medium" style="color: ${color};">${escapeHtml(log.status)}</span>
      <span class="truncate" style="color: var(--text-secondary);">${escapeHtml(deviceName)}</span>
    `;

  return row;
}

/** Derive the filter metadata used by {@link isLogVisible} from a log entry. */
export function rowMeta(log: LogLike): RowMeta {
  return {
    hasTracker: !!log.tracker,
    domain: (log.domain || '').toLowerCase(),
    tracker: (log.tracker || '').toLowerCase(),
  };
}

/** Pure predicate: should a row be visible given the active local filters? */
export function isLogVisible(meta: RowMeta, opts: FilterOptions): boolean {
  if (opts.hideTrackers && meta.hasTracker) return false;
  if (opts.domainQuery && !meta.domain.includes(opts.domainQuery.toLowerCase())) return false;
  if (opts.trackerQuery && !meta.tracker.includes(opts.trackerQuery.toLowerCase())) return false;
  return true;
}
