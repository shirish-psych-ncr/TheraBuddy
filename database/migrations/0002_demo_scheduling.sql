-- Demo synthetic scheduling foundation (M1 atomic-booking spike).
-- Contains demo aliases only; no real clinical records. Server authorization is
-- still absent (M2), so this table backs the /api/v1/demo/* routes exclusively.

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
  minutes INTEGER NOT NULL CHECK (minutes BETWEEN 15 AND 120),
  therapist TEXT NOT NULL,
  room TEXT NOT NULL,
  attendance TEXT NOT NULL DEFAULT 'expected' CHECK (attendance IN ('expected','present','absent')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in-progress','completed','cancelled')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  PRIMARY KEY (organization_id, id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_day ON appointments (organization_id, date, start_minute);

INSERT OR IGNORE INTO organizations (id, name) VALUES ('demo-aasha', 'Aasha demo centre');

UPDATE schema_info SET description = 'Local foundation only; no clinical records' WHERE version = 1;
INSERT OR IGNORE INTO schema_info (version, description) VALUES (2, 'Demo scheduling foundation for the M1 atomic-booking spike; synthetic data only');
