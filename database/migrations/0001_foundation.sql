CREATE TABLE IF NOT EXISTS schema_info (version INTEGER PRIMARY KEY, description TEXT NOT NULL);
INSERT OR IGNORE INTO schema_info VALUES (1, 'Local foundation only; no clinical records');
