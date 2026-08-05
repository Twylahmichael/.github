-- Phase 2: members + real bookings.
-- Adds members table and extends bookings with member_id, cancellation fields,
-- constrained source/status enums, and a per-member-per-session uniqueness guard.

CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phone         TEXT NOT NULL UNIQUE,        -- E.164, "+254712345678"
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- SQLite ALTER is limited (no add-constraint, no drop-column). To swap the
-- bookings table shape while preserving Phase 1 rows we rename and rebuild.
ALTER TABLE bookings RENAME TO bookings_v1;

CREATE TABLE bookings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id       INTEGER NOT NULL REFERENCES class_slots(id) ON DELETE CASCADE,
  session_date  TEXT NOT NULL,
  member_id     INTEGER REFERENCES members(id) ON DELETE SET NULL,
  member_name   TEXT NOT NULL,
  member_phone  TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'portal' CHECK (source IN ('portal','whatsapp','walk-in','admin')),
  status        TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','no-show','attended')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  cancelled_at  TEXT,
  cancel_reason TEXT,
  UNIQUE (slot_id, session_date, member_id)
);

-- Migrate Phase 1 rows. Old 'pending' status maps to 'confirmed'.
INSERT INTO bookings (id, slot_id, session_date, member_name, member_phone, source, status, created_at)
SELECT id, slot_id, session_date, member_name, member_phone,
       CASE WHEN source IN ('portal','whatsapp','walk-in','admin') THEN source ELSE 'whatsapp' END,
       CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
       created_at
FROM bookings_v1;

DROP TABLE bookings_v1;

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(session_date, slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id, session_date);
