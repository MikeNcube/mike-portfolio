// LLM providers. Gemini is primary; Groq is the free-tier fallback.
// Each provider is budgeted ~12s. 429/401 open a circuit instead of retrying.

export const PROVIDER_TIMEOUT_MS = 12_000;
const RETRY_DELAYS = [600, 1200, 1200] as const;
export const GEMINI_COOLDOWN_MS = 60_000;
export const GROQ_INVALID_KEY_COOLDOWN_MS = 10 * 60 * 1000;

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GenerateFn = (prompt: string) => Promise<string>;

let geminiCoolUntil = 0;
let groqCoolUntil = 0;

export function geminiAvailable(): boolean {
  return Date.now() >= geminiCoolUntil;
}

export function groqAvailable(): boolean {
  return Date.now() >= groqCoolUntil;
}

export function resetProviderCircuits(): void {
  geminiCoolUntil = 0;
  groqCoolUntil = 0;
}

function openCircuit(provider: "gemini" | "groq", ms: number, reason: string): void {
  const until = Date.now() + ms;
  if (provider === "gemini") geminiCoolUntil = until;
  else groqCoolUntil = until;
  console.error(`[provider] ${provider} circuit open ${ms}ms: ${reason}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

async function fetchUntilDeadline(
  url: string,
  init: RequestInit,
  deadline: number,
): Promise<Response> {
  const left = remainingMs(deadline);
  if (left < 50) throw new Error("Provider timed out");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), left);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function shouldRetryStatus(status: number): boolean {
  return status >= 500;
}

async function callWithRetry(
  provider: "gemini" | "groq",
  url: string,
  init: RequestInit,
  deadline: number,
): Promise<Response> {
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (remainingMs(deadline) < 50) throw new Error(`${provider} timed out`);
    try {
      const res = await fetchUntilDeadline(url, init, deadline);
      if (res.ok) return res;

      if (provider === "gemini" && res.status === 429) {
        openCircuit("gemini", GEMINI_COOLDOWN_MS, "HTTP 429 rate limited");
        throw new Error("Gemini 429 rate limited");
      }
      if (provider === "groq" && res.status === 401) {
        openCircuit("groq", GROQ_INVALID_KEY_COOLDOWN_MS, "HTTP 401 invalid key");
        console.error("[provider] groq 401 invalid key — skip Groq for 10 minutes");
        throw new Error("Groq 401 invalid key");
      }

      if (shouldRetryStatus(res.status) && attempt < RETRY_DELAYS.length) {
        const wait = Math.min(RETRY_DELAYS[attempt], remainingMs(deadline));
        console.error(`[provider] ${provider} ${res.status}, retrying (attempt ${attempt + 1})`);
        lastError = new Error(`${provider} returned ${res.status}`);
        if (wait > 0) await sleep(wait);
        continue;
      }

      console.error(`[provider] ${provider} failed`, { status: res.status });
      throw new Error(`${provider} returned ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      if (msg.includes("429") || msg.includes("401") || msg.includes("invalid key")) {
        throw lastError;
      }
      if (attempt < RETRY_DELAYS.length && remainingMs(deadline) > RETRY_DELAYS[attempt]) {
        console.error(`[provider] ${provider} error, retrying:`, lastError);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      console.error(`[provider] ${provider} failed:`, lastError);
      throw lastError;
    }
  }
  throw lastError;
}

export async function generateGemini(prompt: string, apiKey: string): Promise<string> {
  if (!geminiAvailable()) {
    throw new Error("Gemini cooling down after 429");
  }
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  const res = await callWithRetry(
    "gemini",
    GEMINI_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
    deadline,
  );

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

export async function generateGroq(prompt: string, apiKey: string): Promise<string> {
  if (!groqAvailable()) {
    throw new Error("Groq cooling down after 401");
  }
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  const res = await callWithRetry(
    "groq",
    GROQ_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
      }),
    },
    deadline,
  );

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty Groq response");
  return text;
}
