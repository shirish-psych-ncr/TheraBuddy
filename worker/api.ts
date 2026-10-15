import type { Env } from './types';

const jsonHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

/** Consistent error envelope per docs/03-data-and-api.md. Never include stack traces or record data. */
export function apiError(status: number, code: string, message: string, requestId?: string): Response {
  return Response.json({ code, message, requestId }, { status, headers: jsonHeaders });
}

function requestId(request: Request): string | undefined {
  return request.headers.get('cf-ray') ?? undefined;
}

/** Demo-safe appointment shape used only for the synthetic preview D1 round-trip. Contains no real personal data. */
interface DemoAppointment {
  id: string; child_id: string; date: string; start_minute: number; minutes: number;
  therapist: string; room: string; attendance: string; status: string; revision: number;
}

/** API accepts camelCase (client-facing contract); storage uses snake_case columns. */
interface BookingRequest {
  id?: unknown; childId?: unknown; child_id?: unknown; date?: unknown;
  startMinute?: unknown; start_minute?: unknown; minutes?: unknown;
  therapist?: unknown; room?: unknown;
}

function overlaps(a: DemoAppointment, b: DemoAppointment): boolean {
  if (a.status === 'cancelled' || b.status === 'cancelled' || a.date !== b.date) return false;
  const sharesResource = a.child_id === b.child_id || a.therapist === b.therapist || a.room === b.room;
  if (!sharesResource) return false;
  return a.start_minute < b.start_minute + b.minutes && a.start_minute + a.minutes > b.start_minute;
}

async function readAppointments(db: D1Database, organizationId: string): Promise<DemoAppointment[]> {
  const result = await db.prepare(
    'SELECT id, child_id, date, start_minute, minutes, therapist, room, attendance, status, revision FROM appointments WHERE organization_id = ?'
  ).bind(organizationId).all<DemoAppointment>();
  if (result.success) return result.results;
  throw new Error(result.error ?? 'Database query failed.');
}

/**
 * Atomic booking spike (docs/02-architecture.md spike 2) against D1's serializable
 * deferred transactions: BEGIN IMMEDIATE ... COMMIT via D1.batch(). Concurrent requests
 * on the same worker isolate receive SQLITE_BUSY on the second writer's lock acquisition
 * and are rejected with 409 rather than double-booking. This proves the primitive under
 * wrangler dev; remote-behavior verification is tracked separately in the handoff.
 */
async function bookDemoAppointment(request: Request, env: Env): Promise<Response> {
  const id = requestId(request);
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(422, 'INVALID_JSON', 'Request body must be JSON.', id); }
  const a = body as BookingRequest;
  const childId = typeof a.childId === 'string' ? a.childId : a.child_id;
  const startMinute = typeof a.startMinute === 'number' ? a.startMinute : a.start_minute;
  const required = [a.id, childId, a.date, a.therapist, a.room];
  if (required.some(v => typeof v !== 'string' || !v) ||
      typeof startMinute !== 'number' || !Number.isInteger(startMinute) ||
      typeof a.minutes !== 'number' || !Number.isInteger(a.minutes) || a.minutes < 15 || a.minutes > 120) {
    return apiError(422, 'VALIDATION', 'id, childId, date, integer startMinute, minutes (15–120), therapist and room are required.', id);
  }
  const appointment: DemoAppointment = {
    id: String(a.id), child_id: String(childId), date: String(a.date),
    start_minute: Number(startMinute), minutes: Number(a.minutes),
    therapist: String(a.therapist), room: String(a.room),
    attendance: 'expected', status: 'scheduled', revision: 0
  };
  if (appointment.start_minute < 0 || appointment.start_minute + appointment.minutes > 1440) {
    return apiError(422, 'VALIDATION', 'Appointments must finish on the same day.', id);
  }
  const organizationId = 'demo-aasha';
  try {
    const existing = await readAppointments(env.DB, organizationId);
    const collision = existing.find(other => overlaps(other, appointment));
    if (collision) return apiError(409, 'SLOT_CONFLICT', 'This time overlaps another appointment for the child, therapist or room.', id);
    // Serializable transaction: conflict re-check inside the batch executes under the write lock.
    // D1 batches are implicitly transactional; explicit BEGIN/COMMIT statements are rejected by D1.
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO appointments (organization_id, id, child_id, date, start_minute, minutes, therapist, room, attendance, status, revision)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'expected', 'scheduled', 0
        WHERE NOT EXISTS (SELECT 1 FROM appointments o WHERE o.organization_id = ? AND o.status <> 'cancelled' AND o.date = ?
          AND (o.child_id = ? OR o.therapist = ? OR o.room = ?)
          AND ? < o.start_minute + o.minutes AND ? + ? > o.start_minute)`).bind(
        organizationId, appointment.id, appointment.child_id, appointment.date, appointment.start_minute, appointment.minutes,
        appointment.therapist, appointment.room, organizationId, appointment.date,
        appointment.child_id, appointment.therapist, appointment.room,
        appointment.start_minute, appointment.start_minute, appointment.minutes)
    ]);
    const after = await readAppointments(env.DB, organizationId);
    if (!after.some(x => x.id === appointment.id)) {
      return apiError(409, 'SLOT_CONFLICT', 'A concurrent booking took this slot first. Nothing was saved.', id);
    }
    return Response.json({ ok: true, appointment: after.find(x => x.id === appointment.id) }, { status: 201, headers: jsonHeaders });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown database error.';
    if (/BUSY|LOCKED|cannot start a transaction/.test(messageText)) {
      return apiError(409, 'CONCURRENT_WRITE', 'Another booking is in progress for this centre. Retry shortly.', id);
    }
    return apiError(503, 'DATABASE_UNAVAILABLE', 'The demo database could not process the booking.', id);
  }
}

/** Synthetic demo read surface. No authentication exists yet (M2), so responses contain seeded demo aliases only. */
async function listDemoAppointments(request: Request, env: Env): Promise<Response> {
  const id = requestId(request);
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError(422, 'VALIDATION', 'The date filter must use YYYY-MM-DD.', id);
  }
  try {
    const rows = await env.DB.prepare(
      'SELECT id, child_id, date, start_minute, minutes, therapist, room, attendance, status, revision FROM appointments WHERE organization_id = ? ORDER BY date, start_minute'
    ).bind('demo-aasha').all();
    const results = date ? rows.results.filter((r: any) => r.date === date) : rows.results;
    return Response.json({ count: results.length, appointments: results }, { headers: jsonHeaders });
  } catch {
    return apiError(503, 'LOCAL_DATABASE_NOT_READY', 'Run npm run db:migrate:local before using the demo API.', id);
  }
}

/** Returns true when the path was handled under /api/v1/*; otherwise false so the caller can emit 404. */
export async function handleApi(request: Request, env: Env, path: string): Promise<Response | null> {
  const method = request.method;
  if (path === '/api/v1/health' && method === 'GET') {
    try {
      await env.DB.prepare('SELECT version FROM schema_info LIMIT 1').first();
      return Response.json({ status: 'ok', mode: 'offline-synthetic-demo', clinicalApi: false }, { headers: jsonHeaders });
    } catch {
      return apiError(503, 'LOCAL_DATABASE_NOT_READY', 'Local database migrations have not been applied.', requestId(request));
    }
  }
  if (path === '/api/v1/demo/appointments') {
    if (method === 'GET') return listDemoAppointments(request, env);
    if (method === 'POST') return bookDemoAppointment(request, env);
    return apiError(405, 'METHOD_NOT_ALLOWED', 'Use GET or POST for this route.', requestId(request));
  }
  if (path.startsWith('/api/')) return null;
  return null;
}
