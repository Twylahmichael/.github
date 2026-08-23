# Design tokens

Warm and premium, not dark mode. Matches the visual language already on efn.co.ke.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--encore-ivory` | `#FAF6EF` | Page background |
| `--encore-sand` | `#EDE3D2` | Card background, section fills |
| `--encore-nude` | `#D9C4A7` | Dividers, muted surfaces |
| `--encore-ink` | `#1F1B16` | Body text |
| `--encore-teal` | `#1F7A73` | Ring accent, active states, links |
| `--encore-teal-deep` | `#0F4E49` | Hover, header underline |
| `--encore-magenta` | `#C2185B` | Primary CTA, pricing |
| `--encore-magenta-deep` | `#8E0E42` | CTA hover |
| `--encore-whatsapp` | `#25D366` | WhatsApp buttons only |

## Type

- **Display / headers:** `"Barlow Condensed", "Oswald", system-ui, sans-serif` — 700, uppercase, tight tracking.
- **Body:** `"Inter", system-ui, -apple-system, sans-serif` — 400/500, 1.5 line-height.
- **Numeric (stat counters, prices):** `"Barlow Condensed"` tabular figures.

## Scale (base 16)

`12 · 14 · 16 · 18 · 22 · 28 · 36 · 48 · 64`

## Radius

`0 · 4 · 8 · 16` — cards use 8, hero elements 16, buttons 4.

## Shadow

Single ambient shadow token: `0 2px 8px rgba(31,27,22,0.08)`. No secondary elevation layer — flat by default.

## Rules

- Never use pure black (`#000`) or pure white (`#FFF`). Always ivory/ink.
- Magenta is reserved for CTAs and price emphasis. Teal is the interaction color everywhere else.
- Real facility photography only. No stock imagery, no gradient placeholders in production.
