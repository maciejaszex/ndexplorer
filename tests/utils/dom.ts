// DOM helpers for log rendering/filtering tests (mirrors app.js logic).
// Requires happy-dom vitest environment.

export interface MockLog {
  timestamp: string;
  domain: string;
  root?: string;
  tracker?: string;
  protocol?: string;
  status: string;
  device?: { name?: string; model?: string };
}

export function escapeHtml(str: string) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function statusColor(status: string) {
  switch (status) {
    case 'blocked': return 'var(--status-blocked)';
    case 'allowed': return 'var(--status-allowed)';
    case 'error': return 'var(--status-error)';
    default: return 'var(--status-default)';
  }
}

export function shortenProtocol(protocol: string | undefined) {
  if (!protocol) return '—';
  return protocol
    .replace('DNS-over-HTTPS', 'DoH')
    .replace('DNS-over-TLS', 'DoT')
    .replace('DNS-over-QUIC', 'DoQ');
}

export function formatDate(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDomainWithRoot(domain: string, root?: string) {
  if (!root || !domain) return escapeHtml(domain || '—');
  const escaped = escapeHtml(domain);
  const escapedRoot = escapeHtml(root);
  const idx = escaped.lastIndexOf(escapedRoot);
  if (idx === -1) return escaped;
  const prefix = escaped.substring(0, idx);
  return `${prefix}<strong class="domain-root">${escapedRoot}</strong>`;
}

export function renderLogs(logs: MockLog[], container: HTMLElement) {
  logs.forEach((log) => {
    const row = document.createElement('div');
    row.className = 'log-row';
    row.dataset.hasTracker = log.tracker ? 'true' : 'false';
    row.dataset.domain = log.domain || '';
    row.dataset.tracker = log.tracker || '';

    const deviceName = log.device?.name || log.device?.model || '—';
    row.innerHTML = `
      <span>${formatDate(log.timestamp)}</span>
      <span>${formatDomainWithRoot(log.domain, log.root)}</span>
      <span>${escapeHtml(log.root || '—')}</span>
      <span>${escapeHtml(log.tracker || '—')}</span>
      <span>${escapeHtml(shortenProtocol(log.protocol))}</span>
      <span style="color: ${statusColor(log.status)}">${escapeHtml(log.status)}</span>
      <span>${escapeHtml(deviceName)}</span>
    `;
    container.appendChild(row);
  });
}

export function applyLocalFilters(
  container: HTMLElement,
  opts: { hideTrackers?: boolean; domainQuery?: string; trackerQuery?: string },
) {
  const rows = container.querySelectorAll('.log-row') as NodeListOf<HTMLDivElement>;
  let visible = 0;

  rows.forEach((row) => {
    const hasTracker = row.dataset.hasTracker === 'true';
    const domain = (row.dataset.domain || '').toLowerCase();
    const tracker = (row.dataset.tracker || '').toLowerCase();
    let show = true;

    if (opts.hideTrackers && hasTracker) show = false;
    if (show && opts.domainQuery && !domain.includes(opts.domainQuery.toLowerCase())) show = false;
    if (show && opts.trackerQuery && !tracker.includes(opts.trackerQuery.toLowerCase())) show = false;

    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  return visible;
}

export function visibleRows(container: HTMLElement) {
  return [...container.querySelectorAll('.log-row')]
    .filter((r) => (r as HTMLElement).style.display !== 'none');
}

export function hiddenRows(container: HTMLElement) {
  return [...container.querySelectorAll('.log-row')]
    .filter((r) => (r as HTMLElement).style.display === 'none');
}
