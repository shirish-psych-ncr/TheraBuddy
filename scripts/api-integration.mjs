import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
const cli = resolve("node_modules/wrangler/bin/wrangler.js");
mkdirSync(".wrangler/integration", { recursive: true });
const persistence = mkdtempSync(resolve(".wrangler/integration/run-"));
execFileSync(
  process.execPath,
  [
    cli,
    "d1",
    "migrations",
    "apply",
    "aasha-local",
    "--local",
    "--persist-to",
    persistence,
  ],
  { stdio: "inherit" },
);
const port = 8791;
const base = `http://127.0.0.1:${port}`;
try {
  await fetch(base);
  throw new Error(
    "Integration port is already occupied. Stop that server first.",
  );
} catch (e) {
  if (e.message.includes("occupied")) throw e;
}
const server = spawn(
  process.execPath,
  [cli, "dev", "--local", "--port", String(port), "--persist-to", persistence],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
server.stdout.on("data", (x) => {
  log += x;
});
server.stderr.on("data", (x) => {
  log += x;
});
let failures = 0;
function check(name, yes) {
  console.log(`${yes ? "PASS" : "FAIL"}: ${name}`);
  if (!yes) failures++;
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready = (await fetch(`${base}/api/v1/health`)).ok;
    } catch {}
    if (ready) break;
    await sleep(500);
  }
  if (!ready) throw new Error(`Worker failed to start: ${log}`);
  for (const path of [
    "/api/v1/me",
    "/api/v1/organizations/demo-aasha/members",
    "/api/v1/demo/appointments",
  ]) {
    const r = await fetch(base + path);
    check(
      `${path}: unauthenticated request denied`,
      r.status === 401 && r.headers.get("cache-control") === "no-store",
    );
  }
  const forged = await fetch(`${base}/api/v1/me`, {
    headers: {
      "Cf-Access-Authenticated-User-Email": "admin@example.test",
      "Cf-Access-Jwt-Assertion": "forged",
    },
  });
  check("forwarded email and forged JWT denied", forged.status === 401);
  const staff = await fetch(`${base}/staff`);
  check(
    "staff deep link returns shell with no-store",
    staff.ok &&
      staff.headers.get("cache-control") === "no-store" &&
      (await staff.text()).includes('id="root"'),
  );
  const root = await fetch(base);
  check(
    "public demo returns shell and security headers",
    root.ok && Boolean(root.headers.get("content-security-policy")),
  );
} finally {
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } catch {}
  } else server.kill("SIGTERM");
}
if (failures) process.exitCode = 1;
