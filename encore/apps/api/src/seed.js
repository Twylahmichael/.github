// Seed with representative starter data — coaches, a weekly schedule, one owner user.
// Safe to re-run; only inserts what's missing.

import bcrypt from 'bcrypt';
import { db } from './db.js';

const settings = [
  ['whatsapp.number', '2547XXXXXXXX'],
  ['whatsapp.template', "Hi Encore, I'd like to book {class} on {day} at {time}"],
  ['stats.classes_weekly', '7'],
  ['stats.years_running', '3+'],
  ['stats.booking_hours', '24/7 Online Booking'],
  ['stats.daily_price_kes', '400'],
];
const upSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
for (const [k, v] of settings) upSetting.run(k, v);

const coaches = [
  { name: 'Coach TBD 1', specialty: 'HIIT & Strength' },
  { name: 'Coach TBD 2', specialty: 'Yoga & Mobility' },
  { name: 'Coach TBD 3', specialty: 'Dance Cardio' },
];
const insertCoach = db.prepare(`INSERT INTO coaches (name, specialty, sort_order) VALUES (?, ?, ?)`);
if (db.prepare(`SELECT COUNT(*) AS n FROM coaches`).get().n === 0) {
  coaches.forEach((c, i) => insertCoach.run(c.name, c.specialty, i));
}

// Mon–Sat = 1..6. 7 classes weekly — placeholder times, staff will edit.
const slots = [
  { day: 1, start: '06:00', end: '07:00', name: 'HIIT' },
  { day: 2, start: '18:30', end: '19:30', name: 'Yoga' },
  { day: 3, start: '06:00', end: '07:00', name: 'Strength' },
  { day: 4, start: '18:30', end: '19:30', name: 'Dance Cardio' },
  { day: 5, start: '06:00', end: '07:00', name: 'HIIT' },
  { day: 6, start: '09:00', end: '10:00', name: 'Dance Club' },
  { day: 6, start: '10:30', end: '11:30', name: 'Run Club' },
];
const insertSlot = db.prepare(`INSERT INTO class_slots (day_of_week, start_time, end_time, class_name) VALUES (?, ?, ?, ?)`);
if (db.prepare(`SELECT COUNT(*) AS n FROM class_slots`).get().n === 0) {
  for (const s of slots) insertSlot.run(s.day, s.start, s.end, s.name);
}

if (db.prepare(`SELECT COUNT(*) AS n FROM users`).get().n === 0) {
  const email = process.env.ENCORE_OWNER_EMAIL || 'owner@encore.local';
  const password = process.env.ENCORE_OWNER_PASSWORD || 'change-me-on-first-login';
  const hash = await bcrypt.hash(password, 12);
  db.prepare(`INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'owner', 'Owner')`).run(email, hash);
  console.log(`Owner user created: ${email}  (password: ${password})`);
  console.log(`Change this password immediately.`);
}

console.log('Seed complete.');
