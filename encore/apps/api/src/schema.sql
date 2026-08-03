-- Encore API schema (SQLite)
-- Kept small on purpose. Whole file backed up nightly.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Settings: WhatsApp number, message template, stats copy, etc.
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Coaches — photo, name, specialty.
CREATE TABLE IF NOT EXISTS coaches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  specialty   TEXT NOT NULL,
  photo_path  TEXT,
  bio         TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Weekly class slots. Coach can be NULL (dashboard flags this).
CREATE TABLE IF NOT EXISTS class_slots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TEXT NOT NULL,        -- "18:30"
  end_time    TEXT NOT NULL,
  class_name  TEXT NOT NULL,        -- "Yoga", "HIIT", ...
  coach_id    INTEGER REFERENCES coaches(id) ON DELETE SET NULL,
  capacity    INTEGER,
  notes       TEXT,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_class_slots_day ON class_slots(day_of_week, start_time);

-- Events (Saturday Dance Club, Polar Run Club, ad-hoc).
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  starts_at   TEXT NOT NULL,        -- ISO 8601
  ends_at     TEXT,
  location    TEXT,
  cover_path  TEXT,
  published   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

-- Gallery. Tabs = facility / classes / coaches / events.
CREATE TABLE IF NOT EXISTS gallery_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT NOT NULL CHECK (category IN ('facility','classes','coaches','events')),
  image_path  TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_items(category, sort_order);

-- Bookings — table structure now, wired up in Phase 2 with member accounts.
CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id     INTEGER NOT NULL REFERENCES class_slots(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,       -- "2026-08-05"
  member_name TEXT NOT NULL,
  member_phone TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'whatsapp',
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(session_date, slot_id);

-- Users (admin panel).
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner','staff')),
  name          TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- Append-only audit log.
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action      TEXT NOT NULL,        -- 'create' | 'update' | 'delete'
  entity      TEXT NOT NULL,        -- 'class_slot' | 'coach' | 'event' | 'gallery_item' | 'settings' | 'user'
  entity_id   TEXT,
  before_json TEXT,
  after_json  TEXT,
  at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at DESC);
