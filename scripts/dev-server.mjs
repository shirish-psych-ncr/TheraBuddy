// Shared helper: boot `wrangler dev --local` on a fixed port and wait until it
// serves the health endpoint. Used by api-integration.mjs (and future e2e runs).
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

export const DEV_PORT = Number(process.env.AASHA_DEV_PORT ?? 8791);
export const DEV_BASE = `http://127.0.0.1:${DEV_PORT}`;

/** Returns { child, stop }. `stop()` kills the server and resolves once it exited. */
export function startDevServer() {
  const child = spawn('npx', ['wrangler', 'dev', '--local', '--port', String(DEV_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'], env: process.env
  });
  let log = '';
  child.stdout.on('data', d => { log += d; });
  child.stderr.on('data', d => { log += d; });
  const stop = () => new Promise(resolve => {
    child.once('exit', resolve);
    child.kill('SIGKILL');
    setTimeout(() => { try { child.kill('SIGKILL'); } catch {} resolve(); }, 5000);
  });
  return { child, stop, getLog: () => log };
}

/** Polls /api/v1/health until any HTTP response arrives (200 or 503 both mean worker is up). */
export async function waitForDevServer(timeoutSeconds = 60) {
  for (let i = 0; i < timeoutSeconds; i++) {
    try {
      const r = await fetch(`${DEV_BASE}/api/v1/health`);
      if (r.status === 200 || r.status === 503) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}
