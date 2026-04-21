# Mike — AI Engineer Portfolio

Portfolio for **Mike S Ncube — AI Engineer**.

Focus areas:

- Agentic AI & applied LLM workflows
- Python backends (Flask / FastAPI)
- Data pipelines & automation

Built as a production-ready Next.js 14 (App Router) site with strict TypeScript, Tailwind CSS, and a systems-first information architecture.

## Information Architecture

The homepage follows a deliberate recruiter-first order:

1. **Hero** — positioning statement + credibility signals
2. **Flagship AI Systems** — top 2–3 strongest systems, framed as production engineering work
3. **Agentic AI / LLM Orchestration** — planner/critic loops, routing, eval harnesses
4. **Backend Engineering** — FastAPI / Flask platform, automation API, auth & quotas
5. **Data Pipelines / Automation** — contract-first ETL, document intelligence, backfills
6. **Additional Projects** — secondary work
7. **How I Build Systems** — engineering mindset (API design, LLM patterns, reliability, observability)
8. **About** — minimal, non-generic
9. **Contact**

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript 5 (strict)
- Tailwind CSS 3
- Inter + JetBrains Mono via `next/font`

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint with `next lint` |

## Content

All project and section content lives in [`lib/content.ts`](./lib/content.ts) as typed data. To add, rename, or re-rank a project, edit that file — no markup changes needed.

## Project layout

```
app/
  layout.tsx          # Root layout, fonts, metadata
  page.tsx            # IA-ordered homepage composition
  globals.css         # Design tokens, components, utilities
  not-found.tsx       # 404 route
components/
  Nav.tsx             # Sticky, blurred, responsive nav
  Footer.tsx
  Hero.tsx            # Recruiter-grabbing hero
  SectionHeader.tsx   # Shared section header
  ProjectCard.tsx     # Flagship / default / compact variants
  Flagship.tsx        # Section: top AI systems
  Agentic.tsx         # Section: agentic / LLM
  Backend.tsx         # Section: Python backends
  Pipelines.tsx       # Section: data pipelines
  Additional.tsx      # Section: secondary work
  Approach.tsx        # Section: how I build systems
  About.tsx           # Section: minimal about
  Contact.tsx         # Section: contact
lib/
  content.ts          # Typed project + section content
```

## Design principles

- **Systems thinking over CV bullets.** Every project is framed as a system: problem → approach → outcome.
- **Typography hierarchy first.** `display` / `section` / `body` scales are explicit and responsive.
- **Enterprise restraint.** Monochrome base, single accent, consistent chips/meta, no decorative clutter.
- **Mobile-responsive.** Grid collapses at `md` / `xl`, hero scales via `clamp()`.
- **A11y-aware.** Skip link, focus styles, semantic sections, keyboard-reachable nav.
