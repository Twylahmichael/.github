import { Router } from 'express';
import { db } from '../db.js';
import { signup, login, logout, requireMember } from '../memberAuth.js';

export const membersRouter = Router();

membersRouter.post('/signup', signup);
membersRouter.post('/login', login);
membersRouter.post('/logout', logout);

membersRouter.get('/me', requireMember, (req, res) => {
  res.json({ member: req.member });
});

// A member's personal calendar — upcoming first, then a bounded history.
membersRouter.get('/me/bookings', requireMember, (req, res) => {
  const upcoming = db.prepare(`
    SELECT b.id, b.session_date, b.status, b.created_at, b.cancelled_at,
           s.class_name, s.start_time, s.end_time, s.day_of_week,
           c.name AS coach_name
    FROM bookings b
    JOIN class_slots s ON s.id = b.slot_id
    LEFT JOIN coaches c ON c.id = s.coach_id
    WHERE b.member_id = ?
      AND b.session_date >= date('now')
      AND b.status IN ('confirmed','attended')
    ORDER BY b.session_date, s.start_time
  `).all(req.member.id);

  const past = db.prepare(`
    SELECT b.id, b.session_date, b.status, b.cancelled_at,
           s.class_name, s.start_time, s.end_time
    FROM bookings b
    JOIN class_slots s ON s.id = b.slot_id
    WHERE b.member_id = ?
      AND (b.session_date < date('now') OR b.status = 'cancelled')
    ORDER BY b.session_date DESC, s.start_time DESC
    LIMIT 20
  `).all(req.member.id);

  res.json({ upcoming, past });
});

// Book a slot for a specific date. Date must be the next occurrence of that
// slot's day_of_week (or later), and the slot's capacity — if set — must have room.
membersRouter.post('/me/bookings', requireMember, (req, res, next) => {
  try {
    const slotId = Number(req.body?.slot_id);
    const sessionDate = String(req.body?.session_date || '').trim();
    if (!slotId || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      return res.status(400).json({ error: 'slot_id and session_date (YYYY-MM-DD) required' });
    }

    const slot = db.prepare('SELECT id, day_of_week, capacity, active FROM class_slots WHERE id = ?').get(slotId);
    if (!slot || !slot.active) return res.status(404).json({ error: 'class not found' });

    const date = new Date(`${sessionDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'invalid session_date' });
    if (date < new Date(new Date().toDateString())) return res.status(400).json({ error: 'cannot book a past date' });
    if (date.getDay() !== slot.day_of_week) return res.status(400).json({ error: "session_date doesn't match the class day" });

    if (slot.capacity != null) {
      const taken = db.prepare(`
        SELECT COUNT(*) AS n FROM bookings
        WHERE slot_id = ? AND session_date = ? AND status IN ('confirmed','attended')
      `).get(slotId, sessionDate).n;
      if (taken >= slot.capacity) return res.status(409).json({ error: 'class is full' });
    }

    try {
      const result = db.prepare(`
        INSERT INTO bookings (slot_id, session_date, member_id, member_name, member_phone, source, status)
        VALUES (?, ?, ?, ?, ?, 'portal', 'confirmed')
      `).run(slotId, sessionDate, req.member.id, req.member.name, req.member.phone);
      res.status(201).json({ booking_id: result.lastInsertRowid });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'you already have a booking for this class' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// Cancel — sets status, doesn't delete. Members can only cancel their own,
// and only if the session hasn't started yet.
membersRouter.delete('/me/bookings/:id', requireMember, (req, res) => {
  const id = Number(req.params.id);
  const booking = db.prepare(`
    SELECT b.id, b.member_id, b.session_date, b.status, s.start_time
    FROM bookings b JOIN class_slots s ON s.id = b.slot_id
    WHERE b.id = ?
  `).get(id);
  if (!booking || booking.member_id !== req.member.id) return res.status(404).json({ error: 'booking not found' });
  if (booking.status !== 'confirmed') return res.status(409).json({ error: 'already ' + booking.status });

  const sessionStart = new Date(`${booking.session_date}T${booking.start_time}:00`);
  if (sessionStart < new Date()) return res.status(409).json({ error: 'session has already started' });

  db.prepare(`
    UPDATE bookings
    SET status = 'cancelled', cancelled_at = datetime('now'), cancel_reason = ?
    WHERE id = ?
  `).run(String(req.body?.reason || '').slice(0, 200) || null, id);
  res.json({ ok: true });
});
