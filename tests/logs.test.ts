// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { MOCK_LOGS } from './utils/mocks';
import { renderLogs, applyLocalFilters, visibleRows, hiddenRows } from './utils/dom';

let logsList: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = '<div id="logs-list"></div>';
  logsList = document.querySelector('#logs-list') as HTMLDivElement;
});

describe('Log rendering', () => {
  it('renders all rows with correct data attributes, protocols, statuses and bold roots', () => {
    renderLogs(MOCK_LOGS, logsList);

    const rows = logsList.querySelectorAll('.log-row');
    expect(rows).toHaveLength(MOCK_LOGS.length);

    const withTracker = [...rows].filter((r) => (r as HTMLElement).dataset.hasTracker === 'true');
    expect(withTracker).toHaveLength(MOCK_LOGS.filter((l) => !!l.tracker).length);

    const html = logsList.innerHTML;
    expect(html).toContain('DoH');
    expect(html).toContain('DoT');
    expect(html).toContain('DoQ');
    expect(html).not.toContain('DNS-over-HTTPS');

    expect(html).toContain('var(--status-blocked)');
    expect(html).toContain('var(--status-allowed)');
    expect(html).toContain('var(--status-error)');
    expect(html).toContain('var(--status-default)');

    expect(html).toContain(
      '<strong class="domain-root">fake-analytics.xyz</strong>',
    );
  });

  it('renders nothing for an empty log array', () => {
    renderLogs([], logsList);
    expect(logsList.querySelectorAll('.log-row')).toHaveLength(0);
    expect(logsList.innerHTML).toBe('');
  });

  it('shows device name with fallback to model then dash', () => {
    renderLogs(MOCK_LOGS, logsList);
    const html = logsList.innerHTML;

    expect(html).toContain('DEVICE_1');
    expect(html).toContain('DEVICE_2');
    // No real device names leaked
    expect(html).not.toContain('iPhone');
    expect(html).not.toContain('MacBook');
  });
});

describe('Domain filter', () => {
  it('shows only rows matching domain query and restores all when cleared', () => {
    renderLogs(MOCK_LOGS, logsList);

    const countFake = applyLocalFilters(logsList, { domainQuery: 'fake' });
    expect(countFake).toBeGreaterThan(0);
    visibleRows(logsList).forEach((r) => {
      expect((r as HTMLElement).dataset.domain).toMatch(/fake/i);
    });

    const countSafe = applyLocalFilters(logsList, { domainQuery: 'safemail' });
    expect(countSafe).toBe(1);

    const countAll = applyLocalFilters(logsList, {});
    expect(countAll).toBe(MOCK_LOGS.length);
    expect(hiddenRows(logsList)).toHaveLength(0);
  });

  it('returns zero for a query that matches nothing', () => {
    renderLogs(MOCK_LOGS, logsList);
    const count = applyLocalFilters(logsList, { domainQuery: 'zzz-nonexistent-zzz' });
    expect(count).toBe(0);
    expect(visibleRows(logsList)).toHaveLength(0);
  });
});

describe('Tracker toggle + search', () => {
  it('hides/shows tracker rows and filters by tracker name', () => {
    renderLogs(MOCK_LOGS, logsList);

    const trackered = MOCK_LOGS.filter((l) => !!l.tracker).length;
    const clean = MOCK_LOGS.length - trackered;

    // Hide trackers
    const countHidden = applyLocalFilters(logsList, { hideTrackers: true });
    expect(countHidden).toBe(clean);
    expect(hiddenRows(logsList)).toHaveLength(trackered);
    visibleRows(logsList).forEach((r) => {
      expect((r as HTMLElement).dataset.hasTracker).toBe('false');
    });

    // Show trackers again
    const countAll = applyLocalFilters(logsList, { hideTrackers: false });
    expect(countAll).toBe(MOCK_LOGS.length);

    // Search by tracker name
    const countSneaky = applyLocalFilters(logsList, { trackerQuery: 'sneaky' });
    expect(countSneaky).toBe(1);
    expect((visibleRows(logsList)[0] as HTMLElement).dataset.tracker).toBe('SneakyCorp');
  });

  it('combines domain filter, tracker toggle and tracker search', () => {
    renderLogs(MOCK_LOGS, logsList);

    // Hide trackers + filter domain by ".test" → only clean .test domains
    const count = applyLocalFilters(logsList, { hideTrackers: true, domainQuery: '.test' });
    expect(count).toBeGreaterThan(0);
    visibleRows(logsList).forEach((r) => {
      const el = r as HTMLElement;
      expect(el.dataset.hasTracker).toBe('false');
      expect(el.dataset.domain).toMatch(/\.test/);
    });

    // Show trackers + search tracker "DataSlurp" → exactly 1
    const countDs = applyLocalFilters(logsList, { trackerQuery: 'dataslurp' });
    expect(countDs).toBe(1);
  });
});
