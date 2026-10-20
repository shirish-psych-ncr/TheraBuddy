# Current handoff

## Latest session: static GitHub Pages PWA (2026-10-15)

This section supersedes earlier hosting and verification status. User requested standard static HTML delivery with connected screens and breadcrumbs.

- Added portable build:pages and generated-output verification. Output includes index.html, staff.html, CSS/JS, icons, manifest, service worker and .nojekyll. Default repository base /TheraBuddy/; root-domain override AASHA_BASE=/.
- Repaired committed merge-conflict markers in App, auth tests, Pages workflow and .gitignore. Corrected platform-specific test imports and a beforeEach callback accidentally returning a mock as a failing cleanup function.
- Workspace navigation uses standard hash anchors; direct links, browser history, family trails, related links and previous/next screens connect the inventory. All 462 entries across 19 families remain specification/backlog pages; six related demo shortcuts are not full-feature completion. Inventory status has not been upgraded.
- Static staff entry links only to a build-configured HTTPS Worker origin. Removed arbitrary browser-stored API-origin input; staff credentials and API remain same-origin on the Worker. Staff HTML is not precached and staff/API navigation is excluded from fallback. No database migration.
- Pages workflow verifies source, docs, inventory and tests, builds repo-relative output, uploads artifact and deploys with job-scoped Pages permissions. Repository Settings → Pages must use GitHub Actions. No new cloud resources, paid services, billing activation or secrets.

Verification: npm test passed 43 tests in 8 files, including rendering and checking all 462 directory pages and family links. npm run check:docs, check:screens and audit passed. TypeScript and Pages build passed; generated manifest/assets and service-worker exclusions passed check:pages. The bundle emits a size warning (~553 kB main JS before gzip); further lazy loading is optional future optimization. Browser automation timed out: no visual, offline-installation or deployed-site success is claimed. Final rebuild after navigation scroll/menu polish passed, including generated-output checks.

Deployment: this session prepares local source and dist; it has not pushed or published these changes. Existing tracked dist files are generated output; the Actions workflow rebuilds from source. Secure staff backend is still awaiting the separate free Supabase organization/project and initial administrator setup described below. Synthetic demo only. Next step: publish the verified Pages workflow, verify the live repository path/PWA installation, then finish staff identity provisioning separately.


## Latest decision: no payment card (2026-10-15)

User reported Cloudflare Access onboarding requires a card. Access was abandoned before subscribing or publishing. Replaced the adapter with Supabase Auth Free using pinned supabase-js 2.117.3: passwords go directly to Supabase; Worker getUser verifies current confirmed identity; D1 remains the role authority. Browser sessions stay in memory. User explicitly chose to create a separate free Supabase organization and will provide its name. Do not create the Aasha project in the existing Mind Grace organization or reuse its inactive clinic project. The previous Access test results below are historical; rerun the revised suite before publishing. No paid services were activated. See docs/13-free-deployment.md for the revised current runbook.


## Earlier work in this session: free deployment and tenant administration (2026-10-15)

This section supersedes conflicting historical status below. User authorized free-tier account setup and deployment; clinical rollout remains excluded.

### Changes

- Implemented `/staff` and `/api/v1/me`, plus tenant-admin membership read/grant/change/revoke through UI/API/D1. Roles: admin, supervisor, therapist, reception; no clinical privileges. Signed Cloudflare Access JWT validation uses jose 6.2.12; forwarded email headers are not trusted. Migration 0003 adds memberships and atomic audit records, revision checks and replay-safe operation IDs. Self-admin changes are denied. Tests use three tenants.
- Removed the unauthenticated demo booking endpoint. The local browser demo remains separate; staff information is never written to IndexedDB. Staff/API/Access routes are excluded from service-worker navigation fallback; staff responses are no-store.
- Added cross-platform preview deployment validation and `build:ci`; production deployment refuses. Disabled Worker request logging and preview-version URLs. Added setup guide `docs/13-free-deployment.md`; recorded ADR-011/012.
- Restored dependencies with `npm ci` (436 packages, approximately 10 minutes), added pinned jose and Node 22 type definitions. Preserved pre-existing duplicate-file removals and other cleanup; original brief/logo unchanged. No secret values were saved to the repository.

### Account work completed

- User approved Wrangler OAuth login; account matches the provided Cloudflare account. No pasted storage credentials were used. Revocation of those credentials was requested; completion is not independently verified.
- Created remote D1 `aasha-preview` in APAC, ID `e12915a9-419e-4a3c-baaf-4c7808d85680`; remotely applied migrations 0001, 0002 and 0003 successfully. No actual staff or patient rows were seeded.
- Initialized Workers & Pages; account subdomain is `comtedonatien-1cd.workers.dev`. Intended Worker hostname: `aasha-offline-preview.comtedonatien-1cd.workers.dev`.
- GitHub connector confirms `shirish-psych-ncr/TheraBuddy` is public and connected account has push/admin permissions. Visibility unchanged.

### Verification and remaining work

- `npm test`: PASS, 19 tests in 4 files. Covers signed/expired/forged tokens, issuer/audience checks, cross-tenant and revoked access, non-admin denial, CSRF, request validation, optimistic concurrency, idempotent replay and audit count. Real SQLite executes production membership SQL; this is not a claim of authenticated remote D1/browser coverage.
- `npm run build`: PASS after fixing request-response types and adding Node types; PWA generated. `npm run worker:check`: PASS dry run. `npm run test:integration`: PASS all 6 runtime checks with fresh local D1; no destructive clearing of shared local databases. `npm run check:docs` and `npm run audit`: PASS before final documentation update; final gate result will be recorded below.
- No live Worker release yet. Access Free onboarding, issuer/AUD, confirmed first administrator email, live login/permission tests and GitHub Builds connection are pending. The user was asked for non-secret setup identifiers. Browser control has been intermittent; in-app browser failed to connect, Chrome reached Workers dashboard and the Zero Trust onboarding loader.
- Scope remains synthetic. M1/M2 are not complete: assignment/clinical grants, full browser matrix, restore drill, live Free-plan identity performance and retention review remain open. Inventory statuses were not promoted.

Next step: complete Cloudflare Access Free onboarding and email allow policy for the intended hostname, fill preview issuer/AUD, bootstrap the confirmed centre admin outside source control, run `npm run deploy:preview`, verify live roles, then connect reviewed GitHub source to Workers Builds as documented.

## Historical sessions (may contain superseded status)

## Current session (2026-10-15, repository streamlining)

- Reconciled the surviving canonical files with the newer Worker/API baseline: modular `worker/index.ts` + `worker/api.ts`, D1 migration `0002_demo_scheduling.sql`, Cloudflare types, CI and the integration-test script are now the single source of truth.
- Removed accidental `(1)` copies of source, documentation, configuration, migration and test files. Added `scripts/audit-repo.mjs` and `npm run audit` so source duplication and local secret/database files fail early.
- Added `format:check` using the pinned Prettier version and ignored generated root icons and accidental duplicate export names. Generated `dist/`, `.wrangler/`, and local browser output remain build products, not source.
- Tightened the demo API typing by removing the remaining `any` cast from appointment filtering. The API remains synthetic and unauthenticated by design; it is not a clinical release.

### Verification for this session

Results: `npm run audit` PASS; `npm test` PASS (4/4); `npm run db:migrate:local` PASS (no pending migrations); `npm run worker:check` PASS; `npm run check:docs` PASS. `npm run typecheck` and `npm run build` are blocked by the interrupted dependency refresh leaving the local TypeScript binary unavailable; `npm ci` also exposed the lockfile drift and was stopped after the install stalled. `npm run format:check` reports pre-existing formatting drift in 17 files and remains a follow-up cleanup rather than a claimed pass.

The lockfile is now synchronized with `package.json`; rerun `npm ci` from a clean terminal before the next code change, then run typecheck/build and apply the pinned Prettier formatter to the reported files.

### Deployment preparation (2026-10-15)

- Added guarded `deploy:preview` and `deploy:production` scripts. They require a real environment-specific D1 ID and a working Wrangler login before publishing.
- Cloudflare authentication check could not run because the interrupted local dependency refresh removed the `.bin` shims; no remote account state was changed and no deployment was attempted.
- Next deployment action: restore dependencies with `npm ci`, run `npx wrangler login` in the user's Cloudflare account, create the approved preview D1 database, update only its environment ID, apply migrations remotely, and verify the synthetic health/booking endpoints.

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
