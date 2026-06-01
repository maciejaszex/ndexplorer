/** GET /api/devices — Proxy to NextDNS devices API (read-only). */
import type { APIRoute } from 'astro';
import { fetchDevices, AppError } from '../../lib/nextdns';

export const GET: APIRoute = async () => {
  try {
    const result = await fetchDevices();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (!(err instanceof AppError)) console.error('[api/devices]', err);
    const errorKey = err instanceof AppError ? err.code : 'error.unknown';
    // Only expose curated AppError details; never leak raw error messages.
    const detail = err instanceof AppError ? err.detail : undefined;
    return new Response(JSON.stringify({ error: true, errorKey, detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
