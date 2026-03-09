/** GET /api/logs — Proxy to NextDNS logs API (read-only). */
import type { APIRoute } from 'astro';
import { fetchLogs, AppError } from '../../lib/nextdns';

const VALID_STATUSES = new Set(['default', 'blocked', 'allowed', 'error']);

function isISODate(v: string): boolean {
  return !isNaN(Date.parse(v));
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const rawStatus = url.searchParams.get('status') || undefined;
    const rawFrom = url.searchParams.get('from') || undefined;
    const rawTo = url.searchParams.get('to') || undefined;
    const rawSearch = url.searchParams.get('search') || undefined;
    const rawLimit = url.searchParams.get('limit');
    const parsedLimit = rawLimit ? parseInt(rawLimit, 10) : undefined;

    if (rawStatus && !VALID_STATUSES.has(rawStatus)) {
      return new Response(JSON.stringify({ error: true, errorKey: 'error.invalidParam', detail: 'status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (rawFrom && !isISODate(rawFrom)) {
      return new Response(JSON.stringify({ error: true, errorKey: 'error.invalidParam', detail: 'from' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (rawTo && !isISODate(rawTo)) {
      return new Response(JSON.stringify({ error: true, errorKey: 'error.invalidParam', detail: 'to' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (rawLimit && (!Number.isInteger(parsedLimit) || parsedLimit < 10 || parsedLimit > 1000)) {
      return new Response(JSON.stringify({ error: true, errorKey: 'error.invalidParam', detail: 'limit' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = {
      from: rawFrom,
      to: rawTo,
      status: rawStatus,
      device: url.searchParams.get('device') || undefined,
      search: rawSearch?.trim() || undefined,
      limit: parsedLimit,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    const result = await fetchLogs(params);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorKey = err instanceof AppError ? err.code : 'error.unknown';
    const detail = err instanceof AppError ? err.detail : (err instanceof Error ? err.message : '');
    return new Response(JSON.stringify({ error: true, errorKey, detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
