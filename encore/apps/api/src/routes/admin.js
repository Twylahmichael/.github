import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireOwner, login, logout } from '../auth.js';
import { audit } from '../audit.js';

export const adminRouter = Router();

adminRouter.post('/login', login);
adminRouter.post('/logout', logout);

adminRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Dashboard: today + this week bookings, unassigned class slots.
adminRouter.get('/dashboard', requireAuth, (_req, res) => {
  const today = db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE session_date = date('now')`).get().n;
  const week  = db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE session_date BETWEEN date('now') AND date('now','+6 days')`).get().n;
  const unassigned = db.prepare(`SELECT id, day_of_week, start_time, class_name FROM class_slots WHERE coach_id IS NULL AND active = 1`).all();
  res.json({ bookingsToday: today, bookingsThisWeek: week, unassignedSlots: unassigned });
});

// Schedule — inline coach reassignment is the hot path.
adminRouter.patch('/schedule/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const before = db.prepare(`SELECT * FROM class_slots WHERE id = ?`).get(id);
  if (!before) return res.status(404).json({ error: 'not found' });
  const fields = ['coach_id', 'class_name', 'day_of_week', 'start_time', 'end_time', 'capacity', 'notes', 'active'];
  const patch = Object.fromEntries(fields.filter(k => k in req.body).map(k => [k, req.body[k]]));
  const sets = Object.keys(patch).map(k => `${k} = @${k}`).join(', ');
  if (!sets) return res.json({ slot: before });
  db.prepare(`UPDATE class_slots SET ${sets} WHERE id = @id`).run({ ...patch, id });
  const after = db.prepare(`SELECT * FROM class_slots WHERE id = ?`).get(id);
  audit(req, 'update', 'class_slot', id, before, after);
  res.json({ slot: after });
});

// (Coaches, events, gallery, settings, users, audit routes follow the same shape.
// Kept out of this scaffold to stay honest about what's actually built vs. planned.)

adminRouter.get('/audit', requireOwner, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = db.prepare(`SELECT id, actor_email, action, entity, entity_id, at FROM audit_log ORDER BY at DESC LIMIT ?`).all(limit);
  res.json({ entries: rows });
});
