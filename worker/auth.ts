import { createClient } from "@supabase/supabase-js";
import type { Env } from "./types";
export function identityConfig(env: Env) {
  if (
    !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(env.SUPABASE_URL ?? "") ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.SUPABASE_PUBLISHABLE_KEY ?? "")
  )
    return null;
  return { url: env.SUPABASE_URL!, key: env.SUPABASE_PUBLISHABLE_KEY! };
}
/** Supabase verifies the bearer token and current user. Roles always come from D1. */
export async function authenticate(
  request: Request,
  env: Env,
): Promise<string | null> {
  const config = identityConfig(env);
  const token = /^Bearer ([^\s]+)$/.exec(
    request.headers.get("Authorization") ?? "",
  )?.[1];
  if (!config || !token || token.length > 16384) return null;
  try {
    const client = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
      },
    });
    const { data, error } = await client.auth.getUser(token);
    if (
      error ||
      !data.user?.id ||
      !data.user.email_confirmed_at ||
      data.user.is_anonymous ||
      !data.user.email
    )
      return null;
    return data.user.email.toLowerCase();
  } catch {
    return null;
  }
}
