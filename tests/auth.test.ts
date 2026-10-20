import { beforeEach, describe, expect, it, vi } from "vitest";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));
import { authenticate } from "../worker/auth";
import worker from "../worker/index";
const env = {
  DB: {} as D1Database,
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};
const request = (token = "token") =>
  new Request("https://app.test/api/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
beforeEach(() => { getUser.mockReset(); });
describe("authoritative identity verification", () => {
  it("accepts only a confirmed current user and ignores user metadata roles", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "id",
          email: "Member@Example.test",
          email_confirmed_at: "2026-10-15",
          user_metadata: { role: "admin" },
        },
      },
      error: null,
    });
    expect(await authenticate(request(), env)).toBe("member@example.test");
    expect(getUser).toHaveBeenCalledWith("token");
  });
  it("rejects forged, expired or revoked identities rejected by the provider", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid" },
    });
    expect(await authenticate(request("forged"), env)).toBeNull();
  });
  it.each([
    { id: "id", email: "a@example.test" },
    {
      id: "id",
      email: "a@example.test",
      email_confirmed_at: "now",
      is_anonymous: true,
    },
  ])("rejects unconfirmed and anonymous users", async (user) => {
    getUser.mockResolvedValue({ data: { user }, error: null });
    expect(await authenticate(request(), env)).toBeNull();
  });
  it("rejects forwarded email headers, missing configuration and provider outages", async () => {
    expect(
      await authenticate(
        new Request("https://app.test", {
          headers: {
            "Cf-Access-Authenticated-User-Email": "admin@example.test",
          },
        }),
        env,
      ),
    ).toBeNull();
    const evil = await worker.fetch(request(), { ...env, SUPABASE_URL: "https://evil.test" });
    expect(evil.status).toBe(401);
    getUser.mockRejectedValue(new Error("offline"));
    // Provider outages must yield a denial (401), never a thrown error or 500.
    const outage = await worker.fetch(request(), env);
    expect(outage.status).toBe(401);
  });
  it("closes the previous unauthenticated booking API", async () => {
    const r = await worker.fetch(
      new Request("https://app.test/api/v1/demo/appointments"),
      env,
    );
    expect(r.status).toBe(401);
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
});
