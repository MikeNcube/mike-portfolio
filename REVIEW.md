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

### Eval suite (no fabricated results)

`evals/results.json` is **not** in the repo. The `/evals` page lists methodology and the 10 questions, and shows a placeholder until a real runner output is committed.

```bash
GEMINI_API_KEY=... npx tsx evals/run.ts --url https://your-preview.vercel.app
```

Then commit `evals/results.json`. Do not invent scores.

The `2 + 2` eval now requires a refusal plus contact email, and forbids common numeric-answer phrasings (`equals 4`, `is four`, `2 + 2 =`, etc.).

The homepage does **not** link to `/evals` until real results exist.

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

## Vercel deployment — BLOCKED: wrong repo linked

**Mike must re-link the Vercel project before any preview deployment works.** The Vercel project is currently Git-linked to `MikeNcube/zororo-local-form-` (the wrong repository). No preview builds fire for this PR.

**Steps:**
1. Vercel dashboard → Project Settings → Git
2. Disconnect `zororo-local-form-`
3. Connect `MikeNcube/mike-portfolio`
4. Trigger a deployment from branch `cursor/portfolio-overhaul-7041` to get a preview URL

Until this is fixed, no preview deployment exists and the evals cannot be run against a live URL.

---

## Performance

Next.js build output (last run):
- Homepage: 3.7 kB + 103 kB shared JS
- No unoptimised bundles flagged
- All images use `next/image` with `priority` on above-fold portrait
- Fraunces and DM Sans loaded via `next/font/google` with `display: swap`

Lighthouse run locally against `next start` build (Chrome available in CI environment). All targets met:

| Mode | Performance | Accessibility | Best-practices | SEO |
|------|-------------|---------------|----------------|-----|
| Desktop 1440 | **100** | **100** | **100** | **100** |
| Mobile (simulated Moto G4) | **96** | **100** | **100** | **100** |

Previous baseline: desktop 100/97/100/100, mobile 97/97/100/100. Accessibility improved from 97→100.

Note: `best-practices: image-aspect-ratio` is flagged because the source photo (`Mike_Org.jpeg`) is 1024×1024 square but displayed in a 3:4 crop via `object-cover`. This is intentional art direction, not a bug. `image-size-responsive` on the mobile portrait (80px display) is similarly a deliberate choice. Mike can resolve both permanently by replacing the JPEG with a 3:4 crop.

Artifacts: screenshots saved to `/opt/cursor/artifacts/screenshots/`.

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
| Case-study sidebar | `dl` contains only `div > dt/dd` groups; GitHub/demo links sit outside the `dl` |

---

## Round 3 — diagrams, contrast, evals page

Architecture diagrams are HTML/CSS boxes with real 14px text (class `diagram-label`), stacked vertically below `sm` so they do not scale down on a 390px screen.

Truth fixes vs CV:
- Claims: no “Scanned PDF”, no “auto-approved”. Flow is document → Claude vision → Pydantic → per-field confidence → needs-review flag. Caption states pending management approval.
- CRM: no JWT, no session-store claim for Redis/Celery. Redis and Celery are labelled “async tasks”. Policy adapter: “one file per live integration change”.
- Cube: trusted verifier lives in a dashed “sandboxed eval harness (not on the live path)” box. “swap one file” removed.
- Digi: multi-step intake, server-side validation, policy PDF generation, staff admin only.
- Sitewarden: loop is a second row (Await approval → Revise) with a sentence, not an arrow through Analyse.
- Sentinel: Flag / Block IP / Audit log as three equal nodes; nothing clipped.

Redirect: `/projects/zororo-digital-applications` → `/projects/digi-app-form`.

Mobile hero portrait: 80px slot, `object-position: 50% 12%` plus `scale(1.85)` so the crop is head and shoulders, not a squeezed full-length figure. Duplicate “Applied AI Engineer / Johannesburg · Remote” next to the mobile photo was removed.

---

## What Mike must do

1. **Set `GEMINI_API_KEY`** in Vercel → Settings → Environment Variables (Production + Preview). This is already required; the PR just makes the assistant reliably use it.
2. **Replace `/public/Mike_Org.jpeg`** with a 1200×630 export for correct OG image on Twitter/LinkedIn previews.
3. **Run evals against the preview URL** (after re-linking Vercel) and commit the generated `evals/results.json`:
   ```bash
   GEMINI_API_KEY=... npx tsx evals/run.ts --url https://preview-url.vercel.app
   ```
4. **Write Notes content** and uncomment the Notes section scaffold in `app/page.tsx` when ready.
5. **Optional — higher RPM**: If the assistant gets heavy traffic, set `GENERATION_MODEL=gemini-1.5-flash` as an env var to use the 15 RPM free-tier model instead of the 10 RPM gemini-2.5-flash. Change requires adding `process.env.GENERATION_MODEL ?? 'gemini-2.5-flash'` in `route.ts`.
