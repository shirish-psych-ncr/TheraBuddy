import { describe, expect, it, vi } from "vitest";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser } }) }));
import worker from "../worker/index";
const env = { DB: {} as any, SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" };
describe("t11", () => {
  it("A: evil url via worker -> 401", async () => {
    const r = await worker.fetch(new Request("https://app.test/api/v1/me", { headers: { Authorization: "Bearer token" } }), { ...env, SUPABASE_URL: "https://evil.test" });
    expect(r.status).toBe(401);
  });
  it("B: outage via worker -> 401", async () => {
    getUser.mockRejectedValue(new Error("offline"));
    const r = await worker.fetch(new Request("https://app.test/api/v1/demo/appointments", { headers: { Authorization: "Bearer token" } }), env);
    expect(r.status).toBe(401);
  });
});
