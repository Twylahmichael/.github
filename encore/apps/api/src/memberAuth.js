// Members auth. Separate cookie namespace from admin/staff so a signed-in
// member cannot touch admin routes and vice versa.

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { db } from './db.js';

const COOKIE = 'encore_member';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days — members expect to stay signed in.

const SECRET = process.env.ENCORE_MEMBER_SECRET
  || process.env.ENCORE_SESSION_SECRET
  || crypto.randomBytes(32).toString('hex');

const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verify = (token) => {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Date.now()) return null;
  return payload;
};

const setSession = (res, member) => {
  const token = sign({ mid: member.id, exp: Date.now() + TTL_MS });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL_MS,
  });
};

// Normalise Kenyan mobile input to E.164 (+254…). Accepts "0712…", "254712…", "+254712…".
export const normalisePhone = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('254')) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return null;
};

export const signup = async (req, res, next) => {
  try {
    const { phone, name, email, password } = req.body || {};
    const normalised = normalisePhone(phone);
    if (!normalised) return res.status(400).json({ error: 'valid Kenyan phone number required' });
    if (!name || !password) return res.status(400).json({ error: 'name and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

    const existing = db.prepare('SELECT id FROM members WHERE phone = ?').get(normalised);
    if (existing) return res.status(409).json({ error: 'a member with this phone already exists' });

    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare(`
      INSERT INTO members (phone, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(normalised, name.trim(), email?.trim() || null, hash);

    const member = { id: result.lastInsertRowid, phone: normalised, name: name.trim(), email: email?.trim() || null };
    setSession(res, member);
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body || {};
    const normalised = normalisePhone(phone);
    if (!normalised || !password) return res.status(400).json({ error: 'phone and password required' });

    const member = db.prepare(`
      SELECT id, phone, name, email, password_hash, active
      FROM members WHERE phone = ?
    `).get(normalised);
    if (!member || !member.active) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, member.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    db.prepare("UPDATE members SET last_login_at = datetime('now') WHERE id = ?").run(member.id);
    setSession(res, member);
    res.json({ member: { id: member.id, phone: member.phone, name: member.name, email: member.email } });
  } catch (err) {
    next(err);
  }
};

export const logout = (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
};

export const requireMember = (req, res, next) => {
  const payload = verify(req.cookies?.[COOKIE]);
  if (!payload) return res.status(401).json({ error: 'unauthenticated' });
  const member = db.prepare(`
    SELECT id, phone, name, email, active FROM members WHERE id = ?
  `).get(payload.mid);
  if (!member || !member.active) return res.status(401).json({ error: 'unauthenticated' });
  req.member = member;
  next();
};

// Optional variant — attaches req.member if present but doesn't 401.
export const optionalMember = (req, _res, next) => {
  const payload = verify(req.cookies?.[COOKIE]);
  if (payload) {
    const member = db.prepare(`SELECT id, phone, name, email, active FROM members WHERE id = ?`).get(payload.mid);
    if (member && member.active) req.member = member;
  }
  next();
};
