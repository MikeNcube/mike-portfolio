import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { retrieve, type RetrievedChunk } from '@/lib/rag';

// Root cause of previous 502s: gemini-2.5-flash allocates thinking tokens from
// the same maxOutputTokens budget. With 512 tokens, thinking consumed the entire
// budget, producing empty responses that threw errors. Fix: disable thinking via
// thinkingBudget:0 and increase the response token budget.
const GENERATION_MODEL = 'gemini-2.5-flash';
const GENERATION_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent`;

const MAX_MESSAGE_LENGTH = 500;
const MIN_RELEVANCE_SCORE = 0.35;

// ─── LRU response cache ────────────────────────────────────────────────────
// Bounded at 200 entries; avoids re-running full RAG for repeated questions
// (common for the 4 suggested prompts) within the same serverless instance.
// Does not persist across instances — expected and acceptable for a demo.

interface CacheEntry {
  response: string;
  sources: Array<{ title: string; url: string }>;
  ts: number;
}
const CACHE_MAX = 200;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class LRUCache {
  private map = new Map<string, CacheEntry>();

  get(key: string): CacheEntry | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > CACHE_TTL_MS) { this.map.delete(key); return undefined; }
    // Move to most-recently-used position
    this.map.delete(key);
    this.map.set(key, entry);
    return entry;
  }

  set(key: string, value: CacheEntry): void {
    if (this.map.has(key)) this.map.delete(key);
    if (this.map.size >= CACHE_MAX) {
      // Evict least-recently-used (first entry)
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, value);
  }
}

const responseCache = new LRUCache();

function cacheKey(question: string, audienceKey: string): string {
  return `${audienceKey}:${question.toLowerCase().trim()}`;
}

// ─── Rate limiter ──────────────────────────────────────────────────────────
// In-memory, 20 requests per IP per 10 minutes. Does not persist across
// serverless instances. For production, use a Redis-backed store (Upstash).
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const requestLog = new Map<string, number[]>();

function withinRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

// ─── Prompt building ───────────────────────────────────────────────────────
const AUDIENCE_STYLE: Record<string, string> = {
  recruiter: 'The visitor is a recruiter or hiring manager. Be professional and concise; lead with outcomes.',
  developer: 'The visitor is a developer. Be technical and specific; name concrete tools, patterns, and trade-offs.',
  friend: 'The visitor is a friend or casual browser. Be warm and plain-spoken; avoid jargon.',
};

function buildPrompt(message: string, chunks: RetrievedChunk[], audience: string): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.title} (source: ${c.sourceUrl})\n${c.text}`)
    .join('\n\n');
  const style = AUDIENCE_STYLE[audience] ?? AUDIENCE_STYLE.developer;
  return [
    "You are the AI assistant on Mike S Ncube's portfolio site. Answer questions about Mike's experience, projects, and skills.",
    style,
    'Answer ONLY from the context below. If the context does not contain the answer, say you do not have that information and suggest emailing mikencube03@gmail.com.',
    'Never invent projects, employers, metrics, or dates.',
    'Keep answers under 120 words. Plain text only, no markdown headings or bullet points.',
    '',
    'CONTEXT:',
    context,
    '',
    `QUESTION: ${message}`,
  ].join('\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Generation with retry ─────────────────────────────────────────────────
// Three retries with delays capped at ~3s total: 600ms, 1200ms, 1200ms.
// Handles 429 (rate limit) and 5xx server errors.
async function callGeminiWithRetry(url: string, init: RequestInit): Promise<Response> {
  const DELAYS = [600, 1200, 1200] as const;
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      const isRetryable = res.status === 429 || res.status >= 500;
      if (isRetryable && attempt < DELAYS.length) {
        console.error(`chat: generation returned ${res.status}, retrying (attempt ${attempt + 1})`);
        await sleep(DELAYS[attempt]);
        lastError = new Error(`Generation API returned ${res.status}`);
        continue;
      }
      throw new Error(`Generation API returned ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < DELAYS.length) await sleep(DELAYS[attempt]);
    }
  }
  throw lastError;
}

// Returns only sources that have a real navigable URL (not internal descriptions).
function filterToLinkSources(chunks: RetrievedChunk[]): Array<{ title: string; url: string }> {
  return chunks
    .filter(c => c.sourceUrl.startsWith('http'))
    .map(c => ({ title: c.title, url: c.sourceUrl }));
}

// ─── Handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The assistant is not configured yet. Please email mikencube03@gmail.com instead.' },
      { status: 503 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!withinRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  let message: unknown;
  let audience: unknown;
  try {
    const body = await req.json();
    message = body.message;
    audience = body.audience;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }
  const question = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  const audienceKey = typeof audience === 'string' ? audience : 'developer';

  // Cache hit
  const cached = responseCache.get(cacheKey(question, audienceKey));
  if (cached) {
    return NextResponse.json({ response: cached.response, sources: cached.sources, cached: true });
  }

  try {
    const chunks = await retrieve(question, apiKey, 4);
    const relevant = chunks.filter(c => c.score >= MIN_RELEVANCE_SCORE);

    if (relevant.length === 0) {
      return NextResponse.json({
        response: "I don't have information about that in my knowledge base — it covers Mike's projects, skills, and experience. Email him at mikencube03@gmail.com for anything else.",
        sources: [],
      });
    }

    const res = await callGeminiWithRetry(GENERATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(question, relevant, audienceKey) }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.4,
          // Disable thinking tokens — on gemini-2.5-flash, thinking consumes the
          // output token budget before any response text is written. With the
          // previous 512-token limit this produced empty responses → 502 errors.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) throw new Error(`Generation API returned ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();

    if (!text) throw new Error('Empty generation response');

    const sources = filterToLinkSources(relevant);
    responseCache.set(cacheKey(question, audienceKey), { response: text, sources, ts: Date.now() });

    return NextResponse.json({ response: text, sources });
  } catch (err) {
    console.error('chat route failed:', err);
    return NextResponse.json(
      { error: 'The assistant is having trouble right now. Please try again in a moment, or email mikencube03@gmail.com.' },
      { status: 502 },
    );
  }
}
