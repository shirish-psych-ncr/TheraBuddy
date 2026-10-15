# Plugins, local tooling and setup

Verified 2026-10-15. These are distinct layers: editor plugins provide development access, skills guide an editor, npm dependencies run/build the application, and cloud accounts host it. Installing a plugin does not configure hosting.

## Plugin assessment

| Capability | Observed state | Plan |
|---|---|---|
| GitHub | Plugin search reports installed/enabled | Use when a target repository exists; repo access/auth not verified |
| Context7 | Installed/enabled; Workers library lookup succeeded | Use for current library documentation; no additional installation needed |
| Supabase | Installed/enabled | Not needed for selected D1 architecture; do not create a project |
| Cloudflare | Exact plugin search returned no matches | Use available Cloudflare/Wrangler skills and project-local CLI; this is not proof no plugin exists anywhere |
| Browser automation | Available browser tool and browser/Playwright skills | Use after local app exists; no application browser test performed yet |
| Security review | Available security skills/tools | Use for auth/tenant review at the relevant implementation milestone |
| Figma/Stitch/design plugins | Available in this editor | Optional for a dedicated design task; not required to implement the brief |

No new plugin installation was necessary or performed. No account permission settings were changed. No cloud project was provisioned. More integrations can be searched in the [plugin directory](https://chatgpt.com/plugins) if a concrete gap emerges. Never install unrelated services simply because search returns them.

## Local environment

- Windows PowerShell; project directory C:\Users\lenovo\Documents\mind_grace\_aasha.
- node.exe: C:\Python\apt\nodejs\node.exe; observed v22.14.0.
- npm.cmd: same directory; observed 10.9.2.
- Git: observed 2.54.0.windows.1. Initial folder is not a repository.
- gh and wrangler were not found on PATH. A project-local Wrangler is preferred over global installation.
- Registry metadata checked successfully: Vite 8.3.4 declares `^20.19.0 || >=22.12.0`; Wrangler 4.151.0 and create-cloudflare 2.74.0 declare `>=22.0.0`. Node 22.14.0 satisfies these ranges. @cloudflare/vite-plugin resolves to 1.64.0; the query returned no engines field. This verifies declared metadata, not a successful install/build or all transitive dependencies. Recheck compatibility when scaffolding.
- PowerShell login profiles delayed tool execution and emitted PSReadLine warnings. Use non-login shell execution for automation and npm.cmd when PowerShell npm shims interfere.

## Next setup sequence

1. Recheck node/npm and registry connectivity. Inspect engine ranges for create-cloudflare, Vite, Wrangler and @cloudflare/vite-plugin together. Select a supported Node version and pin it; do not replace shared machine Node silently.
2. Bootstrap a reviewed React/TypeScript Cloudflare project in a temporary directory; the official command form is `npm create cloudflare@latest -- my-react-app --framework=react`. Inspect current prompts/options and decline remote deployment. Integrate reviewed output into this folder without replacing source materials.
3. Install and pin project-local dependencies with a lockfile. Add .gitignore before Git initialization/staging: node_modules, .env variants except examples, .dev.vars, .wrangler, build/test output, local DBs, exports and browser auth state. Never stage all files before reviewing them.
4. Configure local D1, migrations, synthetic seeds, shared validation and scripts. Generate Workers types from the actual config. Keep local and remote database identities separate.
5. Verify dev/build/tests locally. Confirm browser tooling can reach the server. Use local emulation first; a running CLI alone is not application proof.
6. When a GitHub repository is selected, verify access, establish a remote and CI. Do not choose public visibility or publish the raw brief without review.
7. Before remote synthetic demo deployment, confirm the Cloudflare account/Free plan and target Worker/database. Complete interactive login if necessary; never paste tokens into chat. Record only non-secret binding names and deployment URLs.

## Planned dependencies

Use the brief's React, TypeScript, Vite, Cloudflare Vite plugin, Wrangler, Drizzle, Zod, React Hook Form, TanStack Query, Tailwind and shadcn/ui. Vitest and Playwright provide tests. Choose the routing library and maintained auth library during M1; no auth package is approved yet. Evaluate licenses, maintenance, engines and Workers support before locking versions. No paid runtime API is needed for deterministic suggestions.

## Official references

- [React + Vite on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Vite requirements](https://vite.dev/guide/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 pricing and quota behavior](https://developers.cloudflare.com/d1/platform/pricing/)

These were fetched for planning; recheck when installing or deploying. Do not blindly execute commands copied from the original transcript.
