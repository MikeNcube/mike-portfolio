import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { retrieve, type RetrievedChunk } from '@/lib/rag';

const GENERATION_MODEL = 'gemini-2.5-flash';
const GENERATION_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent`;

const MAX_MESSAGE_LENGTH = 500;
const MIN_RELEVANCE_SCORE = 0.35;
const RETRY_DELAY_MS = 400;

// Very small in-memory rate limiter: 20 requests per IP per 10 minutes.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const requestLog = new Map<string, number[]>();

// Returns true if this IP is within its rate budget.
function withinRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

const AUDIENCE_STYLE: Record<string, string> = {
  recruiter: 'The visitor is a recruiter or hiring manager. Be professional and concise; lead with outcomes and availability.',
  developer: 'The visitor is a developer. Be technical and specific; name concrete tools, patterns, and trade-offs.',
  friend: 'The visitor is a friend or casual browser. Be warm and plain-spoken; avoid jargon.',
};

// Builds the grounded prompt from retrieved chunks.
function buildPrompt(message: string, chunks: RetrievedChunk[], audience: string): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.title} (source: ${c.sourceUrl})\n${c.text}`)
    .join('\n\n');
  const style = AUDIENCE_STYLE[audience] ?? AUDIENCE_STYLE.developer;
  return [
    "You are the AI assistant on Mike S Ncube's portfolio site. You answer questions about Mike's experience, projects, and skills.",
    style,
    'Answer ONLY from the context below. If the context does not contain the answer, say you do not have that information and suggest emailing mikencube03@gmail.com. Never invent projects, employers, metrics, or dates.',
    'Keep answers under 120 words. Plain text only, no markdown headings.',
    '',
    'CONTEXT:',
    context,
    '',
    `VISITOR QUESTION: ${message}`,
  ].join('\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calls the Gemini generation API, retrying once after a fixed delay on
// transient failures (network error or non-200 response).
async function callGeminiWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, init);
    if (res.ok) return res;
    throw new Error(`Generation API returned ${res.status}`);
  } catch (err) {
    console.error('chat route: generation call failed, retrying once:', err);
    await sleep(RETRY_DELAY_MS);
    return fetch(url, init);
  }
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

  try {
    const chunks = await retrieve(question, apiKey, 4);
    const relevant = chunks.filter(c => c.score >= MIN_RELEVANCE_SCORE);

    if (relevant.length === 0) {
      return NextResponse.json({
        response:
          "I don't have information about that in my knowledge base — it only covers Mike's projects, skills, and experience. For anything else, email him at mikencube03@gmail.com.",
        sources: [],
      });
    }

    const res = await callGeminiWithRetry(GENERATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(question, relevant, audienceKey) }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
      }),
    });
    if (!res.ok) throw new Error(`Generation API returned ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();

    if (!text) throw new Error('Empty generation response');

    return NextResponse.json({
      response: text,
      sources: relevant.map(c => ({ title: c.title, url: c.sourceUrl })),
    });
  } catch (err) {
    console.error('chat route failed:', err);
    return NextResponse.json(
      { error: 'The assistant is having trouble responding right now. Please try again in a moment, or email mikencube03@gmail.com.' },
      { status: 502 },
    );
  }
}
