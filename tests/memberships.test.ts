import { beforeEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { memberships } from "../worker/memberships";
import type { Env } from "../worker/types";

// Real SQLite executes the production SQL; Worker/D1 runtime is checked separately.
let sqlite: DatabaseSync;
let env: Env;
function statement(sql: string, values: unknown[] = []): any {
  return {
    bind: (...args: unknown[]) => statement(sql, args),
    first: async () => sqlite.prepare(sql).get(...(values as any[])) ?? null,
    all: async () => ({
      results: sqlite.prepare(sql).all(...(values as any[])),
      success: true,
    }),
    run: async () => ({
      meta: {
        changes: Number(sqlite.prepare(sql).run(...(values as any[])).changes),
      },
      success: true,
    }),
  };
}
beforeEach(() => {
  sqlite?.close();
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync("database/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync(`database/migrations/${file}`, "utf8"));
  for (const org of ["one", "two", "three"]) {
    sqlite
      .prepare("INSERT INTO organizations(id,name) VALUES (?,?)")
      .run(org, org);
    sqlite
      .prepare("INSERT INTO memberships VALUES (?,?,'admin',1,0,'seed')")
      .run(org, `${org}@example.test`);
  }
  sqlite.exec(
    "INSERT INTO memberships VALUES ('one','therapist@example.test','therapist',1,0,'seed'); INSERT INTO memberships VALUES ('one','revoked@example.test','admin',0,0,'seed')",
  );
  env = {
    DB: {
      prepare: statement,
      batch: async (statements: any[]) => {
        sqlite.exec("BEGIN");
        try {
          const results = [];
          for (const s of statements) results.push(await s.run());
          sqlite.exec("COMMIT");
          return results;
        } catch (e) {
          sqlite.exec("ROLLBACK");
          throw e;
        }
      },
    } as unknown as D1Database,
  };
});
const path = "/api/v1/organizations/one/members";
const payload = () => ({
  email: "new@example.test",
  role: "reception",
  active: true,
  revision: -1,
  operation: crypto.randomUUID(),
});
const put = (body: unknown, origin = "https://app.test") =>
  new Request(`https://app.test${path}`, {
    method: "PUT",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
describe("tenant administration", () => {
  it("returns only memberships belonging to the signed-in identity", async () => {
    const r = await memberships(
      new Request("https://app.test/api/v1/me"),
      env,
      "/api/v1/me",
      "one@example.test",
    );
    expect(
      ((await r.json()) as any).organizations.map((o: any) => o.id),
    ).toEqual(["one"]);
  });
  it.each([
    "two@example.test",
    "three@example.test",
    "therapist@example.test",
    "revoked@example.test",
    "platform@example.test",
  ])("denies cross-tenant, revoked and non-admin access: %s", async (email) => {
    expect(
      (
        await memberships(
          new Request(`https://app.test${path}`),
          env,
          path,
          email,
        )
      ).status,
    ).toBe(403);
    expect((await memberships(put(payload()), env, path, email)).status).toBe(
      403,
    );
  });
  it("grants once, replays once, rejects reused keys and stale revisions", async () => {
    const body = payload();
    expect(
      (await memberships(put(body), env, path, "one@example.test")).status,
    ).toBe(200);
    expect(
      (
        (await (
          await memberships(put(body), env, path, "one@example.test")
        ).json()) as any
      ).replay,
    ).toBe(true);
    expect(
      sqlite.prepare("SELECT count(*) AS n FROM membership_audit").get()?.n,
    ).toBe(1);
    expect(
      (
        await memberships(
          put({ ...body, role: "admin" }),
          env,
          path,
          "one@example.test",
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await memberships(
          put({ ...body, operation: crypto.randomUUID() }),
          env,
          path,
          "one@example.test",
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await memberships(
          put({
            ...body,
            revision: 0,
            active: false,
            operation: crypto.randomUUID(),
          }),
          env,
          path,
          "one@example.test",
        )
      ).status,
    ).toBe(200);
    const me = await memberships(
      new Request("https://app.test/api/v1/me"),
      env,
      "/api/v1/me",
      body.email,
    );
    expect(((await me.json()) as any).organizations).toEqual([]);
  });
  it("rejects CSRF, null bodies, excess fields, invalid roles and self changes", async () => {
    expect(
      (
        await memberships(
          put(payload(), "https://evil.test"),
          env,
          path,
          "one@example.test",
        )
      ).status,
    ).toBe(403);
    for (const body of [
      null,
      { ...payload(), role: "platform" },
      { ...payload(), clinical: true },
    ])
      expect(
        (await memberships(put(body), env, path, "one@example.test")).status,
      ).toBe(422);
    expect(
      (
        await memberships(
          put({ ...payload(), email: "one@example.test" }),
          env,
          path,
          "one@example.test",
        )
      ).status,
    ).toBe(403);
  });
});
