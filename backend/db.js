const Database = require("better-sqlite3");

const db = new Database("traceql.db"); 

// Better concurrency behavior with WAL mode
db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  service TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  traceId TEXT,
  spanId TEXT,
  parentSpanId TEXT,
  durationMs INTEGER,
  tagsJson TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_trace ON events(traceId);

CREATE VIRTUAL TABLE IF NOT EXISTS events_fts
USING fts5(id, message, content='');

CREATE TRIGGER IF NOT EXISTS events_ai
AFTER INSERT ON events
BEGIN
  INSERT INTO events_fts(id, message)
  VALUES (new.id, new.message);
END;
`);

module.exports = { db };