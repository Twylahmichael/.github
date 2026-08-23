# Architecture

## Goal

Add dynamic content + admin management to **efn.co.ke** without touching WooCommerce, wp-admin, or the existing Elementor layouts more than necessary.

## Shape

```
┌───────────────────────────────────────────────────────────────┐
│                        efn.co.ke (WordPress)                  │
│                                                               │
│   Elementor pages (untouched):                                │
│     • Home, Contacts, Shop, Cart, Checkout, Accounts          │
│                                                               │
│   Elementor pages (add one HTML embed each):                  │
│     • Fitness Studio → <div id="encore-schedule">             │
│     • Fitness Studio → <div id="encore-coaches">              │
│     • Community      → <div id="encore-events">               │
│     • Gallery        → <div id="encore-gallery">              │
│     • Homepage       → <div id="encore-marquee-stats">        │
│                                                               │
│   <script src="https://encore.twylah.co.ke/embed.js"></script>│
└───────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (read-only, public)
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                  Encore API  (Node + Express)                 │
│                                                               │
│   GET  /api/schedule       (public)                           │
│   GET  /api/coaches        (public)                           │
│   GET  /api/events         (public)                           │
│   GET  /api/gallery        (public)                           │
│   GET  /api/stats          (public)                           │
│                                                               │
│   POST /api/admin/*        (auth: Owner / Staff)              │
│   GET  /api/admin/audit    (auth: Owner)                      │
│                                                               │
│                         SQLite (WAL)                          │
│                     /var/lib/encore/data.db                   │
│                     /var/lib/encore/uploads/                  │
└───────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌───────────────────────────────────────────────────────────────┐
│           Admin Panel  (Vite + React, static build)           │
│                     admin.encore.twylah.co.ke                 │
│                                                               │
│   Dashboard · Schedule · Coaches · Events · Gallery ·         │
│   Bookings (Phase 2) · Audit Log                              │
└───────────────────────────────────────────────────────────────┘
```

## Why this shape

- **No WordPress plugins.** A plugin means shared PHP process, shared DB, shared risk with WooCommerce. An external API + JS embed is a clean seam.
- **SQLite over MySQL/Postgres.** The data volume is tiny (a schedule, ~10 coaches, a handful of events, a gallery). SQLite in WAL mode handles this trivially and the whole database is one file to back up.
- **Static admin bundle.** Deploys are `rsync` of a `dist/` folder. No SSR, no framework runtime.
- **Public reads are cacheable.** `GET /api/schedule` returns JSON with a `Cache-Control: public, max-age=60` header — front CDN can absorb the load; the API is only hit ~1×/minute per edge node.

## WhatsApp booking

Each class card in the schedule embed renders as:

```html
<a href="https://wa.me/2547XXXXXXXX?text=Hi%20Encore%2C%20I%27d%20like%20to%20book%20Yoga%20on%20Tuesday%20at%206%3A30%20PM"
   class="encore-class-card">
  ...
</a>
```

The phone number and message template are stored once in `settings` and injected at render time — changing the WhatsApp number is a one-field edit in the admin panel, not a code change.

## Auth

- Admin panel uses email + password (bcrypt, per-user pepper stored in env).
- Session = signed HTTP-only cookie, 12-hour sliding expiry.
- Two roles: `owner` (everything, incl. user management + audit log) and `staff` (schedule + content, no user management).
- No public signup — Owner creates staff accounts.

## Audit log

Every mutating admin request writes one row: `{ user_id, actor_email, action, entity, entity_id, before_json, after_json, at }`. Owner-only read. No delete — append-only.

## Deployment

- **API + admin panel:** single small VPS (2 GB, Ubuntu), `caddy` for TLS + reverse proxy, `systemd` unit for the Node process, `restic` nightly snapshot of `/var/lib/encore/` to S3-compatible object storage.
- **Embed bundle:** built as static JS/CSS, served from the same host (`/embed.js`, `/embed.css`), cached at the CDN edge.
- **WordPress side:** one Elementor "HTML" widget per embed slot, plus one `<script>` tag in the site's global header. No plugin install, no theme edit beyond the header script.

## Out of scope (Phase 1)

- Payments (WooCommerce already handles this)
- Member accounts (Phase 2)
- Native mobile app
- Email/SMS notifications (WhatsApp is the channel)
