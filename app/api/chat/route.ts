import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { retrieve, type RetrievedChunk } from '@/lib/rag';

// gemini-2.5-flash has hybrid thinking/response token budget.
// With maxOutputTokens at 512, thinking tokens can consume the entire budget,
// leaving zero tokens for actual response text — causing truncated answers and
// empty-response errors that surface as 502s. Fix: disable thinking entirely
// via thinkingBudget:0 and keep the output budget generous for short answers.
const GENERATION_MODEL = 'gemini-2.5-flash';
const GENERATION_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent`;

const MAX_MESSAGE_LENGTH = 500;
const MIN_RELEVANCE_SCORE = 0.35;

// Simple response cache: avoids re-running full RAG for repeated questions
// within the same serverless instance lifetime (common for suggested prompts).
// Not persisted across instances — that is expected and acceptable for a demo.
const responseCache = new Map<string, { response: string; sources: Array<{ title: string; url: string }>; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(question: string, audienceKey: string): string {
  return `${audienceKey}:${question.toLowerCase().trim()}`;
}

function getFromCache(key: string) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry;
}

// In-memory rate limiter: 20 requests per IP per 10 minutes.
// Note: does not persist across serverless function instances — each cold start
// has a fresh counter. This is acceptable for a portfolio demo; for production
// use a Redis-backed store (Upstash, Vercel KV) instead.
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

// Calls the Gemini generation API with exponential backoff on transient failures.
// Handles 429 (rate limit) and 5xx server errors with up to 3 retries.
async function callGeminiWithRetry(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error = new Error('No attempts made');
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      const isRetryable = res.status === 429 || res.status >= 500;
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.min(800 * Math.pow(2, attempt), 6400);
        console.error(`chat route: generation returned ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1})`);
        await sleep(delay);
        lastError = new Error(`Generation API returned ${res.status}`);
        continue;
      }
      throw new Error(`Generation API returned ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = Math.min(800 * Math.pow(2, attempt), 6400);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// Returns only sources that have a real URL (not internal-only descriptions).
function filterToLinkSources(chunks: RetrievedChunk[]): Array<{ title: string; url: string }> {
  return chunks
    .filter(c => c.sourceUrl.startsWith('http'))
    .map(c => ({ title: c.title, url: c.sourceUrl }));
}

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

  const cached = getFromCache(cacheKey(question, audienceKey));
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
          // Disable thinking tokens — they consume the output budget first,
          // leaving insufficient tokens for the actual response text on free tier.
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
    const entry = { response: text, sources, ts: Date.now() };
    responseCache.set(cacheKey(question, audienceKey), entry);

    return NextResponse.json({ response: text, sources });
  } catch (err) {
    console.error('chat route failed:', err);
    return NextResponse.json(
      { error: 'The assistant is having trouble right now. Please try again in a moment, or email mikencube03@gmail.com.' },
      { status: 502 },
    );
  }
}
