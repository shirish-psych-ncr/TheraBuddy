import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | undefined;
let initialization: Promise<SupabaseClient> | undefined;
export function getAuth(): Promise<SupabaseClient> {
  if (client) return Promise.resolve(client);
  if (!initialization)
    initialization = fetch("/api/v1/auth/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Staff sign-in is awaiting account configuration.");
        const config = (await response.json()) as { url: string; key: string };
        client = createClient(config.url, config.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        });
        return client;
      })
      .catch((error) => {
        initialization = undefined;
        throw error;
      });
  return initialization;
}
export async function accessToken() {
  const { data } = await (await getAuth()).auth.getSession();
  return data.session?.access_token;
}
