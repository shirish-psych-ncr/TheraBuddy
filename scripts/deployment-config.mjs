export function validateDeployment(config, environment) {
  if (environment !== "preview")
    throw new Error(
      "Only the synthetic preview release is enabled. Clinical production is not approved.",
    );
  const target = config.env?.[environment];
  const database = target?.d1_databases?.find((db) => db.binding === "DB");
  if (
    !database ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(
      database.database_id,
    ) ||
    /^0{8}-/.test(database.database_id)
  )
    throw new Error("Configure the preview D1 database ID first.");
  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(
      target.vars?.SUPABASE_URL ?? "",
    ) ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(
      target.vars?.SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  )
    throw new Error(
      "Configure the Supabase project URL and publishable key first.",
    );
  if (config.observability?.enabled !== false)
    throw new Error("Request logging must remain disabled for this release.");
  if (target.vars.DEMO_MODE !== "offline-synthetic")
    throw new Error("Only synthetic data is approved.");
}
