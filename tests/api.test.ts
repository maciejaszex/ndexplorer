import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as logsGET } from '../src/pages/api/logs';
import { GET as devicesGET } from '../src/pages/api/devices';

type RouteFn = (ctx: { url: URL }) => Promise<Response>;
const logs = logsGET as unknown as RouteFn;
const devices = devicesGET as unknown as RouteFn;

function call(fn: RouteFn, query = '') {
  return fn({ url: new URL(`http://localhost/api?${query}`) });
}

function mockFetch(ok: boolean, body: unknown, status = ok ? 200 : 500) {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  })));
}

beforeEach(() => {
  vi.stubEnv('NEXTDNS_API_KEY', 'test-key');
  vi.stubEnv('NEXTDNS_PROFILE_ID', 'abc123');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/logs — validation', () => {
  it('rejects bad params with 400 and the offending field name', async () => {
    for (const [query, field] of [
      ['status=nope', 'status'],
      ['from=1', 'from'],
      ['to=garbage', 'to'],
      ['device=bad%20id', 'device'],
      ['limit=5', 'limit'],
    ] as const) {
      const res = await call(logs, query);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toMatchObject({ error: true, errorKey: 'error.invalidParam', detail: field });
    }
  });

  it('returns 200 with upstream data for a valid request', async () => {
    mockFetch(true, { data: [{ timestamp: 't', domain: 'a.test', status: 'default' }], meta: {} });
    const res = await call(logs, 'status=blocked&limit=50');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
  });
});

describe('GET /api/logs — error handling does not leak upstream body', () => {
  it('maps a non-OK upstream response to 500 with only the status code', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(false, 'TOP_SECRET_UPSTREAM_BODY', 503);

    const res = await call(logs, '');
    expect(res.status).toBe(500);
    const raw = await res.text();
    expect(raw).not.toContain('TOP_SECRET_UPSTREAM_BODY');

    const json = JSON.parse(raw);
    expect(json).toMatchObject({ error: true, errorKey: 'error.apiError', detail: '503' });
    expect(errSpy).toHaveBeenCalled();
  });

  it('reports missing config without leaking internals', async () => {
    vi.stubEnv('NEXTDNS_API_KEY', '');
    const res = await call(logs, '');
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.errorKey).toBe('error.configMissing');
  });
});

describe('GET /api/devices', () => {
  it('returns 200 with device data on success', async () => {
    mockFetch(true, { data: [{ id: 'd1', name: 'DEVICE_1' }] });
    const res = await call(devices);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].id).toBe('d1');
  });

  it('maps upstream failure to 500 without leaking the body', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(false, 'ANOTHER_SECRET', 429);
    const res = await call(devices);
    expect(res.status).toBe(500);
    const raw = await res.text();
    expect(raw).not.toContain('ANOTHER_SECRET');
    expect(JSON.parse(raw)).toMatchObject({ errorKey: 'error.apiError', detail: '429' });
  });
});
