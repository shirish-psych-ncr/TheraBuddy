// Worker-runtime integration check for the M1 atomic-booking spike.
// Boots `wrangler dev --local` (miniflare/workerd + local D1), applies migrations,
// then exercises /api/v1/health, GET/POST demo appointments, conflict rejection,
// concurrent double-booking and the error envelope. Exits non-zero on any failure
// and always terminates the dev server so the process never hangs.
import { spawn } from 'node:child_process';
import { startDevServer, waitForDevServer, DEV_BASE } from './dev-server.mjs';

let failures = 0;
const check = (name, condition, detail = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures++;
};

const wrangler = startDevServer();

async function run() {
  // Wait until the dev server is ready before touching local D1 state:
  // wrangler dev holds the persistence directory and a migrations apply that
  // races its startup can leave it waiting on a lock forever.
  check('wrangler dev becomes ready', await waitForDevServer(), wrangler.getLog().split('\n').find(l => l.includes('Ready'))?.trim());

  // Fresh local state so results are reproducible. The health probe above already
  // reached the worker, so no migration-state race with dev startup remains.
  await new Promise(resolve => spawn('rm', ['-rf', '.wrangler/state/v3/d1'], { stdio: 'ignore' }).on('close', resolve));
  const migrated = await new Promise(resolve => {
    const m = spawn('npx', ['wrangler', 'd1', 'migrations', 'apply', 'aasha-local', '--local'], { stdio: 'inherit' });
    m.on('close', code => resolve(code === 0));
  });
  check('migrations apply to a clean local D1', migrated);
  if (!migrated) return;

  const health = await fetch(`${DEV_BASE}/api/v1/health`);
  const healthBody = await health.json();
  check('health returns ok with DB reachable', health.status === 200 && healthBody.status === 'ok');

  const emptyList = await fetch(`${DEV_BASE}/api/v1/demo/appointments`);
  const emptyBody = await emptyList.json();
  check('GET demo appointments starts empty', emptyList.status === 200 && emptyBody.count === 0);

  const badDate = await fetch(`${DEV_BASE}/api/v1/demo/appointments?date=not-a-date`);
  const badDateBody = await badDate.json();
  check('invalid filter yields 422 envelope', badDate.status === 422 && badDateBody.code === 'VALIDATION' && typeof badDateBody.message === 'string');

  const book = (overrides = {}) => fetch(`${DEV_BASE}/api/v1/demo/appointments`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: crypto.randomUUID(), childId: 'demo-child-maple', date: '2026-10-20', startMinute: 540, minutes: 45, therapist: 'Demo OT therapist', room: 'Room 1', ...overrides })
  });

  const first = await book();
  check('first booking accepted (201)', first.status === 201, JSON.stringify(await first.json().then(b => b.ok)));

  const overlapChild = await book({ id: crypto.randomUUID(), startMinute: 560 });
  const overlapBody = await overlapChild.json();
  check('overlapping booking rejected (409 SLOT_CONFLICT)', overlapChild.status === 409 && overlapBody.code === 'SLOT_CONFLICT');

  const otherResource = await book({ id: crypto.randomUUID(), childId: 'demo-child-robin', therapist: 'Demo SLT therapist', room: 'Room 2' });
  check('non-colliding booking accepted', otherResource.status === 201);

  const invalid = await book({ id: crypto.randomUUID(), minutes: 5 });
  check('domain validation rejects duration < 15 (422)', invalid.status === 422);

  // Concurrency: two identical-slot bookings race; at most one may win.
  const [a, b] = await Promise.all([book({ id: crypto.randomUUID() }), book({ id: crypto.randomUUID() })]);
  const statuses = [a.status, b.status].sort();
  check('concurrent same-slot race produces no double-book', !(statuses[0] === 201 && statuses[1] === 201), statuses.join('/'));

  const list = await fetch(`${DEV_BASE}/api/v1/demo/appointments?date=2026-10-20`);
  const listBody = await list.json();
  check('list reflects exactly the accepted bookings', listBody.count === 2, `count=${listBody.count}`);

  const notFound = await fetch(`${DEV_BASE}/api/v1/organizations/x/children`);
  const nfBody = await notFound.json();
  check('unknown API route returns JSON 404 envelope', notFound.status === 404 && nfBody.code === 'NOT_FOUND');

  const spa = await fetch(`${DEV_BASE}/some/deep/route`);
  check('SPA deep link served by assets', spa.status === 200 && (await spa.text()).includes('<div id="root">'));

  const noStore = health.headers.get('cache-control');
  check('API responses are no-store', noStore === 'no-store', noStore);
}

try {
  await run();
} catch (error) {
  console.error('Integration run crashed:', error);
  failures++;
} finally {
  await wrangler.stop();
}

if (failures > 0) { console.error(`\n${failures} integration check(s) FAILED.`); process.exit(1); }
else console.log('\nAll worker-runtime integration checks passed.');
process.exit(0);
