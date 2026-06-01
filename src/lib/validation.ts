/**
 * NDEXPLORER — request validation for the logs proxy.
 * Pure functions, no I/O — easy to unit test and shared by the API route.
 */

export const VALID_STATUSES = new Set(['default', 'blocked', 'allowed', 'error']);

// ISO 8601 date or date-time (the client always sends `Date#toISOString()`).
// Stricter than a bare `Date.parse`, which would accept things like "1" or "May".
const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// NextDNS device ids are short alphanumeric tokens; `__UNIDENTIFIED__` is special.
const DEVICE_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function isISODate(v: string): boolean {
  return ISO_RE.test(v) && !Number.isNaN(Date.parse(v));
}

export function isValidDeviceId(v: string): boolean {
  return DEVICE_RE.test(v);
}

export interface LogsQuery {
  from?: string;
  to?: string;
  status?: string;
  device?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

export type LogsQueryResult =
  | { ok: true; params: LogsQuery }
  | { ok: false; detail: string };

/**
 * Validate and normalize the `/api/logs` query string.
 * Returns either the parsed params or the name of the first invalid field.
 */
export function parseLogsQuery(searchParams: URLSearchParams): LogsQueryResult {
  const rawStatus = searchParams.get('status') || undefined;
  const rawFrom = searchParams.get('from') || undefined;
  const rawTo = searchParams.get('to') || undefined;
  const rawSearch = searchParams.get('search') || undefined;
  const rawDevice = searchParams.get('device') || undefined;
  const rawLimit = searchParams.get('limit');
  const parsedLimit = rawLimit ? parseInt(rawLimit, 10) : undefined;

  if (rawStatus && !VALID_STATUSES.has(rawStatus)) return { ok: false, detail: 'status' };
  if (rawFrom && !isISODate(rawFrom)) return { ok: false, detail: 'from' };
  if (rawTo && !isISODate(rawTo)) return { ok: false, detail: 'to' };
  if (rawDevice && !isValidDeviceId(rawDevice)) return { ok: false, detail: 'device' };
  if (rawLimit && (!Number.isInteger(parsedLimit) || parsedLimit! < 10 || parsedLimit! > 1000)) {
    return { ok: false, detail: 'limit' };
  }

  return {
    ok: true,
    params: {
      from: rawFrom,
      to: rawTo,
      status: rawStatus,
      device: rawDevice,
      search: rawSearch?.trim() || undefined,
      limit: parsedLimit,
      cursor: searchParams.get('cursor') || undefined,
    },
  };
}
