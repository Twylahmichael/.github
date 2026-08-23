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
├── docs/                   Client-facing proposal, architecture, phase 2 notes, deploy
├── apps/
│   ├── api/                Node + Express + SQLite — schedule, coaches, events, gallery, members, bookings
│   ├── admin/              Vite + React admin panel (Owner / Staff roles)
│   ├── portal/             Vite + React member portal — sign in, calendar, book a class
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

## Phase 2 (built)

- Member sign-up / sign-in with phone number (E.164, normalised) + password
- Personal calendar — upcoming, cancel-until-start, bounded history
- Portal booking flow with capacity + one-booking-per-session enforcement
- Admin Bookings view over a date range, plus manual walk-in logging
- Embed schedule shows "Book instantly" for signed-in members, WhatsApp for everyone else

See [`docs/PHASE2.md`](docs/PHASE2.md).

## Shop

Already live via WooCommerce — no rebuild.

---

See [`docs/PROPOSAL.md`](docs/PROPOSAL.md) for the client-facing proposal and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it plugs into WordPress.
