# Free deployment and staff access

## Selected topology

GitHub source → GitHub Actions → GitHub Pages hosts the static synthetic PWA. A separate Cloudflare Worker hosts the secure staff portal and D1 API; Supabase Auth Free handles staff identity. The Pages `staff.html` entry links to that portal using the optional public repository variable `VITE_API_BASE`. Credentials and staff API traffic stay on the Worker origin. GitHub Pages cannot run the authorization/database API. Google Sheets is not used as a patient database or permission boundary.

Cloudflare Access was rejected because this account's onboarding requires a card. No card, paid plan, R2, SMS, paid AI or purchased domain is required by the selected application design. Free provider quotas remain finite. Do not enable billing or upgrades to bypass a quota.

Official sources checked 2026-10-15: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Supabase pricing](https://supabase.com/pricing), [Supabase sessions](https://supabase.com/docs/guides/auth/sessions), [current user verification](https://supabase.com/docs/reference/javascript/auth-getuser). Workers Builds Free includes 3,000 build minutes/month. Supabase Free includes 50,000 monthly active users and two active projects; inactive free projects may pause after one week. These are not unlimited-free or availability guarantees.

## Implemented slice

Related backlog: AUTH identity, STF membership, CFG centre access. These families are not complete.

- `/staff` signs in through Supabase with email/password. The browser sends passwords directly to Supabase, never to the Worker. Sessions stay in memory (`persistSession: false`); reloading requires sign-in.
- Every data request sends a bearer token. The Worker calls Supabase `getUser(token)` using only a publishable key, requires a confirmed non-anonymous user, then checks current D1 membership. Client/user metadata never grants a role. Missing configuration or identity-service failures deny data access.
- `/api/v1/me` lists only the user's active centres. Admins can grant/change/revoke membership in their own centre. Supervisor, therapist and reception roles cannot administer members. No role grants clinical signing/read/export in this release.
- Updates use version checks, operation IDs, transactional audit records and authority checks inside SQL. Self-edits are refused. Revocation is checked on every subsequent request. Platform operators without membership get no tenant access.
- Staff data is memory-only, cleared on logout/navigation/centre switch. API responses and `/staff` navigation are not cached by the service worker. Local synthetic demo data remains separate.
- The former unauthenticated booking API is removed. Public `/api/v1/health` is liveness only. Public `/api/v1/auth/config` exposes only the approved project URL and publishable key, never a secret or service-role key.

## Provisioning

1. Wrangler browser OAuth is already authorized. Never paste passwords, OTPs or tokens into chat/source.
2. Cloudflare Workers subdomain: `comtedonatien-1cd.workers.dev`. Intended app: `aasha-offline-preview.comtedonatien-1cd.workers.dev`.
3. D1 `aasha-preview` exists; migrations 0001–0003 applied remotely. Its non-secret ID is in `wrangler.jsonc`; do not create a duplicate.
4. User chose a **separate Supabase Free organization** for this app. Confirm its name/ID and $0 project cost before creation. Do not use the separate Mind Grace clinic project. No clinical tables or storage buckets are needed in Supabase.
5. Put the new project's public URL and `sb_publishable_...` key in `env.preview.vars.SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Never use a service-role/secret key. No Cloudflare Access subscription is needed.
6. In Supabase Auth, create the first confirmed staff account with a password entered privately by the user. Disable anonymous/public signup for this bounded staff release. Do not weaken email verification to make onboarding work. Built-in Supabase email has restrictive delivery/rate limits; this release does not promise email invitations or automated password recovery. Additional account provisioning/recovery is an operator task until an approved free mail/provider flow is implemented.
7. Bootstrap the first D1 centre administrator using the confirmed account email through an authorized database operation outside source control. No default login/password is seeded. Subsequent centre role changes use `/staff`.
8. Run `npm run deploy:preview`: local gates, configuration validation, remote migrations, then deploy. `deploy:production` intentionally refuses the synthetic release.
9. Verify live login, admin/non-admin behavior, cross-centre denial, membership revocation and storage. Local tests do not replace live evidence. When removing staff, revoke D1 membership first; upstream access tokens can have residual lifetime after sign-out.

## GitHub connection

Repository: `https://github.com/shirish-psych-ncr/TheraBuddy.git`, verified public. Preserve visibility and original brief/logo. Review all changes before pushing; no secrets or bootstrap account records belong in Git.

Connect it to the `aasha-offline-preview` Worker under Settings → Builds, granting the integration only this repository. Deployment branch: `main`; root: `/`; build command: `npm run build:ci`; deploy command: `node scripts/deploy-check.mjs preview`; Node: `.nvmrc` (22.14.0). Disable untrusted branch deployment. Cloudflare supplies its own build identity; no copied token in source or GitHub secrets is necessary. The deploy script runs the pinned CLI through Node on Windows/Linux and applies versioned preview migrations.

GitHub Actions runs verification only. Private repository Actions quotas and Cloudflare build quotas are separate; neither should trigger paid upgrades.

## Remaining release work

Clinical workflows, assignment-based clinical permissions, platform provisioning UI, invitation/recovery automation, restore/retention evidence, live identity performance and full browser coverage remain incomplete. Membership management is bounded to 100 rows/centre. The offline demo does not sync to D1 and is not a security boundary. No real patient records are authorized.

## Static-only deployment

`npm run build:pages` emits deployable `dist/index.html`, `dist/staff.html`, bundled assets, manifest and service worker with `/TheraBuddy/` paths. Set `AASHA_BASE` for another repository or custom-domain root. Select GitHub Actions under repository Settings → Pages, then run the Pages workflow or push main. The demo needs no Supabase or Cloudflare account to load; staff setup remains separate. Hash navigation provides stable shareable links and refresh support. GitHub Pages ignores `_headers`; Worker security headers apply only to Worker responses. Verify the deployed URL and installation independently after publishing.
