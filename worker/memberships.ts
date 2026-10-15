import { z } from "zod";
import { apiError } from "./api";
import type { Env } from "./types";

const input = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    role: z.enum(["admin", "supervisor", "therapist", "reception"]),
    active: z.boolean(),
    revision: z.number().int().min(-1),
    operation: z.uuid(),
  })
  .strict();
const json = (data: unknown) =>
  Response.json(data, { headers: { "Cache-Control": "no-store" } });

export async function memberships(
  request: Request,
  env: Env,
  path: string,
  email: string,
): Promise<Response> {
  if (path === "/api/v1/me" && request.method === "GET") {
    const result = await env.DB.prepare(
      `SELECT o.id, o.name, m.role FROM organizations o
      JOIN memberships m ON m.organization_id = o.id WHERE m.email = ? AND m.active = 1 ORDER BY o.name`,
    )
      .bind(email)
      .all();
    return json({ email, organizations: result.results });
  }
  const route =
    /^\/api\/v1\/organizations\/([a-zA-Z0-9_-]{1,80})\/members$/.exec(path);
  if (!route)
    return apiError(404, "NOT_FOUND", "This API route is not available.");
  const organization = route[1];
  const actor = await env.DB.prepare(
    "SELECT role FROM memberships WHERE organization_id = ? AND email = ? AND active = 1",
  )
    .bind(organization, email)
    .first<{ role: string }>();
  if (actor?.role !== "admin")
    return apiError(
      403,
      "FORBIDDEN",
      "Centre administrator access is required.",
    );
  if (request.method === "GET") {
    const result = await env.DB.prepare(
      `SELECT email, role, active, revision FROM memberships WHERE organization_id = ?
      AND EXISTS (SELECT 1 FROM memberships a WHERE a.organization_id = ? AND a.email = ? AND a.role = 'admin' AND a.active = 1)
      ORDER BY email LIMIT 100`,
    )
      .bind(organization, organization, email)
      .all();
    return json({ members: result.results, limit: 100 });
  }
  if (request.method !== "PUT")
    return apiError(405, "METHOD_NOT_ALLOWED", "Use GET or PUT.");
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return apiError(403, "ORIGIN", "Use the same-origin staff portal.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiError(415, "CONTENT_TYPE", "JSON is required.");
  const text = await request.text();
  if (text.length > 2048)
    return apiError(413, "TOO_LARGE", "Request is too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return apiError(422, "VALIDATION", "Invalid JSON.");
  }
  const parsed = input.safeParse(body);
  if (!parsed.success)
    return apiError(
      422,
      "VALIDATION",
      "Provide a valid email, role, status, revision and operation ID.",
    );
  const v = parsed.data;
  if (v.email === email)
    return apiError(
      403,
      "SELF_CHANGE",
      "Another administrator must change your own access.",
    );
  // All authority and version checks are repeated inside the atomic write.
  const result = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO memberships (organization_id,email,role,active,revision,last_operation)
      SELECT ?,?,?,?,0,? WHERE ? = -1
      AND EXISTS (SELECT 1 FROM memberships WHERE organization_id=? AND email=? AND active=1 AND role='admin')
      AND NOT EXISTS (SELECT 1 FROM membership_audit WHERE organization_id=? AND operation=?)
      AND (SELECT count(*) FROM memberships WHERE organization_id=?) < 100
      ON CONFLICT(organization_id,email) DO NOTHING`,
    ).bind(
      organization,
      v.email,
      v.role,
      Number(v.active),
      v.operation,
      v.revision,
      organization,
      email,
      organization,
      v.operation,
      organization,
    ),
    env.DB.prepare(
      `UPDATE memberships SET role=?,active=?,revision=revision+1,last_operation=?
      WHERE organization_id=? AND email=? AND revision=? AND ? >= 0
      AND EXISTS (SELECT 1 FROM memberships a WHERE a.organization_id=? AND a.email=? AND a.active=1 AND a.role='admin')
      AND NOT EXISTS (SELECT 1 FROM membership_audit WHERE organization_id=? AND operation=?)`,
    ).bind(
      v.role,
      Number(v.active),
      v.operation,
      organization,
      v.email,
      v.revision,
      v.revision,
      organization,
      email,
      organization,
      v.operation,
    ),
    env.DB.prepare(
      `INSERT OR IGNORE INTO membership_audit (organization_id,operation,actor,target,role,active)
      SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM memberships WHERE organization_id=? AND email=? AND last_operation=? AND revision=?)`,
    ).bind(
      organization,
      v.operation,
      email,
      v.email,
      v.role,
      Number(v.active),
      organization,
      v.email,
      v.operation,
      v.revision + 1,
    ),
  ]);
  const saved = await env.DB.prepare(
    `SELECT m.email,m.role,m.active,m.revision,m.last_operation,a.actor FROM memberships m
    JOIN membership_audit a ON a.organization_id=m.organization_id AND a.operation=m.last_operation
    WHERE m.organization_id=? AND m.email=?`,
  )
    .bind(organization, v.email)
    .first<{
      email: string;
      role: string;
      active: number;
      revision: number;
      last_operation: string;
      actor: string;
    }>();
  if (
    !saved ||
    saved.last_operation !== v.operation ||
    saved.actor !== email ||
    saved.role !== v.role ||
    saved.active !== Number(v.active) ||
    saved.revision !== v.revision + 1
  )
    return apiError(
      409,
      "CONFLICT",
      "Access changed, the operation ID was reused, or the member limit was reached. Refresh before retrying.",
    );
  return json({
    ok: true,
    revision: saved.revision,
    replay: !result[0].meta.changes && !result[1].meta.changes,
  });
}
