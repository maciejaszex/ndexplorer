/**
 * NextDNS API client — server-side only, READ-ONLY (GET requests only).
 * Docs: https://nextdns.github.io/api/
 */

const API_BASE = 'https://api.nextdns.io';

export class AppError extends Error {
  code: string;
  detail?: string;
  constructor(code: string, detail?: string) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

function getConfig() {
  const apiKey = process.env.NEXTDNS_API_KEY || import.meta.env.NEXTDNS_API_KEY;
  const profileId = process.env.NEXTDNS_PROFILE_ID || import.meta.env.NEXTDNS_PROFILE_ID;
  const logsLimit = process.env.NEXTDNS_LOGS_LIMIT || import.meta.env.NEXTDNS_LOGS_LIMIT || '200';

  if (!apiKey || !profileId) {
    throw new AppError('error.configMissing');
  }

  const limit = Math.max(10, Math.min(1000, parseInt(logsLimit, 10) || 200));

  return { apiKey, profileId, limit };
}

function getHeaders(apiKey: string): HeadersInit {
  return {
    'X-Api-Key': apiKey,
    'Accept': 'application/json',
  };
}

// ─── Devices ────────────────────────────────────────────────────────────────

export interface Device {
  id: string;
  name?: string;
  model?: string;
  localIp?: string;
  queries?: number;
}

export interface DevicesResponse {
  data: Device[];
}

export async function fetchDevices(): Promise<DevicesResponse> {
  const { apiKey, profileId } = getConfig();
  const url = `${API_BASE}/profiles/${profileId}/analytics/devices`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AppError('error.apiError', `${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Logs ───────────────────────────────────────────────────────────────────

export interface LogDevice {
  id: string;
  name?: string;
  model?: string;
}

export interface LogEntry {
  timestamp: string;
  domain: string;
  root?: string;
  tracker?: string;
  encrypted?: boolean;
  protocol?: string;
  clientIp?: string;
  client?: string;
  device?: LogDevice;
  status: string;
  reasons?: Array<{ id: string; name: string }>;
}

export interface LogsResponse {
  data: LogEntry[];
  meta?: {
    pagination?: {
      cursor: string | null;
    };
  };
}

export interface LogsParams {
  from?: string;
  to?: string;
  status?: string;
  device?: string;
  cursor?: string;
}

export async function fetchLogs(params: LogsParams): Promise<LogsResponse> {
  const { apiKey, profileId, limit } = getConfig();
  const url = new URL(`${API_BASE}/profiles/${profileId}/logs`);

  url.searchParams.set('raw', '1');
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('limit', String(limit));

  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.device) url.searchParams.set('device', params.device);
  if (params.cursor) url.searchParams.set('cursor', params.cursor);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AppError('error.apiError', `${res.status}: ${text}`);
  }

  return res.json();
}
