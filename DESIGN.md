# Design System — mike-portfolio

Approved 2026-07-10. This is the floor for all UI work: every component uses these tokens. No arbitrary `text-[Npx]` values, no new fonts, no new colours, no gradients.

## Principles

1. **Proof over adjectives** — the hero makes one falsifiable claim with immediate verification (live RAG demo).
2. **Typography is the design** — hierarchy comes from size/weight/colour, never from boxes or decoration.
3. **Whitespace as structure** — one section rhythm, one container; density reserved for evidence.
4. **Projects as case evidence** — uniform card anatomy with honest status labels.
5. **Motion as punctuation** — one entrance pattern, one easing curve, everything under 700ms.

## Typefaces (2, self-hosted via `next/font`)

- **Inter** — display + body. Weights 400 / 500 / 600 only.
- **JetBrains Mono** — labels, technical metadata, code.

## Type scale (tokens in `tailwind.config.ts`, 12px hard floor)

| Token | Size / line-height | Use |
| --- | --- | --- |
| `text-display-xl` | clamp(2.5–4.75rem) / 1.02 | Hero |
| `text-display-lg` | clamp(2.25–4rem) / 1.02 | Page titles |
| `text-display-md` | clamp(1.75–2.5rem) / 1.1 | Section headings (`.section-heading`) |
| `text-title-lg` | 28px / 1.2 | Flagship card headings |
| `text-title` | 19px / 1.3 | Card titles |
| `text-body-lg` | 17px / 1.65 | Standfirsts, section intros |
| `text-body` | 15.5px / 1.6 | Default prose |
| `text-body-sm` | 14px / 1.55 | Dense UI, chat, forms |
| `text-caption` | 13px / 1.5 | Meta text, chips, small buttons |
| `text-micro` | 12px / 1.4 | Mono labels, eyebrows — **hard floor, nothing smaller** |

## Colour (all AA-verified on `#0a0d14`)

- Background `#0a0d14`, elevated `#0f1320` (CSS vars in `globals.css`).
- `ink` 50–900 grey scale; 200 ≈ 12.6:1, 300 ≈ 7.9:1, 400 ≈ 4.9:1 on the background.
- **Blue `accent` `#0066FF` is the sole interactive accent** — links, hover, focus, active states. Use `accent-glow` `#66a3ff` (≈5.4:1) for accent-coloured text.
- **Green `signal` `#00C896` (≈7.4:1) is semantic only** — status (Production/Shipped), verified proof points, availability, success messages. Never decorative, never for links or hover states.
- Borders: `white/8` default, `white/14` strong. No gradients anywhere.

## Spacing & radii

- 4px base grid. Container: `.container-edge` (max-w-6xl, 24/32/48px gutters).
- Section rhythm: `.section` = `border-t border-white/5 py-24 sm:py-32` (96/128px).
- Radii: `rounded-xl` 12px (inputs, inner blocks), `rounded-2xl` 16px (cards), `rounded-3xl` 24px (feature cards), `rounded-full` (pills/buttons).

## Motion policy

- One easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Entrance: `animate-fade-up` only, ≤600ms, stagger ≤80ms, first viewport only.
- Hover: colour/border/opacity at 200–300ms; `active:scale-[0.98]` on primary buttons only.
- Banned: parallax, scroll-jacking, typewriter effects, infinite loops, animated gradients.
- `prefers-reduced-motion` globally disables animation/smooth-scroll (see `globals.css`).
