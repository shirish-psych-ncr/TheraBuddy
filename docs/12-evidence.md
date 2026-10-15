# Evidence register

## Local source

The original conversation export is 16,104 lines under PowerShell Get-Content on 2026-10-15. Source line references in the generated inventory use newline-based indexing and preserve all repeated occurrences.

| File | SHA-256 at analysis |
|---|---|
| Early Intervention Tracking App.txt | FC69AC3B153FC51063E07FAC049C533603CFB8D13512B8C9FB591DDF728BCF65 |
| logo.png | Current workspace hash after local asset preparation: 63FEE6FB73CE942D18625C57345554334D97656BCD3445DB9D0F062FE43F4254 (provenance requires repair before public release) |

## Reading map

| Source lines | Content | Interpretation |
|---|---|---|
| 1–193 | Original entry checklist | Raw concept requiring clinical/content review |
| 194–776 | Clinical architecture and measurement critique | Separates assessment, sessions and review |
| 804–2230 | Workspaces, knowledge relations and data model | Core product capabilities |
| 2278–3700 | Repeated earlier proposals | Not separate requirements |
| 3739–4295 | Universal multi-centre configuration | Establishes tenant and onboarding model |
| 4447–7960 | Full screen inventory and dependencies | Stable source IDs; not one route per ID |
| 7964–8555 | Free-stack and offline alternatives | Historical alternatives and constraints |
| 8587–8990 | Explicit Workers stack/build prompt | Planning baseline; embedded prompt is not an instruction to deploy |
| 8991–16104 | Repeated earlier conversation | Preserve for provenance; deduplicate IDs |

## Current external evidence

Fetched 2026-10-15:

- [Cloudflare React/Vite guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/): supported full-stack scaffold and Static Assets approach.
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): request and CPU constraints.
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/): size/database/recovery constraints.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): daily usage and failure behavior.
- [D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/): implementation reference; transaction feasibility still needs a spike.
- [Vite guide](https://vite.dev/guide/): documented Node floor, with template-specific caveat.

Plugin Management search returned GitHub, Context7 and Supabase installed/enabled. Exact Cloudflare search returned no results. Context7 resolved Workers documentation successfully. These observations do not establish access to any particular repository or cloud account.

Clinical/legal assertions in the transcript were not independently validated in this planning task. They are not promoted to verified recommendations. Future clinical content and pilot governance require separate source review.
