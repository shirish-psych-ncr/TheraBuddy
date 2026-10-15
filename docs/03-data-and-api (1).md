# Data model and API contracts

Design only. Migrations, generated schema and endpoint tests remain to be implemented.

## Entity map

| Aggregate | Entities | Essential rules |
|---|---|---|
| Identity | users, sessions, invitations, recovery_events | Global identity; scoped memberships; short-lived single-use invitation/recovery credentials |
| Tenant | organizations, memberships, role_grants, branches, configuration_versions | Unique user/organization membership; revocation takes effect on next request |
| Staff | staff_profiles, branch_assignments, shifts, leave | Employment/profile belongs to organization; history survives departure |
| Child | children, caregivers, child_caregivers, care_team_assignments | DOB as date; access depends on membership, role and assignment |
| Clinical context | consent_records, clinical_profile_versions, precautions | Purpose, source, validity and provenance; no blanket consent boolean |
| Scheduling | appointments, appointment_participants, room_reservations | Planned intervals distinct from actual delivery; overlap prevention is atomic |
| Attendance | child_attendance, staff_attendance | Corrections retain prior value, actor and reason |
| Session | clinical_sessions, session_activities, session_observations | Appointment link; actual start/end; definition versions frozen |
| Assessment | assessments, assessment_findings, instrument_versions | Source and licensed-use status; finalization and amendments |
| Goal | child_goals, goal_versions, measurement_protocols, measurements | Unit, denominator, support, context and protocol version required where applicable |
| Notes | clinical_notes, note_versions, signatures, addenda | Finalized snapshot immutable via application; addenda reference original |
| Catalogue | observation/intervention/activity/equipment definitions and versions | Global reviewed definitions separate from tenant-local definitions |
| Catalogue links | observation_interventions, intervention_activities, activity_goals, activity_equipment | Versioned many-to-many links; required vs optional vs reviewed substitutes |
| Inventory | equipment_units, availability_events, maintenance_records | Catalogue presence does not imply ownership or usability |
| Collaboration | handoffs, review_requests, reports, report_versions | Recipient permission checked; report snapshots link to source records |
| Governance | audit_events, idempotency_records, export_jobs | Append-only application audit; tenant scope; sensitive payload minimization |

Tenant-owned tables carry organization_id. Use composite foreign keys or equivalent constraints to prevent references to records in another tenant; a globally unique UUID alone does not enforce this. Index common queries beginning with organization_id and their filter/sort columns. Decide cascade behavior explicitly: never cascade-delete signed clinical history when removing a membership or catalogue item.

Store timestamps in UTC, retain the organization's IANA timezone for display/recurrence, and store DOB as a calendar date. Use server timestamps for signatures and audits. Do not calculate age by dividing elapsed milliseconds by 365 days.

## Measurement contract

Each value records goal_version_id, protocol_version_id, session_activity_id, observed_at, observer, source, status (observed/not_observed/not_applicable/unable_to_assess), measure kind, value, unit, denominator when applicable, support type/amount and context. Only observed values enter outcome calculations. Validate numerator <= denominator and denominator > 0 for proportions; zero opportunities yields no percentage. Never average incompatible measures or connect a chart across changed protocols without marking the break. Caregiver reports remain distinguishable from direct observations.

## API conventions

Authenticated routes: /api/v1/organizations/:organizationId/...

| Route family | Operations | Invariants |
|---|---|---|
| /me, /auth/* | Identity/session lifecycle | No tenant data before authentication; protected recovery |
| /organizations, /memberships | List memberships, bootstrap centre, revoke | Creation grants only explicitly intended roles; no client-supplied privilege escalation |
| /configuration | Read/versioned update | Change impact, schema validation, expected version |
| /children, /staff | Scoped directory/detail/create/update | Allowlisted fields, bounded pagination, care-team restrictions |
| /appointments | Create/reschedule/cancel | Resource scope, atomic conflict check, idempotency |
| /attendance | Check-in/out/correction | Separate child/staff permissions and actual delivery |
| /sessions | Start/update/complete | Delivered-service state separate from note status |
| /sessions/:id/activities | Record measurements and observations | Goal/definition compatibility and tenant relationship checks |
| /notes/:id/sign, /notes/:id/addenda | Finalize/amend | Signer capability, current version, atomic audit |
| /goals, /assessments | Draft/review/finalize | Versioned protocol and clinically authorized transitions |
| /suggestions | Retrieve reviewed candidates | No diagnosis; missing prerequisites remain visible |
| /reports | Generate/approve/export | Current access plus immutable source snapshot |

Use a consistent error envelope: code, safe message, fieldErrors if relevant, requestId. Never include clinical payloads or stack traces in errors. Use 401 for unauthenticated, 403 for a known forbidden action, 404 for unavailable record identity, 409 for version/state conflict, 422 for domain validation, 429 for rate limiting and 503 for unavailable infrastructure. Clients must not show Saved after an error.

Mutation contracts include expectedVersion and an idempotency key where retries could duplicate work. Scope replay records by organization, actor and operation; bind keys to request hashes and reject mismatched payload reuse. Apply clinical data mutation, version change and its audit atomically. Define replay retention during implementation.

## Lifecycle contracts

| Object | Normal path | Exceptions / guard |
|---|---|---|
| Centre | draft → active → restricted/closed | Suspension revokes actions without erasing history |
| Membership | invited → active → revoked | Leave does not equal loss of authorship |
| Appointment | scheduled → checked_in → completed | cancelled/no_show; reschedule records old interval |
| Session | not_started → in_progress → completed | interrupted/resumed/cancelled; completed need not mean signed |
| Note | draft → review_ready → signed | Review can return draft; signed content receives addenda only |
| Goal | proposed → active → achieved | paused/discontinued/superseded with reason |
| Catalogue | draft → in_review → approved → retired | Retired versions remain readable in historical records |

Create explicit transition functions and test forbidden transitions. Child enrollment status and clinical-intake readiness are separate fields.
