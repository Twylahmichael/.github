# Encore

Companion system for **[efn.co.ke](https://efn.co.ke)** — Encore Fitness Studio's existing WordPress + WooCommerce site.

Not a rebuild. Plugs into the live site to fix two real pain points:

1. The class schedule is hardcoded — a developer has to edit it to change a coach.
2. There's no direct WhatsApp booking.

Shop, checkout, and customer accounts stay exactly as they are.

---

## What's in this repo

```
encore/
├── docs/                   Client-facing proposal, architecture, design direction
├── apps/
│   ├── api/                Node + Express + SQLite — schedule, coaches, events, gallery
│   ├── admin/              Vite + React admin panel (Owner / Staff roles)
│   └── embed/              Vanilla JS bundles injected into WordPress pages
└── design/                 Design tokens, palette, type scale
```

## Phase 1 scope

- Dynamic, bookable class schedule (replaces the static Elementor table)
- WhatsApp-first booking (each class card opens WhatsApp with class, day, time pre-filled)
- Coaches section (photo, name, specialty) — synced with schedule
- Community & events (Saturday Dance Club, Polar Run Club, future events)
- Filterable gallery (Facility / Classes / Coaches / Events)
- Homepage refresh — photo marquee + animated stat counters
- Location & footer refresh (embedded map, IG/TikTok, M-Pesa Till)
- Admin panel — dashboard, schedule manager, content manager, bookings view, audit log

## Phase 2 (next)

- Member logins + personal calendar so members track their own bookings

## Shop

Already live via WooCommerce — no rebuild.

---

See [`docs/PROPOSAL.md`](docs/PROPOSAL.md) for the client-facing proposal and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it plugs into WordPress.
