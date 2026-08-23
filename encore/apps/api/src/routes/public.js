import { Router } from 'express';
import { db } from '../db.js';

export const publicRouter = Router();

const cache = (res) => res.set('Cache-Control', 'public, max-age=60');

publicRouter.get('/schedule', (_req, res) => {
  cache(res);
  const rows = db.prepare(`
    SELECT s.id, s.day_of_week, s.start_time, s.end_time, s.class_name,
           s.capacity, s.notes, s.coach_id,
           c.name AS coach_name, c.photo_path AS coach_photo
    FROM class_slots s
    LEFT JOIN coaches c ON c.id = s.coach_id
    WHERE s.active = 1
    ORDER BY s.day_of_week, s.start_time
  `).all();
  res.json({ slots: rows });
});

publicRouter.get('/coaches', (_req, res) => {
  cache(res);
  const rows = db.prepare(`
    SELECT id, name, specialty, photo_path, bio
    FROM coaches
    WHERE active = 1
    ORDER BY sort_order, name
  `).all();
  res.json({ coaches: rows });
});

publicRouter.get('/events', (_req, res) => {
  cache(res);
  const rows = db.prepare(`
    SELECT id, title, description, starts_at, ends_at, location, cover_path
    FROM events
    WHERE published = 1 AND (ends_at IS NULL OR ends_at >= datetime('now'))
    ORDER BY starts_at
  `).all();
  res.json({ events: rows });
});

publicRouter.get('/gallery', (req, res) => {
  cache(res);
  const category = req.query.category;
  const allowed = ['facility', 'classes', 'coaches', 'events'];
  const rows = category && allowed.includes(category)
    ? db.prepare(`SELECT id, category, image_path, alt_text FROM gallery_items WHERE category = ? ORDER BY sort_order`).all(category)
    : db.prepare(`SELECT id, category, image_path, alt_text FROM gallery_items ORDER BY category, sort_order`).all();
  res.json({ items: rows });
});

publicRouter.get('/stats', (_req, res) => {
  cache(res);
  const settings = db.prepare(`SELECT key, value FROM settings WHERE key LIKE 'stats.%' OR key = 'whatsapp.number' OR key = 'whatsapp.template'`).all();
  const out = {};
  for (const { key, value } of settings) out[key] = value;
  res.json(out);
});
