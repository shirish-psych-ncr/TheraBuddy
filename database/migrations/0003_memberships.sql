CREATE TABLE memberships (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL CHECK(email = lower(email)),
  role TEXT NOT NULL CHECK(role IN ('admin','supervisor','therapist','reception')),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 0,
  last_operation TEXT NOT NULL,
  PRIMARY KEY (organization_id, email)
);
CREATE INDEX memberships_identity ON memberships(email, active);
CREATE TABLE membership_audit (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  operation TEXT NOT NULL,
  actor TEXT NOT NULL,
  target TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, operation)
);
INSERT INTO schema_info VALUES (3, 'Tenant membership and administration; synthetic release only');
