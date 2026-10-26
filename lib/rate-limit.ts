// Per-IP rate limit. Uses Upstash Redis when configured (Production),
// otherwise an in-memory map (local / Preview without Redis).

export const RATE_LIMIT = 20;
export const RATE_WINDOW_SEC = 10 * 60;

type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const memoryLog = new Map<string, number[]>();

function allowMemory(ip: string): RateLimitResult {
  const now = Date.now();
  const windowMs = RATE_WINDOW_SEC * 1000;
  const recent = (memoryLog.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= RATE_LIMIT) {
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  recent.push(now);
  memoryLog.set(ip, recent);
  return { ok: true };
}

async function allowUpstash(ip: string): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return allowMemory(ip);

  const key = `portfolio:rl:${ip}`;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, RATE_WINDOW_SEC],
      ["TTL", key],
    ]),
  });
  if (!res.ok) throw new Error(`Upstash returned ${res.status}`);

  const rows = await res.json() as Array<{ result: number }>;
  const count = rows[0]?.result ?? 0;
  const ttl = rows[2]?.result ?? RATE_WINDOW_SEC;
  if (count > RATE_LIMIT) {
    return { ok: false, retryAfterSec: Math.max(1, ttl) };
  }
  return { ok: true };
}

export function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function allowRequest(ip: string): Promise<RateLimitResult> {
  if (upstashConfigured()) {
    try {
      return await allowUpstash(ip);
    } catch (err) {
      console.error("upstash rate limit failed, using memory:", err);
    }
  }
  return allowMemory(ip);
}
