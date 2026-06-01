import { describe, it, expect } from 'vitest';
import {
  VALID_STATUSES,
  isISODate,
  isValidDeviceId,
  parseLogsQuery,
} from '../src/lib/validation';

const q = (s: string) => new URLSearchParams(s);

describe('VALID_STATUSES', () => {
  it('contains exactly the four NextDNS statuses', () => {
    expect([...VALID_STATUSES].sort()).toEqual(['allowed', 'blocked', 'default', 'error']);
  });
});

describe('isISODate', () => {
  it('accepts ISO dates and date-times', () => {
    expect(isISODate('2026-02-11')).toBe(true);
    expect(isISODate('2026-02-11T08:00')).toBe(true);
    expect(isISODate('2026-02-11T08:00:00.000Z')).toBe(true);
    expect(isISODate('2026-02-11T08:00:00+02:00')).toBe(true);
  });

  it('rejects lenient / garbage values that bare Date.parse would accept', () => {
    expect(isISODate('1')).toBe(false);
    expect(isISODate('May 5 2026')).toBe(false);
    expect(isISODate('garbage')).toBe(false);
    expect(isISODate('2026-13-99')).toBe(false); // matches shape but not a real date
  });
});

describe('isValidDeviceId', () => {
  it('accepts short alphanumeric ids and the special unidentified token', () => {
    expect(isValidDeviceId('abc123')).toBe(true);
    expect(isValidDeviceId('a-b_c')).toBe(true);
    expect(isValidDeviceId('__UNIDENTIFIED__')).toBe(true);
  });

  it('rejects empty, spaced, over-long or path-like values', () => {
    expect(isValidDeviceId('')).toBe(false);
    expect(isValidDeviceId('has space')).toBe(false);
    expect(isValidDeviceId('../etc/passwd')).toBe(false);
    expect(isValidDeviceId('a'.repeat(65))).toBe(false);
  });
});

describe('parseLogsQuery', () => {
  it('parses and normalizes a full valid query', () => {
    const res = parseLogsQuery(q(
      'from=2026-02-11T08:00:00.000Z&to=2026-02-12T08:00:00.000Z'
      + '&status=blocked&device=dev-1&search=%20%20facebook%20%20&limit=50&cursor=CUR',
    ));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.params).toEqual({
      from: '2026-02-11T08:00:00.000Z',
      to: '2026-02-12T08:00:00.000Z',
      status: 'blocked',
      device: 'dev-1',
      search: 'facebook', // trimmed
      limit: 50,
      cursor: 'CUR',
    });
  });

  it('returns all-undefined params for an empty query', () => {
    const res = parseLogsQuery(q(''));
    expect(res).toEqual({
      ok: true,
      params: {
        from: undefined,
        to: undefined,
        status: undefined,
        device: undefined,
        search: undefined,
        limit: undefined,
        cursor: undefined,
      },
    });
  });

  it('drops a whitespace-only search', () => {
    const res = parseLogsQuery(q('search=%20%20%20'));
    expect(res.ok && res.params.search).toBeUndefined();
  });

  it('rejects an invalid status', () => {
    expect(parseLogsQuery(q('status=nope'))).toEqual({ ok: false, detail: 'status' });
  });

  it('rejects invalid from / to dates', () => {
    expect(parseLogsQuery(q('from=1'))).toEqual({ ok: false, detail: 'from' });
    expect(parseLogsQuery(q('to=garbage'))).toEqual({ ok: false, detail: 'to' });
  });

  it('rejects an invalid device id', () => {
    expect(parseLogsQuery(q('device=bad%20id'))).toEqual({ ok: false, detail: 'device' });
  });

  it('rejects out-of-range or non-integer limits, accepts in-range', () => {
    expect(parseLogsQuery(q('limit=5'))).toEqual({ ok: false, detail: 'limit' });
    expect(parseLogsQuery(q('limit=2000'))).toEqual({ ok: false, detail: 'limit' });
    expect(parseLogsQuery(q('limit=abc'))).toEqual({ ok: false, detail: 'limit' });
    const ok = parseLogsQuery(q('limit=500'));
    expect(ok.ok && ok.params.limit).toBe(500);
  });
});
