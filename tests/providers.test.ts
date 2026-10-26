import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateGemini,
  generateGroq,
  geminiAvailable,
  groqAvailable,
  resetProviderCircuits,
  DEFAULT_GROQ_MODEL,
  DEFAULT_GROQ_FALLBACK_MODEL,
  GEMINI_MODEL,
} from "../lib/providers";

afterEach(() => {
  resetProviderCircuits();
});

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("provider circuit breakers", () => {
  it("skips Gemini for 60s after a 429 instead of retrying", async () => {
    resetProviderCircuits();
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonResponse(429, { error: "rate limited" });
    }) as typeof fetch;

    try {
      await assert.rejects(() => generateGemini("prompt", "key"), /429/);
      assert.equal(calls, 1);
      assert.equal(geminiAvailable(), false);
      await assert.rejects(() => generateGemini("prompt", "key"), /cooling down/);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not retry Groq 401 and opens the 10-minute breaker", async () => {
    resetProviderCircuits();
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonResponse(401, { error: "invalid api key" });
    }) as typeof fetch;

    try {
      const started = Date.now();
      await assert.rejects(() => generateGroq("prompt", "key"), /401/);
      assert.ok(Date.now() - started < 800, "401 must fail fast without retry delays");
      assert.equal(calls, 1);
      assert.equal(groqAvailable(), false);
      await assert.rejects(() => generateGroq("prompt", "key"), /cooling down/);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not retry Groq 404; tries the fallback model once then opens the breaker", async () => {
    resetProviderCircuits();
    const prevModel = process.env.GROQ_MODEL;
    const prevFallback = process.env.GROQ_FALLBACK_MODEL;
    delete process.env.GROQ_MODEL;
    delete process.env.GROQ_FALLBACK_MODEL;
    const seen: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { model?: string };
      seen.push(body.model ?? "");
      return jsonResponse(404, { error: "model not found" });
    }) as typeof fetch;

    try {
      const started = Date.now();
      await assert.rejects(() => generateGroq("prompt", "key"), /404/);
      assert.ok(Date.now() - started < 800, "404 must fail fast without retry delays");
      assert.deepEqual(seen, [DEFAULT_GROQ_MODEL, DEFAULT_GROQ_FALLBACK_MODEL]);
      assert.equal(groqAvailable(), false);
      await assert.rejects(() => generateGroq("prompt", "key"), /cooling down/);
      assert.equal(seen.length, 2);
    } finally {
      globalThis.fetch = originalFetch;
      if (prevModel === undefined) delete process.env.GROQ_MODEL;
      else process.env.GROQ_MODEL = prevModel;
      if (prevFallback === undefined) delete process.env.GROQ_FALLBACK_MODEL;
      else process.env.GROQ_FALLBACK_MODEL = prevFallback;
    }
  });

  it("does not retry Gemini 404 and opens the breaker", async () => {
    resetProviderCircuits();
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonResponse(404, { error: "model not found" });
    }) as typeof fetch;

    try {
      const started = Date.now();
      await assert.rejects(
        () => generateGemini("prompt", "key"),
        (err: unknown) => err instanceof Error && err.message.includes("404") && err.message.includes(GEMINI_MODEL),
      );
      assert.ok(Date.now() - started < 800, "404 must fail fast without retry delays");
      assert.equal(calls, 1);
      assert.equal(geminiAvailable(), false);
      await assert.rejects(() => generateGemini("prompt", "key"), /cooling down/);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
