# Aasha / Universal Therapy Centre Platform

Planning baseline: 15 October 2026. This folder contains a product brief, supplied logo, and engineering guidance. **There is no application, database, deployment, or passing application test suite yet.** Aasha is the working project name and a possible centre brand; the product must support independently configured centres.

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

The original [brief](Early%20Intervention%20Tracking%20App.txt) remains unchanged. The working logo has been prepared into web/PWA assets; its current provenance hash is recorded in docs/12-evidence.md and should be repaired or revalidated before public release. The brief is a conversation export containing repeated proposals, embedded sample prompts, UI text and earlier alternatives, not an executable specification. The numbered documents consolidate it; proposed engineering choices are labeled as such.

## Documentation checks

From this directory in PowerShell:

```powershell
node scripts/map-brief.mjs --check
node scripts/check-docs.mjs
```

These verify source-inventory coverage and local Markdown links. They do not test an application. No packages or external accounts are required. Future build commands are described as planned in the tooling guide and must not be reported as working until the app exists.
