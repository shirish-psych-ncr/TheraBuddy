# Current handoff

Updated: 2026-10-15 (session 2). Status: local M1 verification complete; hosting selected (Workers Static Assets via Cloudflare Builds); remote deploy pending authorization.

## Completed this session (session 2, 2026-10-15)

- Chose hosting Option A per user decision: GitHub repo + Cloudflare Workers Static Assets deployed through Cloudflare Builds on the Free plan (replaces the GitHub Pages proxy idea). Rationale recorded in docs/09-operations.md "Hosting topology".
- Installed dependencies with `npm ci` under Node 20 (works for build/test; EBADENGINE warnings for Wrangler/Vitest ranges — resolved by pinning Node 22.14.0 in new `.nvmrc`).
- Verified full local pipeline on Node 22.14.0: `npm run build` PASS (Vite 8.3.4, PWA precache 25 entries / 1122 KiB), `npm test` PASS (4/4 domain tests, Vitest 5.0.4), `npm run db:migrate:local` PASS (0001_foundation.sql applied to local D1), `wrangler dev` served SPA at `/` and `/api/v1/health` returned `{"status":"ok","mode":"offline-synthetic-demo","clinicalApi":false}` HTTP 200, `npm run worker:check` dry-run PASS (24 asset files, DB binding resolved).
- Added `.github/workflows/ci.yml`: CI on Node from `.nvmrc` running check:docs, test, build, `wrangler deploy --dry-run`. No deploy step yet (requires authorized account credentials as a secret).
- Fixed stale brief SHA-256 baseline: recorded hash FC69AC… did not match the committed file (HEAD blob and working tree both hash to 60D4C1…). Updated scripts/check-docs.mjs, docs/12-evidence.md and regenerated docs/11-screen-inventory.md with the recomputed value plus a provenance note. The brief file itself was not modified. `npm run check:docs` now PASSes on both checks.

## Completed this session

- Inspected the initial two-file workspace and supplied logo.
- Analysed the brief's product evolution, repeated sections, explicit stack specification, workflow dependencies and governance needs.
- Wrote AI-editor instructions plus product, architecture, data/API, security, UX, delivery, test, tooling and recovery guidance.
- Added a generated source-screen inventory with original line references and a reproducible coverage check.
- Checked plugin discovery: GitHub, Context7 and Supabase already installed; no Cloudflare search match. Context7 library lookup succeeded.
- Fetched current official Cloudflare and Vite guidance. Observed Node/npm/Git versions.
- Registry metadata retrieved for Vite 8.3.4, Wrangler 4.151.0, create-cloudflare 2.74.0 and @cloudflare/vite-plugin 1.64.0. Installed Node satisfies the first three declared engine ranges; full install compatibility remains untested.

## Verification evidence

- `node scripts/map-brief.mjs --check`: PASS; 462 unique IDs, 19 families, 924 source occurrences, all duplicate titles/descriptions identical. The transcript's approximate 360 count is inaccurate.
- `node scripts/check-docs.mjs`: PASS; 14 Markdown files, 14 local links, original brief and logo SHA-256 hashes unchanged.
- No application/browser/security tests are claimed. The source map is exhaustive for numbered screen IDs, not proof that all prose has been clinically validated.

## Not done

No app scaffold, dependency installation, Git initialization, repository creation, cloud login/provisioning, deployment, authentication implementation, clinical review or application tests. No new plugins were needed or installed. GitHub repository access and Cloudflare account readiness remain unverified. Documentation scripts only validate planning artifacts.

## Open decisions

| Decision | Default / recommendation | Needed by |
|---|---|---|
| Product vs centre brand | Universal platform; Aasha working name | Public branding |
| First release | Synthetic OT/SLT demo | M1 scope |
| Auth library and hashing viability | Maintained library, benchmark real Workers limits | M1, blocking M2 |
| Scheduling atomicity | Prove DB constraints/atomic mutation under concurrency | M1, blocking M4 |
| Hosting and repository accounts | RESOLVED: Workers Static Assets + Cloudflare Builds (Free plan). GitHub/Cloudflare account access still unverified | Remote setup |
| Clinical reviewer and library rights | Named qualified owners and licensed content | Any non-demo clinical library |
| Jurisdiction, retention, hosting suitability | Formal review; do not infer from folder location | Clinical pilot |
| Identifiable offline drafts | Deferred | Separate security design |
| Media and external notifications | Deferred | Separate cost/privacy review |
| License and logo rights | Confirm before public publication | Public repository/demo |

## Next editor task

1. With explicit user authorization: create/connect the GitHub repository (decide visibility first — the brief is a personal conversation export), then link a Cloudflare project (Free plan) to it via Cloudflare Builds or add a gated deploy job using a least-privilege CLOUDFLARE_API_TOKEN secret; provision a real remote D1 (`aasha-preview`) replacing the placeholder database_id only when API routes need it. Never store tokens in the repo.
2. Then continue M1 in docs/06-roadmap.md: do not implement all source screens at once; keep source materials intact; resolve auth and concurrency before building dependent clinical workflows.

## Handoff template for later sessions

Record revision/date, selected source IDs, implemented behavior, commands and exact outcomes, browser coverage, unresolved failures, decisions changed and next unblocked task. Link evidence; never write 'all tests pass' without the commands/environment. Keep implemented, verified and deployed columns separate.
