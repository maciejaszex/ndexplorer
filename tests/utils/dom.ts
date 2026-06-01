// Thin DOM adapter over the REAL production logic in src/lib/logs.ts.
// (Previously this file re-implemented app.js logic, which meant tests never
// exercised the shipped code. It now delegates to the shared module.)
// Requires happy-dom vitest environment.

import { createLogRow, isLogVisible, rowMeta, type LogLike } from '../../src/lib/logs';

export type MockLog = LogLike;

export {
  escapeHtml,
  statusColor,
  shortenProtocol,
  formatDate,
  formatDomainWithRoot,
} from '../../src/lib/logs';

export function renderLogs(logs: MockLog[], container: HTMLElement) {
  logs.forEach((log) => container.appendChild(createLogRow(log)));
}

export function applyLocalFilters(
  container: HTMLElement,
  opts: { hideTrackers?: boolean; domainQuery?: string; trackerQuery?: string },
) {
  const rows = container.querySelectorAll('.log-row') as NodeListOf<HTMLDivElement>;
  let visible = 0;

  rows.forEach((row) => {
    const meta = {
      hasTracker: row.dataset.hasTracker === 'true',
      domain: (row.dataset.domain || '').toLowerCase(),
      tracker: (row.dataset.tracker || '').toLowerCase(),
    };
    const show = isLogVisible(meta, opts);
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

export { rowMeta };
