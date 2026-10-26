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

  it("retrieves Digi, CRM, and ZDI for production systems shipped", () => {
    const hits = retrieveKeyword("What production systems has Mike shipped?");
    const ids = hits.map((h) => h.id);
    assert.ok(
      ids.includes("digi-app-form"),
      `expected digi-app-form in ${ids.join(", ")}`,
    );
    assert.ok(
      ids.includes("zororo-crm"),
      `expected zororo-crm in ${ids.join(", ")}`,
    );
    assert.ok(
      ids.includes("zdi-signature-workflow"),
      `expected zdi-signature-workflow in ${ids.join(", ")}`,
    );
    const crm = hits.find((h) => h.id === "zororo-crm");
    assert.ok(crm && crm.score >= MIN_RELEVANCE_SCORE);
    assert.match(crm!.text, /40 people/);
    assert.match(crm!.text, /10 roles/);
    const zdi = hits.find((h) => h.id === "zdi-signature-workflow");
    assert.ok(zdi);
    assert.match(zdi!.text, /rolling out/i);
    assert.ok(
      ids.includes("zororo-claims"),
      `expected zororo-claims in ${ids.join(", ")}`,
    );
  });

  it("retrieves Cube for What is Cube", () => {
    const hits = retrieveKeyword("What is Cube?");
    const ids = hits.map((h) => h.id);
    assert.ok(ids.includes("cube-agent"), `expected cube-agent in ${ids.join(", ")}`);
  });

  it("retrieves ZDI for What is ZDI", () => {
    const hits = retrieveKeyword("What is ZDI?");
    const ids = hits.map((h) => h.id);
    assert.ok(
      ids.includes("zdi-signature-workflow"),
      `expected zdi-signature-workflow in ${ids.join(", ")}`,
    );
    const zdi = hits.find((h) => h.id === "zdi-signature-workflow");
    assert.ok(zdi && zdi.score >= MIN_RELEVANCE_SCORE);
    assert.match(zdi!.text, /^ZDI \(approved for production rollout at Zororo-Phumulani, rolling out soon, not yet live\)/);
    assert.match(zdi!.text, /approved for production rollout/i);
    assert.match(zdi!.text, /rolling out soon/i);
    assert.match(zdi!.text, /not yet live/i);
    assert.doesNotMatch(zdi!.text, /one of Mike's production systems/);
    assert.doesNotMatch(zdi!.text, /\bin production\b/);
    assert.doesNotMatch(zdi!.text, /\bis live\b/i);
    assert.doesNotMatch(zdi!.text, /\bcurrently live\b/i);
    assert.doesNotMatch(zdi!.text, /\bshipped\b/i);
  });

  it("retrieves Zororo AI OS for What is Zororo AI OS", () => {
    const hits = retrieveKeyword("What is Zororo AI OS?");
    const ids = hits.map((h) => h.id);
    assert.ok(ids.includes("zororo-ai-os"), `expected zororo-ai-os in ${ids.join(", ")}`);
    const hit = hits.find((h) => h.id === "zororo-ai-os");
    assert.ok(hit);
    assert.match(hit!.text, /not deployed/);
    assert.match(hit!.text, /310/);
  });

  it("retrieves claims operations as failover standby", () => {
    const hits = retrieveKeyword("What is the claims operations platform?");
    const ids = hits.map((h) => h.id);
    assert.ok(ids.includes("zororo-claims"), `expected zororo-claims in ${ids.join(", ")}`);
    const hit = hits.find((h) => h.id === "zororo-claims");
    assert.ok(hit);
    assert.match(hit!.text, /approved, production-ready standby/i);
    assert.match(hit!.text, /failover/);
    assert.match(hit!.text, /current claims system/);
    assert.match(hit!.text, /not the live system/);
    assert.match(hit!.text, /^The claims operations platform is an approved, production-ready standby/);
    assert.doesNotMatch(hit!.text, /one of Mike's production systems/);
  });

  it("retrieves Proactive Sentinel with MITRE ATT&CK mapping first", () => {
    const hits = retrieveKeyword("Walk me through Proactive Sentinel's architecture.");
    const hit = hits.find((h) => h.id.startsWith("proactive-sentinel"));
    assert.ok(hit, `expected a sentinel chunk in ${hits.map((h) => h.id).join(", ")}`);
    assert.match(hit!.text, /MITRE ATT&CK/);
    assert.match(hit!.text, /correlat/i);
    const overview = hits.find((h) => h.id === "proactive-sentinel-overview");
    assert.ok(overview);
    assert.match(overview!.text, /^Proactive Sentinel maps events to MITRE ATT&CK/);
  });

  it("retrieves the multi-agent content pipeline", () => {
    const hits = retrieveKeyword("What is the multi-agent content pipeline?");
    const ids = hits.map((h) => h.id);
    assert.ok(ids.includes("ai-social-agent"), `expected ai-social-agent in ${ids.join(", ")}`);
    const hit = hits.find((h) => h.id === "ai-social-agent");
    assert.ok(hit);
    assert.match(hit!.text, /prototype/i);
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
