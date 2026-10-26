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

  it("retrieves CRM and claims for production systems shipped", () => {
    const hits = retrieveKeyword("What production systems has Mike shipped?");
    const ids = hits.map((h) => h.id);
    assert.ok(
      ids.includes("zororo-crm"),
      `expected zororo-crm in ${ids.join(", ")}`,
    );
    assert.ok(
      ids.includes("claims-pipeline"),
      `expected claims-pipeline in ${ids.join(", ")}`,
    );
    const crm = hits.find((h) => h.id === "zororo-crm");
    assert.ok(crm && crm.score >= MIN_RELEVANCE_SCORE);
    assert.match(crm!.text, /40 people/);
    assert.match(crm!.text, /10 roles/);
  });

  it("falls back to BM25 when embeddings throw", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("embedding down");
    }) as typeof fetch;

    try {
      const hits = await retrieve("Proactive Sentinel MITRE Flask", "fake-key", 6);
      assert.ok(hits.length > 0);
      assert.ok(hits.some((h) => h.id.startsWith("proactive-sentinel")));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
