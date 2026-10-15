# Verification and release gates

No application tests have run because there is no app. This file defines future evidence requirements.

## Synthetic fixtures

Create three independent centres: OT only, SLT only and integrated. Include one dual-membership therapist, one revoked member, one receptionist, a supervisor, an unassigned therapist, children with matching display names across centres, missing consent, missing baseline, a retired activity version, maintenance equipment and conflicting appointments. Use invented identities and no real contact addresses.

## Test matrix

| ID | Layer | Required scenario | Pass condition |
|---|---|---|---|
| T01 | API/DB | Replace tenant or child ID in read/write/search/export | No data disclosed or mutated |
| T02 | API | Admin vs clinical signer; receptionist vs therapist | Separate capabilities enforced |
| T03 | Auth/browser | Revoke membership; switch organization with pending request | Future writes fail; stale result never renders in new tenant |
| T04 | DB/concurrency | Two simultaneous bookings sharing child, room or therapist | Exactly one overlapping booking accepted |
| T05 | API | Retry start/check-in/sign with same operation key | One mutation/audit result; mismatched payload rejected |
| T06 | DB/API | Concurrent edit then sign | Stale version conflicts; no lost update |
| T07 | Clinical | Addendum after signed note | Original bytes/author/time preserved; linked amendment visible |
| T08 | Measurement | Zero denominator, missing value, changed protocol, support differences | No invented percentage or misleading trend |
| T09 | Catalogue | Retired/unreviewed item, unknown prerequisite, missing equipment | Not silently eligible; explanation matches data |
| T10 | Browser | Offline, 401, 409, 429, 503, quota failure | No false Saved state; clear next action |
| T11 | Browser/storage | Logout, worker update, organization switch | No persistent patient cache or sensitive stale display |
| T12 | Operations | Fresh migration and export/restore | Referential integrity, tenant boundaries and signed snapshots match |
| T13 | Browser/a11y | Keyboard, zoom, phone/tablet/desktop, reduced motion | Core workflow operable; no clipped essential controls |
| T14 | Reporting | Unpermitted export, formula-like strings, large dataset | Access denied or safe bounded export with correct scope |
| T15 | Configuration | Disable discipline; change defaults; revoke staff | Historical data retained; future impact surfaced |
| T16 | Delivery | Deep-link reload and unknown /api route | SPA loads only for frontend; API remains JSON |

Use Vitest for domain rules, Worker-runtime integration tests for D1 and authorization, and Playwright for real journeys. UI checks alone cannot prove tenant isolation. Run browser tests on Chromium, Firefox and WebKit where supported; supplement with actual supported mobile-device checks before pilot claims. Record untested browsers explicitly.

## Release gates

- M1: reproducible install/build; locked dependency engines; auth and transaction spikes resolved.
- M5: T01–T08 pass for the full vertical slice; session completion remains distinct from signature.
- M7: all applicable T01–T16 pass; synthetic-demo scope visibly enforced; restore drill and no accidental paid products.
- M8: named owners sign off security findings, clinical library, privacy/consent, deployment region suitability, continuity, retention, incident response and support. Reverify current authoritative legal requirements rather than reusing the export.

Store evidence as date, revision, environment, command, result, report location and unresolved issues. Test only synthetic records. Avoid redundant runs after unchanged passing results; rerun affected coverage after fixes. Do not turn manual reviewer sign-off into a fake automated checkbox.
