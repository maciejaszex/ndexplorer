/** GET /api/logs — Proxy to NextDNS logs API (read-only). */
import type { APIRoute } from 'astro';
import { fetchLogs, AppError } from '../../lib/nextdns';

export const GET: APIRoute = async ({ url }) => {
  try {
    const params = {
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      status: url.searchParams.get('status') || undefined,
      device: url.searchParams.get('device') || undefined,
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
