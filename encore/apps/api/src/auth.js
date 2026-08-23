import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { db } from './db.js';

const SESSION_COOKIE = 'encore_session';
const SESSION_SECRET = process.env.ENCORE_SESSION_SECRET;
if (!SESSION_SECRET) {
  console.warn('[warn] ENCORE_SESSION_SECRET is not set — sessions will not survive restart.');
}
const SECRET = SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TTL_MS = 12 * 60 * 60 * 1000;

const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verify = (token) => {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Date.now()) return null;
  return payload;
};

const setSession = (res, user) => {
  const token = sign({ uid: user.id, exp: Date.now() + TTL_MS });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL_MS,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare(`SELECT id, email, password_hash, role, name, active FROM users WHERE email = ?`).get(email);
  if (!user || !user.active) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(user.id);
  setSession(res, user);
  res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
};

export const logout = (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
};

export const requireAuth = (req, res, next) => {
  const payload = verify(req.cookies?.[SESSION_COOKIE]);
  if (!payload) return res.status(401).json({ error: 'unauthenticated' });
  const user = db.prepare(`SELECT id, email, role, name, active FROM users WHERE id = ?`).get(payload.uid);
  if (!user || !user.active) return res.status(401).json({ error: 'unauthenticated' });
  req.user = user;
  next();
};

export const requireOwner = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'owner') return res.status(403).json({ error: 'forbidden' });
    next();
  });
};
