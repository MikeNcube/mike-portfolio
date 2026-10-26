// LLM providers. Gemini is primary; Groq is the free-tier fallback.
// Each provider is budgeted ~12s including retries.

export const PROVIDER_TIMEOUT_MS = 12_000;
const RETRY_DELAYS = [600, 1200, 1200] as const;

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GenerateFn = (prompt: string) => Promise<string>;

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

async function callWithRetry(
  url: string,
  init: RequestInit,
  deadline: number,
): Promise<Response> {
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (remainingMs(deadline) < 50) throw new Error("Provider timed out");
    try {
      const res = await fetchUntilDeadline(url, init, deadline);
      if (res.ok) return res;

      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < RETRY_DELAYS.length) {
        const wait = Math.min(RETRY_DELAYS[attempt], remainingMs(deadline));
        console.error(`provider: ${res.status}, retrying (attempt ${attempt + 1})`);
        lastError = new Error(`Provider returned ${res.status}`);
        if (wait > 0) await sleep(wait);
        continue;
      }
      throw new Error(`Provider returned ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < RETRY_DELAYS.length && remainingMs(deadline) > RETRY_DELAYS[attempt]) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

export async function generateGemini(prompt: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  const res = await callWithRetry(
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
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  const res = await callWithRetry(
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
