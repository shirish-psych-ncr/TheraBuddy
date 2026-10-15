# Operations, cost boundaries and recovery

## Current deployment runbook

Use [free deployment and staff setup](13-free-deployment.md) for the current commands. Workers Builds connects directly to GitHub; GitHub Pages is not required. `deploy:preview` runs the local gates, validates the preview-specific D1 and Supabase public identifiers, applies migrations, then deploys using the pinned CLI. Production deployment is intentionally disabled. A remote `aasha-preview` database exists with migrations 0001–0003 applied; do not create another by following the older proposed sequence below. No live app deployment is claimed until recorded in the handoff.

## Verified provider constraints

Snapshot fetched 2026-10-15, not a capacity guarantee:

| Free-plan constraint | Published value | Design consequence |
|---|---|---|
| Worker requests | 100,000/day | Bound API polling and handle unavailable service |
| Worker CPU | 10 ms/request | Benchmark auth and expensive report operations |
| D1 reads/writes | 5 million / 100,000 rows per day | Index, paginate, debounce writes; measure scanned rows |
| D1 database size | 500 MB/database | Avoid media in SQL; monitor growth |
| D1 total storage/databases | 5 GB/account; 10 databases | Shared prototype design is proposed; avoid unlimited scale claims |
| D1 point-in-time recovery | 7 days | Independent export/restore plan still required |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/). D1 quota exhaustion can reject queries. Free hosting is suitable for a bounded synthetic demo, not proof of uninterrupted clinical availability.

Do not enable automatic paid upgrades. No R2, paid messaging, hosted inference or other billable product is assumed. Record any new service's free limits, card requirement, overage behavior and data flow before adding it.

## Proposed monitoring

Track API failures/latency, authentication failures without credentials, D1 rows read/written, storage growth, failed saves, unsigned-note backlog and backup age. Choose operational thresholds after measuring representative synthetic workloads. Alert on capacity before exhaustion; do not imply alerts reserve capacity. Avoid patient names, notes and session tokens in logs or traces.

## Release procedure

### Deployment wiring

The deploy target is a Cloudflare Worker serving Vite's `dist/` through Workers Static Assets, with D1 bound as `DB`. `npm run deploy:preview` and `npm run deploy:production` run a placeholder and authentication check before invoking Wrangler; they intentionally refuse to publish while the corresponding D1 ID is unset. The intended sequence is:

1. Install the pinned toolchain with `npm ci` and authenticate with `npx wrangler login`.
2. Create the remote D1 database (`aasha-preview` or a separately approved production name), put its returned ID in the matching `wrangler.jsonc` environment, and apply versioned migrations with `npx wrangler d1 migrations apply <name> --remote`.
3. Run the local gates, then use the matching deploy script. Verify `/api/v1/health` and the synthetic booking flow before considering any release.

No production deployment has been performed from this checkout. Cloudflare account access, domain choice, and the production D1 identifier are external decisions and must remain explicit.

Use separate local, synthetic preview and eventual production environments. Review schema changes, test on a restored copy, create a recovery point, deploy compatible schema/application changes and verify health, auth, tenant isolation and core journey. Publish the actual version and test evidence. App rollback does not undo destructive database migrations; use expand/contract migrations and a tested recovery plan.

## Restore drill

1. Export a synthetic database through supported tooling; record schema version, timestamp, checksum and row counts.
2. Restore to an empty isolated database, never blindly over the active target.
3. Validate foreign keys, per-tenant counts, goal/protocol references and signed-note snapshots.
4. Run the tenant-isolation and core-session tests against the restored target.
5. Record restore duration, data-loss window, operator and evidence. Define acceptable RPO/RTO with the future centre operator before clinical use; no target is promised yet.

For real records, backup encryption, key custody, access, retention and location require an approved operational design. A backup file on a developer laptop is not a clinical continuity plan.

## Incident and downtime behavior

On quota/network failure, show unsaved/error state and stop unsafe retries. On suspected exposure, restrict affected access, preserve relevant audit evidence and involve the designated owner. Follow an approved notification process; do not invent statutory deadlines. During downtime, use the centre's approved alternative documentation process and later reconcile with provenance. Never imply an unsaved in-memory form survives device loss.
