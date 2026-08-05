const BASE = import.meta.env.VITE_ENCORE_API || '/api';

export const api = (path, opts = {}) => fetch(`${BASE}${path}`, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  ...opts,
}).then(async r => {
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.error || r.statusText), { status: r.status });
  return body;
});

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Next date on/after "from" that matches day-of-week `dow`.
export const nextDateOn = (dow, from = new Date()) => {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (dow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};

export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const fmtDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric',
});
