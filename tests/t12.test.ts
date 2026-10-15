import { describe, expect, it, vi } from "vitest";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser } }) }));
import worker from "/workspace/worker/index";
const env = { DB: {} as any, SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" };
const request = (token = "token") => new Request("https://app.test/api/v1/me", { headers: { Authorization: `Bearer ${token}` } });
describe("t12", () => {
  it("evil then outage in one test", async () => {
    const evil = await worker.fetch(request(), { ...env, SUPABASE_URL: "https://evil.test" });
    expect(evil.status).toBe(401);
    getUser.mockRejectedValue(new Error("offline"));
    const outage = await worker.fetch(request(), env);
    expect(outage.status).toBe(401);
  });
});
