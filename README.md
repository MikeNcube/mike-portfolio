# Mike S Ncube — AI Engineer Portfolio

Live at [mike-portfolio-tawny.vercel.app](https://mike-portfolio-tawny.vercel.app) — the single canonical deployment.

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS. Two typefaces (Inter + JetBrains Mono, self-hosted via `next/font`), a dark, restrained design system (tokens and rules in [DESIGN.md](./DESIGN.md)), and a working RAG assistant as the centrepiece.

## The RAG assistant

`/api/chat` is a real retrieval-augmented pipeline, not a canned-response widget:

1. **Knowledge base** — `lib/knowledge.ts`, curated exclusively from verifiable material (GitHub profile + repo READMEs, this site's copy). Every chunk carries a `sourceUrl`.
2. **Retrieval** — `lib/rag.ts` embeds the KB once per server instance (`gemini-embedding-001`, batched, cached) and each visitor query per request, ranking by cosine similarity.
3. **Generation** — `gemini-2.5-flash`, grounded only in the retrieved chunks; answers return their sources for the UI to cite.
4. **Honesty** — below a similarity threshold the assistant refuses and points to email. No API key → 503 with an honest message. Per-IP rate limiting (20 req / 10 min) and input validation throughout.

## Contact form

`/api/contact` sends real email via Resend: validation, HTML escaping, per-IP rate limiting (5/hour), `replyTo` set to the sender. Failures are reported honestly — there is no fake "sent" state anywhere.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For the assistant | Embeddings + generation ([create](https://aistudio.google.com/apikey)) |
| `RESEND_API_KEY` | For the contact form | Email delivery ([create](https://resend.com/api-keys)) |
| `CONTACT_TO_EMAIL` | Optional | Recipient override (defaults to Mike's email) |
| `CONTACT_FROM_EMAIL` | Optional | Sender identity (defaults to Resend onboarding sender) |

Without keys both endpoints fail with a 503 and direct visitors to email — nothing on the site pretends to work.

## Develop

```bash
npm install
cp .env.example .env.local   # add keys
npm run dev
```

Quality gates before commit:

```bash
npx tsc --noEmit   # must exit 0
npm run build      # must succeed
```

## Content rules

All portfolio content lives in `lib/content.ts` and the assistant's knowledge in `lib/knowledge.ts`. House rule: **every project, metric, and claim must trace to verifiable material** — a public repo, this site itself, or explicitly-labelled private client work. Status labels (`Production` / `Shipped` / `Live demo` / `Reference` / `Lab`) are honest by design.
