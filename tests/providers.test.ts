import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateGemini,
  generateGroq,
  geminiAvailable,
  groqAvailable,
  resetProviderCircuits,
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

  it("skips Groq for 10 minutes after a 401 invalid key", async () => {
    resetProviderCircuits();
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonResponse(401, { error: "invalid api key" });
    }) as typeof fetch;

    try {
      await assert.rejects(() => generateGroq("prompt", "key"), /401/);
      assert.equal(calls, 1);
      assert.equal(groqAvailable(), false);
      await assert.rejects(() => generateGroq("prompt", "key"), /cooling down/);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
