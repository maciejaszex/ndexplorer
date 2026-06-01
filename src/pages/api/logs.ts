/** GET /api/logs — Proxy to NextDNS logs API (read-only). */
import type { APIRoute } from 'astro';
import { fetchLogs, AppError } from '../../lib/nextdns';
import { parseLogsQuery } from '../../lib/validation';

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = parseLogsQuery(url.searchParams);
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: true, errorKey: 'error.invalidParam', detail: parsed.detail }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await fetchLogs(parsed.params);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (!(err instanceof AppError)) console.error('[api/logs]', err);
    const errorKey = err instanceof AppError ? err.code : 'error.unknown';
    // Only expose curated AppError details; never leak raw error messages.
    const detail = err instanceof AppError ? err.detail : undefined;
    return new Response(JSON.stringify({ error: true, errorKey, detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
