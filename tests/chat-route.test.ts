import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/chat/route";
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
    assert.equal(ANSWER_CACHE_VERSION, "r23");
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
