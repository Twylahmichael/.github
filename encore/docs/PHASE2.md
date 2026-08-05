# Phase 2 — Member logins & personal calendar

Wires up the `bookings` table Phase 1 left as scaffolding, adds a new **member portal** SPA, and gives the admin panel a real Bookings view.

## Scope

- Members sign up / sign in with a phone number (E.164, normalised from `07XX…`, `254…`, or `+254…`) + password. Email is optional, for password reset.
- Personal calendar — upcoming bookings, cancel-until-start, bounded history.
- Portal booking flow — pick the next occurrence of a weekly class; server enforces capacity, day-of-week match, and one booking per member per session.
- Admin Bookings page shows real bookings for a date range, grouped by day.
- Staff can manually log a walk-in / phone booking from the admin panel.
- The embed schedule detects a signed-in member and offers "Book instantly" (portal) alongside "Book on WhatsApp" for non-members.

## New surfaces

| Surface | URL |
|---|---|
| Member portal | `https://members.encore.twylah.co.ke` |
| API — member auth | `POST /api/members/{signup,login,logout}` · `GET /api/members/me` |
| API — bookings | `GET/POST /api/members/me/bookings` · `DELETE /api/members/me/bookings/:id` |
| API — admin bookings | `GET /api/admin/bookings?from=…&to=…` · `POST /api/admin/bookings` |

## Schema changes

Applied by `migrations/001_phase2_members_bookings.sql` on first boot after deploy:

- **New table:** `members` — phone (unique, E.164), name, email (nullable, unique), password_hash.
- **Rebuilt table:** `bookings` — adds `member_id`, `cancelled_at`, `cancel_reason`; tightens `source` and `status` to CHECK-constrained enums; adds `UNIQUE (slot_id, session_date, member_id)`.

Phase 1 rows are migrated in-place (the old `pending` status maps to `confirmed`).

## Session model

Two independent cookie namespaces — a member cookie **cannot** authenticate an admin request, and vice versa.

| Cookie | TTL | Cleared on |
|---|---|---|
| `encore_session` (admin/staff) | 12h sliding | logout, TTL expiry |
| `encore_member` (member portal) | 30d sliding | logout, TTL expiry |

Both are HTTP-only, `SameSite=Lax`, `Secure` in production.

## Deploy addition

Add a Caddy vhost for the portal — same rsync pattern as the admin panel:

```
members.encore.twylah.co.ke {
  root * /srv/encore/apps/portal/dist
  try_files {path} /index.html
  file_server
}
```

And one line in the site's global header on efn.co.ke to point the embed at the portal:

```html
<script>window.ENCORE_PORTAL_URL = 'https://members.encore.twylah.co.ke';</script>
```

## Out of scope (still)

- Payments (WooCommerce handles this)
- Password reset flow (email delivery not set up yet — Phase 2.1)
- SMS/WhatsApp reminders for upcoming classes (Phase 3)
- Waitlist when a class is full (Phase 3)
