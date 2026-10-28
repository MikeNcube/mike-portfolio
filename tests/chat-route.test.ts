import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/chat/route";
import { answerWithStaticFallback, EMAIL_FALLBACK } from "../lib/answer";
import { ANSWER_CACHE_VERSION } from "../lib/status-copy";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";

const originalGemini = process.env.GEMINI_API_KEY;
const originalGroq = process.env.GROQ_API_KEY;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GROQ_API_KEY = "test-groq-key";
  globalThis.fetch = (async () =>
    ({
      ok: false,
      status: 404,
      json: async () => ({ error: "not found" }),
      text: async () => '{"error":"not found"}',
    }) as Response) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalGemini;
  if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalGroq;
});

function chatRequest(message: string): NextRequest {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

describe("answer cache key", () => {
  it("uses a bumped version so older cached answers are not reused", () => {
    assert.equal(ANSWER_CACHE_VERSION, "r58");
  });
});

describe("chat route never returns 5xx when providers fail", () => {
  it("degrades to static with 200 and via when every provider fails", async () => {
    const res = await POST(chatRequest("Who is Mike Ncube?"));
    assert.ok(res.status < 500, `expected no 5xx, got ${res.status}`);
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; via: string; sources: unknown[] };
    assert.equal(body.via, "static");
    assert.match(body.response, /Applied AI Engineer/);
    assert.equal(res.headers.get("x-answered-by"), "static");
  });

  it("degrades to email with 200 and via for unmatched questions", async () => {
    const res = await POST(chatRequest("What is 2 + 2?"));
    assert.ok(res.status < 500, `expected no 5xx, got ${res.status}`);
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; via: string; sources: unknown[] };
    assert.equal(body.via, "email");
    assert.equal(body.sources.length, 0);
    assert.match(body.response, /mikencube03@gmail.com/);
    assert.equal(res.headers.get("x-answered-by"), "email");
  });
});

describe("quota exhaustion degrades to a grounded answer", () => {
  it("answers from the knowledge base with sources when every provider returns 429", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "60" }),
        json: async () => ({ error: { code: 429, message: "quota exceeded" } }),
        text: async () => '{"error":{"code":429,"message":"quota exceeded"}}',
      }) as Response) as typeof fetch;
    const res = await POST(chatRequest("What database does the CRM use?"));
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; via: string; sources: unknown[] };
    assert.equal(body.via, "static");
    assert.ok(body.sources.length > 0, body.response);
    assert.match(body.response, /PostgreSQL/);
  });

  it("retries the keyless path when the full path throws", async () => {
    let calls = 0;
    const result = await answerWithStaticFallback({ question: "Who is Mike Ncube?" }, async (input) => {
      calls += 1;
      if (calls === 1) throw new Error("unexpected");
      assert.equal(input.generateGemini, undefined);
      return { response: "grounded [1].", sources: [{ title: "t", url: "u" }], via: "static" };
    });
    assert.equal(calls, 2);
    assert.equal(result.via, "static");
  });

  it("gives the email reply only when the keyless path also throws", async () => {
    const result = await answerWithStaticFallback({ question: "Who is Mike Ncube?" }, async () => {
      throw new Error("unexpected");
    });
    assert.equal(result.response, EMAIL_FALLBACK);
    assert.equal(result.via, "email");
  });
});
