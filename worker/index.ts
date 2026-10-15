import { apiError } from "./api";
import type { Env } from "./types";
import { authenticate, identityConfig } from "./auth";
import { memberships } from "./memberships";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      if (path === "/api/v1/auth/config" && request.method === "GET") {
        const config = identityConfig(env);
        return config
          ? Response.json(config, { headers: { "Cache-Control": "no-store" } })
          : apiError(
              503,
              "SETUP_REQUIRED",
              "Staff sign-in is awaiting account configuration.",
            );
      }
      if (path === "/api/v1/health")
        return Response.json(
          { status: "ok", clinicalApi: false },
          { headers: { "Cache-Control": "no-store" } },
        );
      const email = await authenticate(request, env);
      if (!email)
        return apiError(401, "AUTH_REQUIRED", "Sign in to your staff account.");
      try {
        return await memberships(request, env, path, email);
      } catch {
        return apiError(
          503,
          "UNAVAILABLE",
          "The service is temporarily unavailable. Try again later.",
        );
      }
    }
    return apiError(
      404,
      "NOT_FOUND",
      "No clinical API is enabled in this demo.",
    );
  },
};
