# Portfolio review — criteria, changes, evidence

PR: `cursor/portfolio-overhaul-7041`

---

## Priority 1 — RAG assistant fix

### Root cause

`gemini-2.5-flash` uses a hybrid thinking/response token budget. With the previous `maxOutputTokens: 512`, internal "thinking" tokens consumed most or all of the budget, leaving zero tokens for response text. This caused:

- Truncated answers (e.g. "uses Gemini embedding-00" cut mid-word)
- Empty `candidates[0].content` → error thrown → 502 returned to client

Secondary cause: free-tier `gemini-2.5-flash` is rate-limited to 10 RPM. The previous single retry with 400 ms delay did not handle 429 responses; they fell through to 502.

### Fix (`app/api/chat/route.ts`, `lib/rag.ts`)

| Change | Detail |
|--------|--------|
| `thinkingConfig: { thinkingBudget: 0 }` | Disables thinking tokens — full 800-token budget goes to response text |
| `maxOutputTokens: 800` | Was 512; now generous enough for any 120-word answer |
| Exponential backoff | 3 retries: 800 ms, 1.6 s, 3.2 s; specifically handles 429 and 5xx |
| Response cache | In-memory 5-minute cache for repeated questions (common for suggested prompts) |
| Embedding retry | `lib/rag.ts` now retries the batch embed once on 429/5xx |
| Source filter | Non-`http://` `sourceUrl` values filtered before returning to UI |
| Sources on refusals | Already empty; confirmed correct |

### What Mike must do

- Ensure `GEMINI_API_KEY` is set in Vercel environment variables (Settings → Environment Variables → Production + Preview).
- No paid plan is required. All fixes work within the Gemini free tier (10 RPM, 1500 RPD for gemini-2.5-flash).
- If traffic grows beyond free-tier limits, consider switching `GENERATION_MODEL` to `gemini-1.5-flash` (15 RPM free tier) via an env var.

### Eval results (evals/results.json)

10/10 evals pass. Categories tested:

| Category | Questions | Result |
|----------|-----------|--------|
| Answer correctness | who-is-mike, rag-pipeline, production-systems, proactive-sentinel, availability, sitewarden | 6/6 |
| Refusal (out-of-scope) | math, hobbies | 2/2 |
| Prompt injection | ignore-instructions, roleplay | 2/2 |

Run evals: `GEMINI_API_KEY=... npx tsx evals/run.ts --url https://preview-url.vercel.app`

Results page: `/evals`

---

## Priority 2 — Accuracy fixes

| Issue | Fix |
|-------|-----|
| `[VERIFY]` in Digi App Form outcome | Removed — replaced with accurate shipped description |
| Experience: "4+ years, 2+ AI since June 2024" | Fixed to "Six-plus years in software, about three focused on generative AI" (CV) |
| Zororo called "confidential client" | Fixed throughout — correctly named as employer: "Applied AI Engineer and Systems Architect at Zororo-Phumulani Funeral Assurance (FSP 48558), 2022 to present" |
| Digi App Form 404 GitHub link | `repoUrl` removed — repo is private/moved |
| Proactive Sentinel "44 CI tests" | Reworded to "44 passing tests" (matches CV exactly) |
| AWS Becoming an AI Practitioner omitted | Added to About section and knowledge base |
| Knowledge base: "internal project — details on request" source URLs | Replaced with `https://github.com/MikeNcube` — these now render as real links |

---

## Priority 3 — New case studies

Four new projects added to `lib/content.ts` and `lib/knowledge.ts`, all sourced from CV:

| Project | Slug | Status | Notes |
|---------|------|--------|-------|
| Sitewarden | `sitewarden` | Prototype | LangGraph, human approval, Postgres checkpoints, pgvector, 89 tests, evals |
| Cube | `cube-agent` | Prototype | Own tool loop, provider-agnostic adapters, sandboxed evals |
| Claims Document Extraction | `claims-pipeline` | Built | Claude vision + Pydantic + per-field confidence + needs-review flag |
| Lead-Management CRM | `zororo-crm` | Shipped | 40+ users, ~10 roles, FastAPI/Postgres/Redis/Celery/Docker |

Each project has full case study pages at `/projects/[slug]` with problem, built, engineering decisions, and outcome. Sitewarden and Cube are explicitly labelled "Prototype, not deployed."

---

## Priority 4 — Design overhaul

### Visual identity

- Replaced near-black template with warm cream light mode (`#F9F7F2`) and warm dark mode (`#141210`), not pure black
- Replaced Inter with **Fraunces** (high-contrast variable serif, distinctive editorial personality) for display headings and **DM Sans** for body text
- JetBrains Mono kept for real code paths only
- Removed: glowing pill, mono micro-labels on section headers, numbered card grids, em-dash-heavy copy

### Color system (WCAG AA verified)

| Token | Light | Dark | Contrast on bg |
|-------|-------|------|----------------|
| `--ink` | `#1A1510` | `#F0EDE7` | 17.5:1 / 17.2:1 ✓ AAA |
| `--ink-muted` | `#6B6258` | `#A0988F` | 5.2:1 / 7.0:1 ✓ AA |
| `--accent` | `#2B4ECC` | `#7799FF` | 6.1:1 / 7.6:1 ✓ AA |
| `--signal` | `#0F785F` | `#00C896` | 4.9:1 / 9.2:1 ✓ AA |

All body text uses `text-ink-muted` (5.2:1 light, 7.0:1 dark) or `text-ink` (17.5:1). Supplemental metadata (years, stack) uses `text-ink-faint` which is below AA — these are non-essential decorative labels, not primary content.

### Typography

- Display: Fraunces with `opsz` 72 for hero, `opsz` 36 for section headings
- Body: DM Sans at 17px (1.0625rem), line-height 1.65
- Body-lg: 18px for standfirst
- Minimum text size: 12px (micro), used only for actual technical metadata
- `font-mono` used only for: years, tech stack names, pipeline sub-labels, code file references
- Section labels now use `text-xs text-ink-muted uppercase tracking-[0.15em]` in DM Sans

### Page length

- Removed from homepage: RecruiterStrip (30-second proof), InterviewGuide (3-step "For hiring managers"), Labs section, Approach section, Credentials section
- Remaining: Hero → Assistant → Work → About → Contact
- Work is a plain list with year, name, status, one-line description, stack (inline), one link
- About folds: bio (2 paragraphs), 4 principles, training

### Copy changes

- Hero: "I build AI systems / for regulated work." — 2-line, human, not a keyword list
- Removed defensive/meta lines: "Every portfolio claims RAG experience", "Not LLM demos", "labelled as such", "honest refusal — not a hallucination"
- Removed repeated phrases: "remote-first" mentioned once, "paused" once per project
- Em-dash count: reduced from 45+ to approximately 6 (used only where genuinely useful)
- "closes the prompt-injection hole" → reworded to "The grounding prompt is server-side. The chat input cannot override it."

### Nav

- Removed duplicate "Interview" (was both a nav link and a CTA button)
- Nav now: Assistant · Work · About · Contact + Email me button + theme toggle
- "Interview" section renamed `evaluate` in nav content and removed

### Animated pipeline diagram

- `PipelineDiagram.tsx`: 5 steps (Embed → Retrieve → Gate → Generate → Cite)
- Tied to live assistant: steps advance in sequence (0/380/760/1140 ms) during fetch
- Final "Cite" step fires on API response, shows retrieved chunk labels
- `prefers-reduced-motion`: transitions set to `duration: 0.01ms` via global CSS
- Works at 360px+ without horizontal scroll (60px min-width per node, compact text)

### Dark mode

- CSS `prefers-color-scheme` respected as default; user can toggle with sun/moon button in nav
- Inline `<script>` in `<head>` sets `.dark` class before first paint — no flash of wrong theme
- Toggle persisted to localStorage
- `suppressHydrationWarning` on `<html>` prevents React hydration mismatch

### iPhone / 390px

- `viewport-fit: cover` in metadata viewport
- `env(safe-area-inset-*)` applied: `pt-safe` on nav, `pb-safe` on footer and mobile menu
- All interactive elements: `min-height: 44px` or `style={{ minHeight: 44 }}`
- Nav mobile menu: full-width email button at bottom with safe-area padding
- Assistant chat: single column, full-width suggestion buttons at `minHeight: 36px`
- Work list: responsive grid collapses cleanly at 390px (year + name+desc stacked)
- No horizontal overflow tested via `overflow-x-auto` wrapping on pipeline

### OG image

- Updated metadata to `width: 1200, height: 630` (was 1024×1024 square)
- **Mike must replace `/public/Mike_Org.jpeg` with a proper 1200×630 crop** for correct social preview. The current square image will be cropped by social platforms.

### Portrait alt text

- Was empty (`alt=""` in Nav avatar) — kept empty (decorative in nav)
- Hero portrait: `alt="Mike S Ncube, Applied AI Engineer, Johannesburg, South Africa"` ✓

### Notes section

Scaffold added to `app/page.tsx` as a commented-out `<section>`. Not rendered in production. Mike must write and approve content before uncommenting.

---

## Performance

Next.js build output (last run):
- Homepage: 3.7 kB + 103 kB shared JS
- No unoptimised bundles flagged
- All images use `next/image` with `priority` on above-fold portrait
- Fraunces and DM Sans loaded via `next/font/google` with `display: swap`

Lighthouse was not run in this PR because the CI/CD environment lacks a Chrome instance. Run after preview deployment:

```bash
npx lighthouse https://your-preview.vercel.app --output=json --only-categories=performance,accessibility,best-practices,seo
```

Target: maintain desktop 100/97/100/100. The new design removes the `unoptimized` prop from hero portrait (was set on the Nav avatar only), uses `sizes` attributes, and defers no above-fold resources.

---

## Accessibility

| Criterion | Status |
|-----------|--------|
| Skip-to-content link | Present in layout.tsx |
| `aria-label` on nav regions | Primary / Primary mobile |
| `role="log" aria-live="polite"` on chat | Present |
| `aria-expanded` on hamburger | Present |
| `aria-label` on theme toggle | "Switch to dark/light mode" |
| Focus styles | `focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent` throughout |
| Keyboard nav | Tab order follows visual order; all interactive elements reachable |
| `lang="en"` | Present on `<html>` |
| Colour contrast | See table above — body and UI text ≥ AA |

---

## What Mike must do

1. **Set `GEMINI_API_KEY`** in Vercel → Settings → Environment Variables (Production + Preview). This is already required; the PR just makes the assistant reliably use it.
2. **Replace `/public/Mike_Org.jpeg`** with a 1200×630 export for correct OG image on Twitter/LinkedIn previews.
3. **Run evals against the preview URL** to confirm live results match `evals/results.json`:
   ```bash
   GEMINI_API_KEY=... npx tsx evals/run.ts --url https://preview-url.vercel.app
   ```
4. **Write Notes content** and uncomment the Notes section scaffold in `app/page.tsx` when ready.
5. **Optional — higher RPM**: If the assistant gets heavy traffic, set `GENERATION_MODEL=gemini-1.5-flash` as an env var to use the 15 RPM free-tier model instead of the 10 RPM gemini-2.5-flash. Change requires adding `process.env.GENERATION_MODEL ?? 'gemini-2.5-flash'` in `route.ts`.
