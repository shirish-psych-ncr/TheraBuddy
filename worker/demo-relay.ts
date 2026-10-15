// Aasha DEMO SYNC RELAY — a separate, deliberately minimal Cloudflare Worker.
//
// Purpose: let one person mirror their SYNTHETIC demo workspace between their
// own devices when the main app is hosted on a static origin (GitHub Pages)
// with no same-origin API. Store: Workers KV Free namespace.
//
// SECURITY BOUNDARY (read before deploying):
// - This relay is NOT part of the clinical/staff authorization system. It must
//   never receive real patient information. The main app only sends data here
//   when the user explicitly enables the demo relay in Settings.
// - Authorization is a shared secret compared with constant time. Anyone with
//   the endpoint URL and key can read/write that slot; anyone with the URL but
//   without a valid random slot id cannot enumerate other slots (404).
// - Records are version-checked so an older device can never silently
//   overwrite a newer copy, and size-capped so the store cannot be abused.
// - No credentials or configuration live in this file; everything comes from
//   environment variables set at deploy time.
//
// Environment: SYNC_KEY (string secret), BINDINGS: KV namespace as `SLOTS`.

export interface Env {
  SYNC_KEY?: string;
  SLOTS: KVNamespace;
}

const MAX_BODY_BYTES = 1_500_000; // KV value limit is 25 MiB; demo workspaces are tiny
const SLOT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      // The static GitHub Pages origin has no same-origin API; this relay is
      // intentionally readable by any https site the user opens the app from,
      // gated by the X-Sync-Key header. Slot ids are unguessable path segments.
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, x-sync-key',
      'access-control-allow-methods': 'GET, PUT, OPTIONS',
      'access-control-max-age': '600',
      'x-content-type-options': 'nosniff',
    },
  });
}

interface StoredRecord {
  revision: number;
  updatedAt: string;
  payload: unknown;
}

function validShape(value: unknown): value is StoredRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.revision === 'number' &&
    Number.isInteger(record.revision) &&
    record.revision >= 0 &&
    typeof record.updatedAt === 'string' &&
    typeof record.payload === 'object' &&
    record.payload !== null
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return json({ ok: true });
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const slot = parts.pop() ?? '';
    if (!SLOT_PATTERN.test(slot)) return json({ error: 'not found' }, 404);

    // Shared-secret gate. If SYNC_KEY is unset the relay refuses all traffic
    // rather than running open — fail closed.
    if (!env.SYNC_KEY) return json({ error: 'relay not configured' }, 503);
    const key = request.headers.get('X-Sync-Key') ?? '';
    if (!timingSafeEqual(key, env.SYNC_KEY)) return json({ error: 'unauthorized' }, 401);

    if (request.method === 'GET') {
      const stored = await env.SLOTS.get(slot);
      if (!stored) return json({ error: 'empty slot' }, 404);
      return new Response(stored, {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }

    if (request.method === 'PUT') {
      const contentLength = Number(request.headers.get('content-length') ?? '0');
      if (contentLength > MAX_BODY_BYTES) return json({ error: 'payload too large' }, 413);
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return json({ error: 'payload too large' }, 413);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return json({ error: 'invalid JSON' }, 400);
      }
      if (!validShape(parsed)) return json({ error: 'invalid record shape' }, 400);

      const existingRaw = await env.SLOTS.get(slot);
      if (existingRaw) {
        let existing: unknown;
        try {
          existing = JSON.parse(existingRaw);
        } catch {
          existing = null;
        }
        // Reject stale overwrites from an offline device coming back late.
        if (validShape(existing) && parsed.revision <= existing.revision) {
          return json({ error: 'stale revision', remoteRevision: existing.revision }, 409);
        }
      }
      await env.SLOTS.put(slot, text, { expirationTtl: 60 * 60 * 24 * 90 }); // demo data expires after 90 days
      return json({ ok: true, revision: parsed.revision });
    }

    return json({ error: 'method not allowed' }, 405);
  },
} satisfies ExportedHandler<Env>;
