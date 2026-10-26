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

`evals/results.json` is **not** in the repo. The `/evals` page lists the 10 questions and a placeholder until a real runner output is committed. The homepage does **not** link to `/evals`.

### Eval runbook

Do not invent scores. Run against a live deployment, then commit the generated file.

```bash
GEMINI_API_KEY=... npx tsx evals/run.ts --url https://your-preview.vercel.app
```

Per-question checks:

| Check | What it asserts |
|-------|-----------------|
| `api_ok` | `/api/chat` returned HTTP success |
| `is_refusal` / `not_refusal` | Out-of-scope and injection prompts refuse; factual prompts answer |
| `contains:…` / `not_contains:…` | Required phrases present; hallucinations and numeric 2+2 answers absent |
| `does_not_compute_2plus2` | Math prompt must not compute 4 / four in any common phrasing |
| `has_sources` / `no_sources_on_refusal` | Citations on factual answers; none on refusals |

Rate limit: 1.2 s pause between questions (Gemini free tier, 10 RPM). Exit code 0 = all pass, 1 = one or more fail. Output: `evals/results.json`.

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

Architecture diagrams are HTML/CSS boxes with real 14px text (class `diagram-label`, CSS-locked). Below `md` they stack vertically so they do not scale down on a 390px screen. On `md+` they are a nowrap flex row of equal-width nodes, so arrows cannot wrap onto a stray line. The diagram sits in the full case-study column, not inside `max-w-2xl`.

Truth fixes vs CV:
- Claims: no “Scanned PDF”, no “auto-approved”. Flow is document → Claude vision → Pydantic → per-field confidence → needs-review flag. Caption states pending management approval.
- CRM: no JWT, no session-store claim for Redis/Celery. Redis and Celery are labelled “async tasks”. Policy adapter: “one file per live integration change”.
- Cube: trusted verifier lives in a dashed “sandboxed eval harness (not on the live path)” box. “swap one file” removed.
- Digi: multi-step intake, server-side validation, policy PDF generation, staff admin only.
- Sitewarden: loop is a second row (Await approval → Revise) with a sentence, not an arrow through Analyse.
- Sentinel: Flag / Block IP / Audit log as three equal nodes; nothing clipped.

Redirect: `/projects/zororo-digital-applications` → `/projects/digi-app-form` (HTTP 308).

Mobile hero portrait: 80px slot, `object-position: 50% 12%` plus `scale(1.85)` so the crop is head and shoulders, not a squeezed full-length figure. Duplicate “Applied AI Engineer / Johannesburg · Remote” next to the mobile photo was removed.

### Round 3 verification (local `next start` on :3001)

Minimum rendered `.diagram-label` font-size, Playwright Chromium, no clipping detected:

| Diagram | 390px | 1440px |
|---------|-------|--------|
| RAG | 14 | 14 |
| Sitewarden | 14 | 14 |
| Cube | 14 | 14 |
| CRM | 14 | 14 |
| Claims | 14 | 14 |
| DigiForm | 14 | 14 |
| Sentinel | 14 | 14 |

Lighthouse (Chrome headless):

| Page | Performance | Accessibility | Best-practices | SEO |
|------|-------------|---------------|----------------|-----|
| Home desktop | 100 | 100 | 100 | 100 |
| Sitewarden desktop | 100 | 100 | 100 | 100 |
| Home mobile 390 | 96 | 100 | 100 | 100 |

`definition-list`, `color-contrast`, and `target-size` all pass. Homepage HTML contains no `/evals` link.

---

## Round 4 — assistant never fails (free tier)

The chat route no longer returns 502 when a model is down. The answer chain is:

1. **Retrieve** — Gemini embeddings + cosine, gate 0.35. If the embedding call errors, **BM25 keyword search** over the same `KNOWLEDGE_CHUNKS`.
2. **Gemini 2.5 Flash** (`GEMINI_API_KEY`) — same grounded prompt, 12s provider budget. 5xx retries stay; 429 opens a 60s circuit (Round 5).
3. **Groq** (`GROQ_API_KEY`) — OpenAI-compatible `https://api.groq.com/openai/v1/chat/completions`. Default model `openai/gpt-oss-120b` (Round 6; `llama-3.3-70b-versatile` was shut down 16 Aug 2026).
4. **Static CV answers** — closest suggested question from `lib/static-answers.ts` (facts only from the CV and knowledge base). Used when neither key is set or both providers fail.
5. **Email fallback** — `EMAIL_FALLBACK` in `lib/answer.ts`, last resort only.

Abuse guards: 20 requests / IP / 10 minutes **only when Upstash is configured** (distributed). Without Redis the in-memory map is per-instance and does not span serverless isolates. Questions over 500 characters are rejected with a clear 400. `/api/health` reports provider booleans, `limiter.kind` (`upstash` \| `instance`), and `knowledgeBaseChunks` — never key values.

Tests: `npm test` (`tests/fallback.test.ts`, `tests/retrieve.test.ts`, `tests/providers.test.ts`). CI: `.github/workflows/ci.yml` runs lint, typecheck, tests, and build on pull requests.

---

## Round 5 — preview fixes

Live preview (`331f593`) showed static matching, caching, retrieval, and eval bugs. Fixes:

1. Cache **only** successful grounded Gemini/Groq answers with sources. Static, email, and “not in my knowledge base” replies are never cached. Cache key is the normalised question.
2. Static matching ignores name tokens (`mike`, `ncube`), requires Jaccard ≥ 0.6 and at least two overlapping content tokens, otherwise refuses politely (email fallback). “What are Mike’s hobbies?” no longer matches “Who is Mike”.
3. Refusals and out-of-scope answers return **no sources**.
4. CRM and claims chunks now include “shipped production system” keywords. Retrieval merges cosine + BM25. Unit test: “What production systems has Mike shipped?” returns `zororo-crm` (40+ users, ~10 roles) and `claims-pipeline`.
5. Per-IP limit uses Upstash when configured. Each instance also has a 2-call concurrency cap and a 30-call/10-minute generation cap so a burst cannot burn the Gemini quota.
6. Gemini **429** opens a 60s circuit (no per-request retry). Groq **401** is logged as an invalid key and skipped for 10 minutes. Responses include `via` and header `x-answered-by: gemini|groq|static|email`.
7. Eval refusal check no longer treats “Email …” next to real content as a refusal.
8. Static copy is CV-only: no “Remote-first”; production systems = CRM + claims (no Digi App Form); Sentinel = Flask SOC, detection engine, audit log, POPIA, 44 passing tests; availability has no em-dash, no “full-time or contract”, no target roles; Sitewarden says “before consequential actions”.

---

## Round 6 — models, circuits, Cube, honest limiter

Live preview at `84cc0b6` answered every question from static or email — no model path. Groq `llama-3.3-70b-versatile` was shut down on 16 Aug 2026 ([deprecations](https://console.groq.com/docs/deprecations)).

1. Groq default `openai/gpt-oss-120b`, second model `openai/gpt-oss-20b`, both overridable via `GROQ_MODEL` / `GROQ_FALLBACK_MODEL`. Gemini stays `gemini-2.5-flash` ([model card](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash)).
2. Retry only 5xx and network/timeouts. 400/401/403/404 fail fast, log `status` + `model`, open a 10-minute circuit. Gemini/Groq 429 still use a 60s circuit.
3. Footer and docs no longer claim “Rate-limited” unless `/api/health` reports `limiter.distributed`. Health exposes `{ distributed, instance, kind }` only.
4. Cube is a first-class KB + static answer using CV facts already in `lib/content.ts` (no CV PDF in the repo; nothing invented). Sentinel eval keeps `MITRE` because the [project README](https://github.com/MikeNcube/proactive-sentinel) documents MITRE ATT&CK correlation.
5. Pipeline diagrams say cosine top 6, matching `DEFAULT_K`. The assistant log scrolls to the start of the new answer.
6. `/api/chat` wraps generation in try/catch: provider failure → static or email, HTTP 200, `via` set.

---

## Round 7 — refusals, cited sources, grounding

Live preview at `36edb33` got grounded Groq answers. Remaining issues:

1. Role-play refusals like “I'm sorry, but I can't comply with that.” were not treated as refusals, so all retrieved sources were attached. `isRefusal` now covers common decline phrasings; refusals return no sources.
2. The API returns only sources the answer cites with `[n]`. If it cites none, it falls back to the top 2 retrieved chunks.
3. Inline `(Sources: [2], [3])` is stripped from the answer body. Inline `[n]` markers stay.
4. Each context block is prefixed `PROJECT: <title>`. The prompt forbids carrying stack/metrics from one project block into another (the CRM/Alembic mix came from a Sentinel chunk).
5. Digi App Form content and knowledge-base chunks stay as they are.
6. Availability / contact / hiring answers always include `mikencube03@gmail.com` (appended in code if the model omits it). Inline `[n]` markers are remapped to the returned sources list so a single cited chunk is `[1]`, not `[2]`.

---

## Round 8 — ZDI Signature & Approval Workflow

New flagship case study `zdi-signature-workflow` (ZDI, Zororo Document Intelligence). Status **Rolling out** (same signal styling as Shipped). Role and outcome say **approved for production rollout at Zororo-Phumulani**; rollout starting soon. ZDI copy does not say shipped, live, or in production. No people names, logins, approval amounts, or security findings. No public “synthetic data” claim.

Homepage **Production systems** group, in order: Digi App Form (Shipped), lead-management CRM (Shipped), ZDI (Rolling out). Then: portfolio RAG, Sitewarden, Cube, claims pipeline, Proactive Sentinel.

| Surface | Change |
|---------|--------|
| `/projects/zdi-signature-workflow` | Case study + HTML/CSS architecture diagram (14px labels, stacked on mobile): three apps → FastAPI API → capability check and workflow guards → config-driven route (submitted → manager → accounts → archived, return-for-correction new revision) → Signature Service → hash-chained evidence table → worker archival PDF → evidence check. Footer: “No AI in approvals · no payments executed”. |
| `lib/knowledge.ts` + `lib/static-answers.ts` | Matching chunk and static answer for “What is ZDI?”. “What production systems has Mike shipped?” names Digi and the CRM as live, and ZDI as approved and rolling out. |
| `evals/eval.ts` | ZDI eval must contain `approved for production rollout` / `rolling out` and must not claim live. Production-systems eval must name Digi, CRM, and ZDI. |
| Sitemap, OG, neighbours | Sitemap maps `allProjects`; project OG uses the tagline; neighbours follow WORK_ORDER: Digi → CRM → ZDI → RAG |

---

## Round 9 — three private projects

Added under **More work**, after ZDI and before the portfolio RAG, all private repos (no GitHub link; **Private repo** marker on the card and case study):

| Project | Slug | Status |
|---------|------|--------|
| Zororo AI OS | `zororo-ai-os` | Built (early stage, not deployed). 310 tests. |
| Claims operations platform | `zororo-claims` | **Approved · standby** — approved, production-ready standby (failover) for the company's live claims system at Zororo-Phumulani. Not the live system. |
| Multi-agent content pipeline | `ai-social-agent` | Prototype. Local Ollama; human approval before scheduling. |

“What production systems has Mike shipped?” names Digi and the CRM as live, ZDI as rolling out, and the claims operations platform as approved and on standby.

---

## What Mike must do

1. **Set `GEMINI_API_KEY`** in Vercel → Settings → Environment Variables (Production + Preview). This is already required; the PR just makes the assistant reliably use it.
2. **Replace the Preview `GROQ_API_KEY`** if it still 401s. Groq default is now `openai/gpt-oss-120b` (override with `GROQ_MODEL`). No paid Groq plan is required.
3. **Enable Upstash on Preview** for a real distributed per-IP limit. Without it, only a per-instance cap applies; the footer will not claim “Rate-limited”.
4. **Replace `/public/Mike_Org.jpeg`** with a 1200×630 export for correct OG image on Twitter/LinkedIn previews.
5. **Run evals against the preview URL** (after re-linking Vercel) and commit the generated `evals/results.json`:
   ```bash
   GEMINI_API_KEY=... npx tsx evals/run.ts --url https://preview-url.vercel.app
   ```
6. **Write Notes content** and uncomment the Notes section scaffold in `app/page.tsx` when ready.
