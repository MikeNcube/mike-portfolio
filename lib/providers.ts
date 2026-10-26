// LLM providers. Gemini is primary; Groq is the free-tier fallback.
// Each provider is budgeted ~12s. Retry only 5xx and network/timeouts.
// 400/401/403/404 fail fast and open a 10-minute circuit. Gemini/Groq 429
// open a 60s circuit instead of retrying.

export const PROVIDER_TIMEOUT_MS = 12_000;
const RETRY_DELAYS = [600, 1200, 1200] as const;
export const RATE_LIMIT_COOLDOWN_MS = 60_000;
export const CLIENT_ERROR_COOLDOWN_MS = 10 * 60 * 1000;
/** @deprecated use RATE_LIMIT_COOLDOWN_MS */
export const GEMINI_COOLDOWN_MS = RATE_LIMIT_COOLDOWN_MS;
/** @deprecated use CLIENT_ERROR_COOLDOWN_MS */
export const GROQ_INVALID_KEY_COOLDOWN_MS = CLIENT_ERROR_COOLDOWN_MS;

export const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Groq shut down llama-3.3-70b-versatile for free/developer tiers on 16 Aug 2026.
// https://console.groq.com/docs/deprecations
// https://console.groq.com/docs/models
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
export const GROQ_MODEL = DEFAULT_GROQ_MODEL;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GenerateFn = (prompt: string) => Promise<string>;

export class ProviderHttpError extends Error {
  constructor(
    public readonly provider: "gemini" | "groq",
    public readonly status: number,
    public readonly model: string,
  ) {
    super(`${provider} HTTP ${status} model=${model}`);
    this.name = "ProviderHttpError";
  }
}

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

export function groqModels(): string[] {
  const primary = (process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL).trim();
  const fallback = (process.env.GROQ_FALLBACK_MODEL ?? DEFAULT_GROQ_FALLBACK_MODEL).trim();
  const out: string[] = [];
  for (const m of [primary, fallback]) {
    if (m && !out.includes(m)) out.push(m);
  }
  return out.length > 0 ? out : [DEFAULT_GROQ_MODEL];
}

function openCircuit(provider: "gemini" | "groq", ms: number, reason: string): void {
  const until = Date.now() + ms;
  if (provider === "gemini") geminiCoolUntil = until;
  else groqCoolUntil = until;
  console.error(`[provider] ${provider} circuit open ${ms}ms: ${reason}`);
}

function isFatalClientStatus(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

function shouldRetryStatus(status: number): boolean {
  return status >= 500;
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

function tripClientCircuit(
  provider: "gemini" | "groq",
  status: number,
  model: string,
): void {
  const reason = `HTTP ${status} model=${model}`;
  console.error(
    `[provider] ${provider} ${status} model=${model} — fail fast, circuit 10min`,
  );
  openCircuit(provider, CLIENT_ERROR_COOLDOWN_MS, reason);
}

async function callWithRetry(
  provider: "gemini" | "groq",
  url: string,
  init: RequestInit,
  deadline: number,
  model: string,
): Promise<Response> {
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (remainingMs(deadline) < 50) throw new Error(`${provider} timed out`);
    try {
      const res = await fetchUntilDeadline(url, init, deadline);
      if (res.ok) return res;

      if (res.status === 429) {
        console.error(`[provider] ${provider} 429 model=${model} — circuit ${RATE_LIMIT_COOLDOWN_MS}ms`);
        openCircuit(provider, RATE_LIMIT_COOLDOWN_MS, `HTTP 429 model=${model}`);
        throw new ProviderHttpError(provider, 429, model);
      }

      if (isFatalClientStatus(res.status)) {
        throw new ProviderHttpError(provider, res.status, model);
      }

      if (shouldRetryStatus(res.status) && attempt < RETRY_DELAYS.length) {
        const wait = Math.min(RETRY_DELAYS[attempt], remainingMs(deadline));
        console.error(`[provider] ${provider} ${res.status} model=${model}, retrying (attempt ${attempt + 1})`);
        lastError = new ProviderHttpError(provider, res.status, model);
        if (wait > 0) await sleep(wait);
        continue;
      }

      console.error(`[provider] ${provider} failed`, { status: res.status, model });
      throw new ProviderHttpError(provider, res.status, model);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError instanceof ProviderHttpError && !shouldRetryStatus(lastError.status)) {
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
    throw new Error("Gemini cooling down");
  }
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  let res: Response;
  try {
    res = await callWithRetry(
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
      GEMINI_MODEL,
    );
  } catch (err) {
    if (err instanceof ProviderHttpError && isFatalClientStatus(err.status)) {
      tripClientCircuit("gemini", err.status, GEMINI_MODEL);
    }
    throw err;
  }

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

async function generateGroqOnce(
  prompt: string,
  apiKey: string,
  model: string,
  deadline: number,
): Promise<string> {
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
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_completion_tokens: 800,
        reasoning_effort: "low",
        include_reasoning: false,
      }),
    },
    deadline,
    model,
  );

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty Groq response");
  return text;
}

export async function generateGroq(prompt: string, apiKey: string): Promise<string> {
  if (!groqAvailable()) {
    throw new Error("Groq cooling down");
  }
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  const models = groqModels();
  let lastError: Error = new Error("No Groq models configured");

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await generateGroqOnce(prompt, apiKey, model, deadline);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const status = err instanceof ProviderHttpError ? err.status : 0;

      if (status === 401) {
        console.error("[provider] groq 401 invalid key — skip Groq for 10 minutes");
        tripClientCircuit("groq", 401, model);
        throw lastError;
      }
      if (status === 400 || status === 403) {
        tripClientCircuit("groq", status, model);
        throw lastError;
      }
      if (status === 404) {
        const next = models[i + 1];
        if (next) {
          console.error(`[provider] groq 404 model=${model} — trying fallback ${next}`);
          continue;
        }
        tripClientCircuit("groq", 404, model);
        throw lastError;
      }
      throw lastError;
    }
  }
  throw lastError;
}
