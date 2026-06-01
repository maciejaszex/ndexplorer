import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDevices, fetchLogs, AppError } from '../src/lib/nextdns';

function mockFetch(ok: boolean, body: unknown, status = ok ? 200 : 500) {
  const calls: string[] = [];
  const inits: Array<RequestInit | undefined> = [];
  const fn = vi.fn(async (...args: [string, RequestInit?]) => {
    calls.push(args[0]);
    inits.push(args[1]);
    return {
      ok,
      status,
      json: async () => body,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    };
  });
  vi.stubGlobal('fetch', fn);
  return { fn, calls, inits };
}

beforeEach(() => {
  vi.stubEnv('NEXTDNS_API_KEY', 'test-key');
  vi.stubEnv('NEXTDNS_PROFILE_ID', 'abc123');
  vi.stubEnv('NEXTDNS_LOGS_LIMIT', '200');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('config validation', () => {
  it('throws AppError(error.configMissing) when key or profile is absent', async () => {
    vi.stubEnv('NEXTDNS_API_KEY', '');
    mockFetch(true, { data: [] });
    await expect(fetchDevices()).rejects.toBeInstanceOf(AppError);
    await expect(fetchDevices()).rejects.toMatchObject({ code: 'error.configMissing' });
  });
});

describe('fetchDevices', () => {
  it('calls the analytics/devices endpoint with the API key header', async () => {
    const { calls, inits } = mockFetch(true, { data: [{ id: 'd1' }] });
    const res = await fetchDevices();

    expect(calls[0]).toBe('https://api.nextdns.io/profiles/abc123/analytics/devices');
    const opts = inits[0] as RequestInit;
    expect(opts.method).toBe('GET');
    expect((opts.headers as Record<string, string>)['X-Api-Key']).toBe('test-key');
    expect(res).toEqual({ data: [{ id: 'd1' }] });
  });

  it('throws AppError(error.apiError) with status (not body) on non-OK response', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(false, 'secret upstream body', 429);
    await expect(fetchDevices()).rejects.toMatchObject({ code: 'error.apiError', detail: '429' });
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('fetchLogs', () => {
  it('builds the logs URL with all provided params encoded', async () => {
    const { calls } = mockFetch(true, { data: [] });
    await fetchLogs({
      from: '2026-02-11T08:00:00.000Z',
      to: '2026-02-12T08:00:00.000Z',
      status: 'blocked',
      device: 'dev-1',
      search: 'facebook',
      cursor: 'CUR',
      limit: 50,
    });

    const url = new URL(calls[0]);
    expect(url.pathname).toBe('/profiles/abc123/logs');
    expect(url.searchParams.get('raw')).toBe('1');
    expect(url.searchParams.get('sort')).toBe('desc');
    expect(url.searchParams.get('limit')).toBe('50');
    expect(url.searchParams.get('from')).toBe('2026-02-11T08:00:00.000Z');
    expect(url.searchParams.get('to')).toBe('2026-02-12T08:00:00.000Z');
    expect(url.searchParams.get('status')).toBe('blocked');
    expect(url.searchParams.get('device')).toBe('dev-1');
    expect(url.searchParams.get('search')).toBe('facebook');
    expect(url.searchParams.get('cursor')).toBe('CUR');
  });

  it('omits optional params and uses the configured default limit', async () => {
    const { calls } = mockFetch(true, { data: [] });
    await fetchLogs({});
    const url = new URL(calls[0]);
    expect(url.searchParams.get('limit')).toBe('200');
    expect(url.searchParams.has('status')).toBe(false);
    expect(url.searchParams.has('cursor')).toBe(false);
  });

  it('clamps the configured limit into the 10–1000 range', async () => {
    vi.stubEnv('NEXTDNS_LOGS_LIMIT', '5');
    let res = mockFetch(true, { data: [] });
    await fetchLogs({});
    expect(new URL(res.calls[0]).searchParams.get('limit')).toBe('10');

    vi.stubEnv('NEXTDNS_LOGS_LIMIT', '99999');
    res = mockFetch(true, { data: [] });
    await fetchLogs({});
    expect(new URL(res.calls[0]).searchParams.get('limit')).toBe('1000');

    vi.stubEnv('NEXTDNS_LOGS_LIMIT', 'not-a-number');
    res = mockFetch(true, { data: [] });
    await fetchLogs({});
    expect(new URL(res.calls[0]).searchParams.get('limit')).toBe('200');
  });

  it('propagates AppError(error.apiError) on non-OK response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(false, 'nope', 503);
    await expect(fetchLogs({})).rejects.toMatchObject({ code: 'error.apiError', detail: '503' });
  });
});
