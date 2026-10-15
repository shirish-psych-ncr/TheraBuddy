# Delivery plan

The scaffold, synthetic local demo and a bounded membership-administration slice exist. M1/M2 are incomplete: live identity/browser, recovery and clinical authorization evidence remain outstanding. Use the current handoff for exact checks. Work proceeds by dependency and evidence, not a promise of fixed dates.

| Milestone | Deliverable | Dependencies | Exit evidence |
|---|---|---|---|
| M0 | Source map, architecture, AI guidance, tooling assessment | Brief | Inventory and links pass; open decisions explicit |
| M1 | Reproducible scaffold and technical spikes | M0 | Compatible Node/packages, local Worker/D1, build, auth feasibility, atomic-write and restore proofs |
| M2 | Identity, membership, configuration, role enforcement | M1 | Three tenants; revoked, unassigned and cross-tenant access denied |
| M3 | Staff, children, caregivers, consent, care team and equipment | M2 | Create/edit/read through UI and API; tenant and field validation tests |
| M4 | Single appointment, conflicts, separate attendance | M3 | Parallel booking rejected; staff/child presence and delivery remain distinct |
| M5 | Goal/baseline, activity measurements, session, signed note/addendum | M4 | Complete therapy journey; conflict/retry tests; history immutable |
| M6 | Assessments, reviewed catalogue suggestions and reports | M5 | Provenance, eligibility, versioning, sparse-data charts and permissioned exports |
| M7 | Synthetic demo hardening | M6 | Browser matrix, isolation suite, restore drill, quota failures, accessible core journeys |
| M8 | Clinical pilot readiness | M7 + accountable owners | Independent security/clinical review; applicable legal/hosting decisions; operational support |
| M9 | Expansion in prioritized batches | Evidence from pilot | Recurrence, branches, imports, collaboration, full inventory coverage as approved |

## First implementation task

Read the handoff; inspect current filesystem and tools again. Establish a compatible project-local toolchain and Git repository. Scaffold in a temporary directory, review generated files, then integrate without overwriting these docs or the brief. Reject scaffold deployment prompts. Pin dependencies and add environment examples, .gitignore and local D1 configuration. Build one public shell and a local health API. Prove local migrations and restore before adding clinical screens.

Define and implement package scripts for dev, build, typecheck, lint, test, test:integration, test:e2e and db:migrate:local. These names are a planned contract, not commands currently available. Authentication feasibility and atomic booking/signing are explicit M1 spikes; do not fabricate production auth while they remain unresolved.

## Work loop

For each feature: select source IDs → write acceptance criteria → implement schema/API/policy/UI → exercise failure states → run relevant tests → inspect in browser → update evidence/status. Keep one small end-to-end batch active. Security and clinical-review findings take precedence over expanding decorative screens.

## Feature completion contract

Done means working UI, persisted data, server permission checks, tested error states, meaningful automated checks, browser verification and updated docs. Deployed means separately observed remote behavior. A hidden menu item, placeholder chart or seeded dashboard does not satisfy a feature.

## Deferred scope register

Paid services and billing activation are excluded by the brief. Subscription screens remain source backlog only. Uploads/media, secure offline clinical drafts, automated messaging, AI inference, licensed assessment libraries, GPS attendance, public self-service signup and advanced scheduling need separate acceptance and operational decisions. No deferred feature may appear as functional in the demo.
