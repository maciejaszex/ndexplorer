// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import {
  escapeHtml,
  statusColor,
  shortenProtocol,
  formatDate,
  toLocalDatetimeValue,
  formatCountdown,
  formatDomainWithRoot,
  toCsvCell,
  buildCsv,
  getExportFilename,
  throttle,
  debounce,
  createLogRow,
  rowMeta,
  isLogVisible,
} from '../src/lib/logs';
import { MOCK_LOGS } from './utils/mocks';

describe('escapeHtml', () => {
  it('escapes HTML-significant characters and handles nullish input', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});

describe('statusColor', () => {
  it('maps each status to its CSS variable, default for unknown', () => {
    expect(statusColor('blocked')).toBe('var(--status-blocked)');
    expect(statusColor('allowed')).toBe('var(--status-allowed)');
    expect(statusColor('error')).toBe('var(--status-error)');
    expect(statusColor('default')).toBe('var(--status-default)');
    expect(statusColor('whatever')).toBe('var(--status-default)');
  });
});

describe('shortenProtocol', () => {
  it('shortens known protocols and dashes empty input', () => {
    expect(shortenProtocol('DNS-over-HTTPS')).toBe('DoH');
    expect(shortenProtocol('DNS-over-TLS')).toBe('DoT');
    expect(shortenProtocol('DNS-over-QUIC')).toBe('DoQ');
    expect(shortenProtocol('UDP')).toBe('UDP');
    expect(shortenProtocol(undefined)).toBe('—');
  });
});

describe('formatDate / toLocalDatetimeValue', () => {
  it('formats an ISO timestamp into local dd.mm.yyyy hh:mm:ss', () => {
    const out = formatDate('2026-02-11T08:12:03Z');
    expect(out).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/);
  });

  it('round-trips a datetime-local value (no seconds)', () => {
    const d = new Date(2026, 1, 11, 8, 12);
    expect(toLocalDatetimeValue(d)).toBe('2026-02-11T08:12');
  });

  it('returns a dash for an invalid timestamp instead of NaN.NaN.NaN', () => {
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('')).toBe('—');
  });
});

describe('formatCountdown', () => {
  it('shows seconds under a minute and m:ss otherwise', () => {
    expect(formatCountdown(45)).toBe('45s');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(90)).toBe('1:30');
    expect(formatCountdown(125)).toBe('2:05');
  });
});

describe('formatDomainWithRoot', () => {
  it('bolds the root and escapes the rest', () => {
    expect(formatDomainWithRoot('app.fake.xyz', 'fake.xyz'))
      .toBe('app.<strong class="domain-root">fake.xyz</strong>');
  });

  it('falls back gracefully when root missing or not found', () => {
    expect(formatDomainWithRoot('example.com', undefined)).toBe('example.com');
    expect(formatDomainWithRoot('example.com', 'absent.org')).toBe('example.com');
    expect(formatDomainWithRoot(undefined, 'x')).toBe('—');
  });
});

describe('toCsvCell — escaping & formula-injection guard', () => {
  it('quotes cells containing separators or newlines', () => {
    expect(toCsvCell('plain')).toBe('plain');
    expect(toCsvCell('a,b')).toBe('"a,b"');
    expect(toCsvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(toCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(toCsvCell(null)).toBe('');
    expect(toCsvCell(undefined)).toBe('');
    expect(toCsvCell(42)).toBe('42');
  });

  it('neutralizes leading =, +, -, @ to prevent CSV formula injection', () => {
    expect(toCsvCell('=1+1')).toBe("'=1+1");
    expect(toCsvCell('+CALL()')).toBe("'+CALL()");
    expect(toCsvCell('-2+3')).toBe("'-2+3");
    expect(toCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    // dangerous prefix + separator → both neutralized and quoted
    expect(toCsvCell('=HYPERLINK("a","b")')).toBe('"\'=HYPERLINK(""a"",""b"")"');
  });
});

describe('buildCsv', () => {
  it('builds a header row plus one row per log with reasons joined', () => {
    const csv = buildCsv([
      {
        timestamp: '2026-02-11T08:12:00Z',
        domain: 'app.fake.xyz',
        root: 'fake.xyz',
        tracker: 'FakeTracker',
        protocol: 'DNS-over-HTTPS',
        status: 'blocked',
        device: { id: 'd1', name: 'DEVICE_1' },
        reasons: [{ id: 'r1', name: 'blocklist' }, { id: 'r2' }],
      },
    ]);
    const lines = csv.trimEnd().split('\n');
    expect(lines[0]).toBe(
      'timestamp,domain,root,tracker,encrypted,protocol,clientIp,client,deviceId,deviceName,deviceModel,status,reasons',
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('app.fake.xyz');
    expect(lines[1]).toContain('blocklist; r2');
    expect(csv.endsWith('\n')).toBe(true);
  });

  it('renders an empty body for no logs', () => {
    const csv = buildCsv([]);
    expect(csv.trimEnd().split('\n')).toHaveLength(1);
  });
});

describe('getExportFilename', () => {
  it('sanitizes device id and timestamps into a safe filename', () => {
    const name = getExportFilename('dev/1:abc', '2026-02-11T08:12:00.000Z', '2026-02-12T08:12:00.000Z');
    expect(name).toBe('ndexplorer-logs-dev_1_abc-2026-02-11T08-12-00-000Z-to-2026-02-12T08-12-00-000Z.csv');
  });

  it('falls back to "device" when id empty', () => {
    expect(getExportFilename('', '2026-02-11T08-12', '2026-02-11T09-12')).toContain('-device-');
  });
});

describe('throttle', () => {
  it('runs immediately then collapses bursts within the window', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1); // leading call
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2); // trailing call
    vi.useRealTimers();
  });
});

describe('debounce', () => {
  it('only fires once after the quiet period', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 150);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('createLogRow', () => {
  it('produces a .log-row with dataset metadata and shortened protocol', () => {
    const row = createLogRow(MOCK_LOGS[0]);
    expect(row.classList.contains('log-row')).toBe(true);
    expect(row.dataset.hasTracker).toBe('true');
    expect(row.dataset.domain).toBe('app.fake-analytics.xyz');
    expect(row.innerHTML).toContain('DoH');
    expect(row.innerHTML).toContain('var(--status-blocked)');
    expect(row.innerHTML).toContain('<strong class="domain-root">fake-analytics.xyz</strong>');
    expect(row.innerHTML).toContain('DEVICE_1');
  });

  it('marks tracker-less rows and falls back to a dash device', () => {
    const row = createLogRow({ timestamp: '2026-02-11T08:00:00Z', domain: 'a.test', status: 'default' });
    expect(row.dataset.hasTracker).toBe('false');
    expect(row.innerHTML).toContain('—');
  });
});

describe('rowMeta / isLogVisible', () => {
  it('derives lowercase metadata', () => {
    expect(rowMeta({ timestamp: 't', domain: 'A.TEST', tracker: 'Foo', status: 'x' }))
      .toEqual({ hasTracker: true, domain: 'a.test', tracker: 'foo' });
  });

  it('applies hideTrackers, domain and tracker filters (case-insensitive)', () => {
    const tracked = { hasTracker: true, domain: 'ads.evil.com', tracker: 'eviltracker' };
    const clean = { hasTracker: false, domain: 'mail.safe.test', tracker: '' };

    expect(isLogVisible(tracked, { hideTrackers: true })).toBe(false);
    expect(isLogVisible(clean, { hideTrackers: true })).toBe(true);
    expect(isLogVisible(tracked, { domainQuery: 'EVIL' })).toBe(true);
    expect(isLogVisible(clean, { domainQuery: 'evil' })).toBe(false);
    expect(isLogVisible(tracked, { trackerQuery: 'TRACKER' })).toBe(true);
    expect(isLogVisible(clean, { trackerQuery: 'tracker' })).toBe(false);
    expect(isLogVisible(clean, {})).toBe(true);
  });
});
