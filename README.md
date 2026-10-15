# Aasha / Universal Therapy Centre Platform

Planning baseline: 15 October 2026. React/Vite provides a device-local synthetic demo; `/staff` provides a separate Supabase Auth + D1 membership administration slice. Centre admins can manage their own team; clinical APIs remain disabled. A remote preview D1 database has been provisioned. Hosting uses GitHub → Cloudflare Workers Builds on Free plans, subject to provider quotas. Follow [free deployment and staff setup](docs/13-free-deployment.md) and the current handoff for verified deployment status. Aasha is a working brand; the platform supports independently configured centres.

## Start here

1. [AI editor instructions](AGENTS.md)
2. [Product scope and analysis](docs/01-product.md)
3. [Architecture and decisions](docs/02-architecture.md)
4. [Data model and API contracts](docs/03-data-and-api.md)
5. [Permissions and clinical governance](docs/04-security-and-clinical.md)
6. [UX and workflows](docs/05-ux.md)
7. [Implementation plan](docs/06-roadmap.md)
8. [Verification and release gates](docs/07-verification.md)
9. [Tools, plugins and Windows setup](docs/08-tooling.md)
10. [Operations and recovery](docs/09-operations.md)
11. [Current handoff and open decisions](docs/10-handoff.md)
12. [Complete source screen inventory](docs/11-screen-inventory.md)
13. [Source evidence and external references](docs/12-evidence.md)

The original [brief](Early%20Intervention%20Tracking%20App.txt) remains unchanged. It is a conversation export containing repeated proposals, embedded sample prompts, UI text and earlier alternatives, not an executable specification. The numbered documents consolidate it; proposed engineering choices are labeled as such.

## Documentation checks

From this directory in PowerShell:

```powershell
node scripts/map-brief.mjs --check
node scripts/check-docs.mjs
```

These verify source-inventory coverage and local Markdown links. Local development requires Node 22.14+ (see `.nvmrc`): `npm ci`, then `npm run dev` (UI), `npm run worker:dev` (Worker + assets + local D1 on :8787), `npm run db:migrate:local`, `npm test`, `npm run build`, `npm run worker:check`. Remote hosting is selected as Cloudflare Workers Static Assets via Cloudflare Builds on the Free plan (docs/09-operations.md); deployment awaits account authorization.
