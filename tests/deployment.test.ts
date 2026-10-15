import { describe, expect, it } from "vitest";
// @ts-expect-error Deployment runner is intentionally plain Node JavaScript.
import { validateDeployment } from "../scripts/deployment-config.mjs";
describe("deployment boundaries", () => {
  const config = {
    observability: { enabled: false },
    env: {
      preview: {
        vars: {
          DEMO_MODE: "offline-synthetic",
          SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        },
        d1_databases: [
          {
            binding: "DB",
            database_id: "12345678-1234-1234-1234-123456789abc",
          },
        ],
      },
    },
  };
  it("accepts complete preview configuration independently of local placeholders", () =>
    expect(() =>
      validateDeployment(
        {
          ...config,
          d1_databases: [
            { database_id: "00000000-0000-0000-0000-000000000000" },
          ],
        },
        "preview",
      ),
    ).not.toThrow());
  it("rejects an absent production environment", () =>
    expect(() => validateDeployment(config, "production")).toThrow());
  it("rejects missing identity configuration", () =>
    expect(() =>
      validateDeployment(
        { ...config, env: { preview: { ...config.env.preview, vars: {} } } },
        "preview",
      ),
    ).toThrow());
});
