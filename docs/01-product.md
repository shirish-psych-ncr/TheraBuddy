# Product analysis and scope

## Observed starting point

The workspace initially contained only a 16,104-line conversation export and logo.png. It was not a Git repository. There was no package manifest, source tree, database, test suite, CI configuration or deployment configuration. The export repeats large sections, includes source names without reliable linked citations, and shifts from a clinic-specific form to a configurable SaaS. Extraction found 462 unique screen/state IDs across 19 families, each appearing twice; the source's approximate 360 count is inaccurate. These documents do not validate its clinical or legal claims.

## Product objective

Help early-intervention teams coordinate care and document what a child could do, with what support and under which conditions. Centre operations and clinical work share records but have distinct permissions. OT and SLT are the first disciplines; other disciplines are extension points, not fully supported at launch.

## Requirements map

| Requirement | Source anchors | First delivery | Later scope |
|---|---|---|---|
| Identity and tenant boundary | AUTH, ONB, PLT | Membership, organization switching, restricted access | Self-service SaaS onboarding/support |
| Configuration-driven centre | ONB, CFG | Identity, services, hours, rooms, equipment | Multi-branch change-impact workflows |
| Staff lifecycle | STF | Invite/enroll, permissions, availability, revoke | Leave, substitutions, competencies administration |
| Child-centred care | CHD | Child, caregivers, consent status, assigned care team | Transfers, discharge, retention requests |
| Operations | CAL, ATT, MST | Single appointment, separate child/staff attendance | Recurrence, makeup balances, bulk changes |
| Daily clinical work | THR | Entry, goals, activity measurements, exit, handoff, signing | Advanced collaboration and personalization |
| Baseline and progress | ASM, GOA | Baseline and goal-specific measures | Licensed instruments and richer review workflows |
| Reviewed knowledge | INT, ACT, EQP | Small versioned synthetic catalogue, availability | Full editorial pipeline and import tooling |
| Reports | RPT, COL | Reviewed session report and single-goal trend | Cohort analytics, authorized sharing |
| Reliability and privacy | SYS | Conflicts, errors, revocation, recovery tests | Secure offline clinical drafts |
| Public site and SaaS operations | PUB, PLT | Minimal entry and synthetic demo notice | Marketing, subscription operations if ever authorized |

## Scope tiers

**Foundation proof:** tenant isolation, auth feasibility, configuration and safe persistence. No clinical launch.

**First usable vertical slice:** three synthetic organizations (OT only, SLT only, integrated), one user with memberships in two organizations, staff and child setup, equipment selection, one appointment, distinct attendance, a measured session, signed note, amendment and report. A second organization must be inaccessible when membership or assignment is absent.

**Demo completion:** assessments, goal history, basic reviewed suggestions, operational dashboards, core accessibility and failure states. Public demo may contain only synthetic data and must not permit arbitrary real-data onboarding.

**Clinical pilot:** separate milestone requiring security, clinical governance, recovery, hosting suitability and jurisdiction review. A demo passing automated tests is insufficient.

**Expansion:** recurring schedules, imports, advanced inventory, additional disciplines, multilingual rollout, secure offline drafting, advanced analytics and external messaging. Preserve all source IDs in the inventory; deferral is not deletion.

## Conflicts resolved for planning

- Earlier Next.js/Supabase and Pages proposals yield to the explicit Workers Static Assets stack specification at source lines 8770–8866. The later repeated Pages discussion is not evidence of a new decision.
- A large checklist becomes an assessment/observation library; ordinary visits use context-relevant fields.
- Equipment ownership, usability, activity prerequisites and clinical appropriateness are separate checks.
- Configuring a centre does not establish permission to perform every clinical action.
- Goal outcomes are not a universal 1–5 score. Missing, unobserved, refused and zero are distinct values.
- No requirement implies a separate route for every screen ID. Many are dialogs, sections or states.

## Success measures to test with therapists

Measure completion time, correction rate, lost-draft incidents, unsigned-note backlog and ability to locate previous goal evidence. Baseline these during synthetic usability sessions before setting numerical targets. Never rank clinician quality by children's improvement scores or infer causal treatment effectiveness from descriptive trends.
