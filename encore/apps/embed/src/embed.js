// Encore embed bundle.
// Injects dynamic content into WordPress pages by mount-point id.
// Each mount is opt-in: WordPress side just drops a <div id="encore-..."></div>.

const API = window.ENCORE_API || 'https://encore.twylah.co.ke/api';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, '0')} ${suffix}`;
};

const whatsappHref = (number, template, slot) => {
  const msg = template
    .replaceAll('{class}', slot.class_name)
    .replaceAll('{day}', DAYS[slot.day_of_week])
    .replaceAll('{time}', fmtTime(slot.start_time));
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
};

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c?.nodeType ? c : document.createTextNode(String(c ?? '')));
  return node;
};

const fetchJSON = (path) => fetch(`${API}${path}`).then(r => r.json());

// If a member is signed in (portal session cookie shared via same domain),
// show a "Book instantly" link to the portal alongside the WhatsApp CTA.
async function renderSchedule(mount) {
  mount.classList.add('encore-schedule');
  mount.append(el('div', { class: 'encore-loading' }, 'Loading schedule…'));
  const [{ slots }, stats, memberRes] = await Promise.all([
    fetchJSON('/schedule'),
    fetchJSON('/stats'),
    fetch(`${API}/members/me`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  mount.textContent = '';
  const wa = stats['whatsapp.number'];
  const tpl = stats['whatsapp.template'] || "Hi Encore, I'd like to book {class} on {day} at {time}";
  const portalUrl = window.ENCORE_PORTAL_URL || 'https://members.encore.twylah.co.ke';
  const member = memberRes?.member;
  const board = el('div', { class: 'encore-board' });
  for (const s of slots) {
    const primary = member
      ? el('a', { class: 'encore-cta', href: `${portalUrl}/book?slot=${s.id}` }, `Book instantly`)
      : el('a', { class: 'encore-cta', href: whatsappHref(wa, tpl, s), target: '_blank', rel: 'noopener' }, 'Book on WhatsApp');
    const card = el('div', { class: 'encore-class-card' },
      el('div', { class: 'encore-day' }, DAYS[s.day_of_week]),
      el('div', { class: 'encore-time' }, `${fmtTime(s.start_time)} – ${fmtTime(s.end_time)}`),
      el('div', { class: 'encore-name' }, s.class_name),
      el('div', { class: 'encore-coach' }, s.coach_name || 'Coach TBA'),
      primary,
    );
    board.append(card);
  }
  mount.append(board);
}

async function renderCoaches(mount) {
  const { coaches } = await fetchJSON('/coaches');
  mount.classList.add('encore-coaches');
  mount.textContent = '';
  for (const c of coaches) {
    mount.append(el('div', { class: 'encore-coach-card' },
      c.photo_path ? el('img', { src: c.photo_path, alt: c.name }) : el('div', { class: 'encore-coach-placeholder' }),
      el('div', { class: 'encore-coach-name' }, c.name),
      el('div', { class: 'encore-coach-specialty' }, c.specialty),
    ));
  }
}

async function renderEvents(mount) {
  const { events } = await fetchJSON('/events');
  mount.classList.add('encore-events');
  mount.textContent = '';
  for (const e of events) {
    mount.append(el('article', { class: 'encore-event-card' },
      e.cover_path ? el('img', { src: e.cover_path, alt: e.title }) : null,
      el('h3', {}, e.title),
      el('time', {}, new Date(e.starts_at).toLocaleString()),
      e.description ? el('p', {}, e.description) : null,
    ).cloneNode(true));
  }
}

async function renderGallery(mount) {
  const { items } = await fetchJSON('/gallery');
  mount.classList.add('encore-gallery');
  mount.textContent = '';
  const cats = ['facility', 'classes', 'coaches', 'events'];
  const tabs = el('div', { class: 'encore-gallery-tabs' });
  const grid = el('div', { class: 'encore-gallery-grid' });
  const draw = (filter) => {
    grid.textContent = '';
    items
      .filter(i => filter === 'all' || i.category === filter)
      .forEach(i => grid.append(el('img', { src: i.image_path, alt: i.alt_text || '', loading: 'lazy' })));
  };
  ['all', ...cats].forEach(c => tabs.append(el('button', {
    class: 'encore-tab',
    onclick: () => draw(c),
  }, c)));
  mount.append(tabs, grid);
  draw('all');
}

async function renderStats(mount) {
  const s = await fetchJSON('/stats');
  mount.classList.add('encore-stats');
  const items = [
    [`${s['stats.classes_weekly'] || '7'}`, 'Classes Weekly'],
    [`${s['stats.years_running'] || '3+'}`, 'Years Running'],
    [`${s['stats.booking_hours'] || '24/7'}`, 'Online Booking'],
    [`KES ${s['stats.daily_price_kes'] || '400'}`, 'Daily'],
  ];
  mount.textContent = '';
  for (const [n, label] of items) {
    mount.append(el('div', { class: 'encore-stat' },
      el('div', { class: 'encore-stat-num' }, n),
      el('div', { class: 'encore-stat-label' }, label),
    ));
  }
}

const MOUNTS = {
  'encore-schedule': renderSchedule,
  'encore-coaches': renderCoaches,
  'encore-events': renderEvents,
  'encore-gallery': renderGallery,
  'encore-marquee-stats': renderStats,
};

document.addEventListener('DOMContentLoaded', () => {
  for (const [id, render] of Object.entries(MOUNTS)) {
    const mount = document.getElementById(id);
    if (mount) render(mount).catch(err => {
      console.error(`[encore] ${id}`, err);
      mount.textContent = 'Content temporarily unavailable.';
    });
  }
});
