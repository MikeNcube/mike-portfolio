import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { answerQuestion } from "@/lib/answer";
import { generateGemini, generateGroq } from "@/lib/providers";
import { allowRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;

interface CacheEntry {
  response: string;
  sources: Array<{ title: string; url: string }>;
  ts: number;
}
const CACHE_MAX = 200;
const CACHE_TTL_MS = 5 * 60 * 1000;

class LRUCache {
  private map = new Map<string, CacheEntry>();

  get(key: string): CacheEntry | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry;
  }

  set(key: string, value: CacheEntry): void {
    if (this.map.has(key)) this.map.delete(key);
    if (this.map.size >= CACHE_MAX) {
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

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const allowed = await allowRequest(ip);
  if (!allowed.ok) {
    return NextResponse.json(
      {
        error: `Too many messages from this network. Please wait a few minutes and try again, or email mikencube03@gmail.com.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(allowed.retryAfterSec) },
      },
    );
  }

  let message: unknown;
  let audience: unknown;
  try {
    const body = await req.json();
    message = body.message;
    audience = body.audience;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        error: `Questions are limited to ${MAX_MESSAGE_LENGTH} characters. Please shorten your question and try again.`,
      },
      { status: 400 },
    );
  }

  const question = message.trim();
  const audienceKey = typeof audience === "string" ? audience : "developer";

  const cached = responseCache.get(cacheKey(question, audienceKey));
  if (cached) {
    return NextResponse.json({ response: cached.response, sources: cached.sources, cached: true });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const result = await answerQuestion({
    question,
    audience: audienceKey,
    geminiKey,
    generateGemini: geminiKey
      ? (prompt) => generateGemini(prompt, geminiKey)
      : undefined,
    generateGroq: groqKey ? (prompt) => generateGroq(prompt, groqKey) : undefined,
  });

  responseCache.set(cacheKey(question, audienceKey), {
    response: result.response,
    sources: result.sources,
    ts: Date.now(),
  });

  return NextResponse.json({ response: result.response, sources: result.sources });
}
