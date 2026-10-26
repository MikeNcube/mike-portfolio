import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { retrieve, retrieveKeyword, MIN_RELEVANCE_SCORE } from "../lib/rag";

describe("keyword retrieval fallback", () => {
  it("ranks Sitewarden for a LangGraph query", () => {
    const hits = retrieveKeyword("What is Sitewarden LangGraph?");
    assert.ok(hits.length > 0);
    assert.ok(hits.some((h) => h.id === "sitewarden"));
    assert.ok(hits[0].score >= MIN_RELEVANCE_SCORE);
  });

  it("falls back to BM25 when embeddings throw", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("embedding down");
    }) as typeof fetch;

    try {
      const hits = await retrieve("Proactive Sentinel MITRE Flask", "fake-key", 4);
      assert.ok(hits.length > 0);
      assert.ok(hits.some((h) => h.id.startsWith("proactive-sentinel")));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
