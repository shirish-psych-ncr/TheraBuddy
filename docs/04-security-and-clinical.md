# Security, permissions and clinical governance

This is a product control plan, not legal advice or clinical validation. A qualified reviewer must determine applicable jurisdiction, obligations and content suitability before real records enter the app.

## Authorization matrix

| Capability | Platform operator | Centre administrator | Supervisor | Assigned therapist | Reception/inventory |
|---|---|---|---|---|---|
| Provision tenant, platform health | Yes | Own settings only | No | No | No |
| Invite/revoke staff | No routine tenant authority | Own tenant | Only explicit grant | No | No |
| Scheduling and attendance | No routine access | Own tenant | If granted | Own work/caseload | Operational grant only |
| Clinical record read | No routine access | Only separate clinical grant | Authorized scope | Assigned child/scope | No |
| Clinical note edit | No | Only as authorized clinician | Authorized work | Own drafts in scope | No |
| Clinical sign/review | No | Separate credential/capability | Within authorized discipline | Own authorized work | No |
| Record export | No routine access | Separate grant and purpose | Separate grant | Separate grant | No |
| Equipment management | Global definitions only | Own inventory | If granted | Read/use authorized items | Inventory grant |

Roles compose capabilities; ownership is not clinical qualification. Check organization membership, account status, role grant, child assignment, discipline scope, record state and action prerequisites on the server. Support access, if later added, must be time-bound, justified and separately audited.

## Threats and required evidence

| Threat | Control | Proof |
|---|---|---|
| Cross-tenant ID substitution | Scoped repositories and cross-tenant FK protection | Direct API attempts across three tenants fail |
| Role escalation/mass assignment | Server-controlled role changes and field allowlists | Therapist cannot grant own sign/export/admin rights |
| Revoked user or stale organization response | Session/membership recheck and client cache clearing | Previously loaded URLs and mutations fail after revocation |
| CSRF/session theft/brute force | Maintained auth, secure cookies, origin/CSRF checks, throttling | Auth test suite; no secrets in logs |
| Concurrent note overwrite or duplicate delivery | Version guards, idempotency, atomic writes | Parallel edits yield conflict; retries yield one result |
| Signed-history alteration | Immutable application workflow and audited addenda | Original snapshot remains identical after amendment |
| Patient data in browser cache | No-store clinical responses; service-worker exclusions | Cache/IndexedDB inspection on logout and tenant switch |
| Export leakage | Purpose/scoped permission, bounded output, expiry | Forbidden export denied; CSV formula cells neutralized |
| Supply-chain or upload abuse | Pinned dependencies, review; uploads deferred | Lockfile review; no unrestricted upload route |

Do not describe a database as tamper-proof: infrastructure administrators can have access. Audit immutability claims must specify the application boundary and future external integrity controls.

## Clinical content rules

Separate observed behavior, caregiver report, established diagnosis and clinician interpretation. Use descriptive entry states rather than claiming a vagal mechanism from behavior. No preselected diagnosis or treatment. Checkboxes left empty mean unknown/not recorded, not absent. Preserve strengths, communication preferences, assent/distress and meaningful participation; do not treat eye contact or harmless stimming as automatic targets.

Each catalogue version needs author, qualified reviewer, discipline, evidence links, review date, applicability, precautions, prerequisites, permitted measures and approval state. Demo fixtures must be labeled synthetic and must not masquerade as reviewed clinical protocols. Imported assessment content requires a license check; store permitted scores and metadata without copying protected instruments.

Suggestions filter to approved versions, authorized discipline, active goal and known prerequisites, then disclose matching observations, equipment readiness and unresolved information. Unknown prerequisites must not be assumed satisfied. Clinicians choose or reject candidates with reasons. Equipment availability alone cannot authorize an intervention. Never generate an autonomous intervention for acute distress.

## Before live clinical use

Assign accountable clinical and data-protection owners. Confirm centre authorization, guardian relationships, consent purposes, record retention, correction/access processes, breach response, hosting/data-location requirements and contracts. Verify current official law and commencement details at that time; the source export's DPDP assertions are not evidence of compliance. Do not promise HIPAA/DPDP compliance from technology selection.

Never send clinical records to development plugins or model tools by default. Use synthetic examples in issues, tests, screenshots and support reports.
