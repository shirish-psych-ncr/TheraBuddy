var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/api.ts
var jsonHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function apiError(status, code, message, requestId2) {
  return Response.json({ code, message, requestId: requestId2 }, { status, headers: jsonHeaders });
}
__name(apiError, "apiError");
function requestId(request) {
  return request.headers.get("cf-ray") ?? void 0;
}
__name(requestId, "requestId");
function overlaps(a, b) {
  if (a.status === "cancelled" || b.status === "cancelled" || a.date !== b.date) return false;
  const sharesResource = a.child_id === b.child_id || a.therapist === b.therapist || a.room === b.room;
  if (!sharesResource) return false;
  return a.start_minute < b.start_minute + b.minutes && a.start_minute + a.minutes > b.start_minute;
}
__name(overlaps, "overlaps");
async function readAppointments(db, organizationId) {
  const result = await db.prepare(
    "SELECT id, child_id, date, start_minute, minutes, therapist, room, attendance, status, revision FROM appointments WHERE organization_id = ?"
  ).bind(organizationId).all();
  if (result.success) return result.results;
  throw new Error(result.error ?? "Database query failed.");
}
__name(readAppointments, "readAppointments");
async function bookDemoAppointment(request, env) {
  const id = requestId(request);
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(422, "INVALID_JSON", "Request body must be JSON.", id);
  }
  const a = body;
  const childId = typeof a.childId === "string" ? a.childId : a.child_id;
  const startMinute = typeof a.startMinute === "number" ? a.startMinute : a.start_minute;
  const required = [a.id, childId, a.date, a.therapist, a.room];
  if (required.some((v) => typeof v !== "string" || !v) || typeof startMinute !== "number" || !Number.isInteger(startMinute) || typeof a.minutes !== "number" || !Number.isInteger(a.minutes) || a.minutes < 15 || a.minutes > 120) {
    return apiError(422, "VALIDATION", "id, childId, date, integer startMinute, minutes (15\u2013120), therapist and room are required.", id);
  }
  const appointment = {
    id: String(a.id),
    child_id: String(childId),
    date: String(a.date),
    start_minute: Number(startMinute),
    minutes: Number(a.minutes),
    therapist: String(a.therapist),
    room: String(a.room),
    attendance: "expected",
    status: "scheduled",
    revision: 0
  };
  if (appointment.start_minute < 0 || appointment.start_minute + appointment.minutes > 1440) {
    return apiError(422, "VALIDATION", "Appointments must finish on the same day.", id);
  }
  const organizationId = "demo-aasha";
  try {
    const existing = await readAppointments(env.DB, organizationId);
    const collision = existing.find((other) => overlaps(other, appointment));
    if (collision) return apiError(409, "SLOT_CONFLICT", "This time overlaps another appointment for the child, therapist or room.", id);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO appointments (organization_id, id, child_id, date, start_minute, minutes, therapist, room, attendance, status, revision)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'expected', 'scheduled', 0
        WHERE NOT EXISTS (SELECT 1 FROM appointments o WHERE o.organization_id = ? AND o.status <> 'cancelled' AND o.date = ?
          AND (o.child_id = ? OR o.therapist = ? OR o.room = ?)
          AND ? < o.start_minute + o.minutes AND ? + ? > o.start_minute)`).bind(
        organizationId,
        appointment.id,
        appointment.child_id,
        appointment.date,
        appointment.start_minute,
        appointment.minutes,
        appointment.therapist,
        appointment.room,
        organizationId,
        appointment.date,
        appointment.child_id,
        appointment.therapist,
        appointment.room,
        appointment.start_minute,
        appointment.start_minute,
        appointment.minutes
      )
    ]);
    const after = await readAppointments(env.DB, organizationId);
    if (!after.some((x) => x.id === appointment.id)) {
      return apiError(409, "SLOT_CONFLICT", "A concurrent booking took this slot first. Nothing was saved.", id);
    }
    return Response.json({ ok: true, appointment: after.find((x) => x.id === appointment.id) }, { status: 201, headers: jsonHeaders });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown database error.";
    if (/BUSY|LOCKED|cannot start a transaction/.test(messageText)) {
      return apiError(409, "CONCURRENT_WRITE", "Another booking is in progress for this centre. Retry shortly.", id);
    }
    return apiError(503, "DATABASE_UNAVAILABLE", "The demo database could not process the booking.", id);
  }
}
__name(bookDemoAppointment, "bookDemoAppointment");
async function listDemoAppointments(request, env) {
  const id = requestId(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError(422, "VALIDATION", "The date filter must use YYYY-MM-DD.", id);
  }
  try {
    const rows = await env.DB.prepare(
      "SELECT id, child_id, date, start_minute, minutes, therapist, room, attendance, status, revision FROM appointments WHERE organization_id = ? ORDER BY date, start_minute"
    ).bind("demo-aasha").all();
    const results = date ? rows.results.filter((r) => r.date === date) : rows.results;
    return Response.json({ count: results.length, appointments: results }, { headers: jsonHeaders });
  } catch {
    return apiError(503, "LOCAL_DATABASE_NOT_READY", "Run npm run db:migrate:local before using the demo API.", id);
  }
}
__name(listDemoAppointments, "listDemoAppointments");
async function handleApi(request, env, path) {
  const method = request.method;
  if (path === "/api/v1/health" && method === "GET") {
    try {
      await env.DB.prepare("SELECT version FROM schema_info LIMIT 1").first();
      return Response.json({ status: "ok", mode: "offline-synthetic-demo", clinicalApi: false }, { headers: jsonHeaders });
    } catch {
      return apiError(503, "LOCAL_DATABASE_NOT_READY", "Local database migrations have not been applied.", requestId(request));
    }
  }
  if (path === "/api/v1/demo/appointments") {
    if (method === "GET") return listDemoAppointments(request, env);
    if (method === "POST") return bookDemoAppointment(request, env);
    return apiError(405, "METHOD_NOT_ALLOWED", "Use GET or POST for this route.", requestId(request));
  }
  if (path.startsWith("/api/")) return null;
  return null;
}
__name(handleApi, "handleApi");

// worker/index.ts
var worker_default = {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      const handled = await handleApi(request, env, path);
      if (handled) return handled;
      return apiError(404, "NOT_FOUND", "No clinical API is enabled in this demo.");
    }
    return apiError(404, "NOT_FOUND", "No clinical API is enabled in this demo.");
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-nmzWic/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-nmzWic/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
