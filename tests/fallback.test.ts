import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, EMAIL_FALLBACK, shouldCacheAnswer } from "../lib/answer";
import { matchStaticAnswer } from "../lib/static-answers";
import { isRefusal } from "../lib/refusal";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";
import type { RetrievedChunk } from "../lib/rag";

const CHUNKS: RetrievedChunk[] = [
  {
    id: "positioning",
    title: "Who Mike is",
    sourceUrl: "https://github.com/MikeNcube",
    text: "Mike S Ncube is an Applied AI Engineer at Zororo-Phumulani Funeral Assurance.",
    score: 0.91,
  },
];

const retrieveFn = async (): Promise<RetrievedChunk[]> => CHUNKS;

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("assistant fallback chain", () => {
  it("falls back to Groq when Gemini fails", async () => {
    const result = await answerQuestion({
      question: "Who is Mike Ncube?",
      retrieveFn,
      generateGemini: async () => {
        throw new Error("429 rate limited");
      },
      generateGroq: async (prompt) => {
        assert.match(prompt, /CONTEXT:/);
        assert.match(prompt, /QUESTION: Who is Mike Ncube\?/);
        return "Groq grounded answer about Mike at Zororo.";
      },
    });

    assert.equal(result.via, "groq");
    assert.equal(result.response, "Groq grounded answer about Mike at Zororo.");
    assert.equal(result.sources[0]?.url, "https://github.com/MikeNcube");
    assert.equal(shouldCacheAnswer(result), true);
  });

  it("serves a static CV answer when Gemini and Groq both fail", async () => {
    const result = await answerQuestion({
      question: "Who is Mike Ncube?",
      retrieveFn,
      generateGemini: async () => {
        throw new Error("500");
      },
      generateGroq: async () => {
        throw new Error("503");
      },
    });

    assert.equal(result.via, "static");
    assert.match(result.response, /Applied AI Engineer/);
    assert.match(result.response, /Zororo-Phumulani/);
    assert.doesNotMatch(result.response, /Remote-first/);
    assert.doesNotMatch(result.response, /4\+ years/);
    assert.doesNotMatch(result.response, /confidential client/);
    assert.ok(result.sources.length > 0);
    assert.equal(shouldCacheAnswer(result), false);
  });

  it("uses the email fallback when nothing can answer", async () => {
    const result = await answerQuestion({
      question: "What is 2 + 2?",
      retrieveFn: async () => [],
      generateGemini: async () => {
        throw new Error("fail");
      },
      generateGroq: async () => {
        throw new Error("fail");
      },
    });

    assert.equal(result.via, "email");
    assert.equal(result.response, EMAIL_FALLBACK);
    assert.equal(result.sources.length, 0);
    assert.match(result.response, /mikencube03@gmail.com/);
    assert.equal(shouldCacheAnswer(result), false);
  });

  it("does not treat hobbies as a Who-is-Mike static match", async () => {
    assert.equal(matchStaticAnswer("What are Mike's hobbies?"), null);

    const result = await answerQuestion({
      question: "What are Mike's hobbies?",
      retrieveFn: async () => [],
      generateGemini: async () => {
        throw new Error("fail");
      },
      generateGroq: async () => {
        throw new Error("fail");
      },
    });

    assert.equal(result.via, "email");
    assert.equal(result.sources.length, 0);
    assert.equal(shouldCacheAnswer(result), false);
  });

  it("does not attach sources to a model refusal", async () => {
    const result = await answerQuestion({
      question: "What are Mike's hobbies?",
      retrieveFn,
      generateGemini: async () =>
        "I don't have information about that in my knowledge base. Email mikencube03@gmail.com.",
    });

    assert.equal(result.via, "gemini");
    assert.equal(result.sources.length, 0);
    assert.equal(shouldCacheAnswer(result), false);
  });

  it("does not cache a not-in-knowledge-base reply even with retrieved chunks", async () => {
    const result = await answerQuestion({
      question: "What are Mike's hobbies?",
      retrieveFn,
      generateGemini: async () =>
        "That is not in my knowledge base. Email mikencube03@gmail.com.",
    });

    assert.equal(result.via, "gemini");
    assert.equal(result.sources.length, 0);
    assert.equal(shouldCacheAnswer(result), false);
  });
});

describe("refusal detection", () => {
  it("does not treat a bio that includes an email as a refusal", () => {
    const bio =
      "Mike S Ncube is an Applied AI Engineer at Zororo-Phumulani. Email mikencube03@gmail.com.";
    assert.equal(isRefusal(bio), false);
  });

  it("treats a knowledge-base miss plus email as a refusal", () => {
    assert.equal(isRefusal(EMAIL_FALLBACK), true);
    assert.equal(
      isRefusal("That is not in my knowledge base. Email mikencube03@gmail.com."),
      true,
    );
  });
});

describe("static CV copy", () => {
  it("keeps production-systems facts on the CV", () => {
    const hit = matchStaticAnswer("What production systems has Mike shipped?");
    assert.ok(hit);
    assert.match(hit.answer, /CRM/);
    assert.match(hit.answer, /40/);
    assert.match(hit.answer, /claims/i);
    assert.doesNotMatch(hit.answer, /Digi App Form/);
  });

  it("limits Sentinel and availability to CV wording", () => {
    const sentinel = matchStaticAnswer("Walk me through Proactive Sentinel's architecture.");
    assert.ok(sentinel);
    assert.match(sentinel.answer, /Flask SOC/);
    assert.match(sentinel.answer, /detection engine/);
    assert.match(sentinel.answer, /audit log/);
    assert.match(sentinel.answer, /POPIA/);
    assert.match(sentinel.answer, /44 passing tests/);

    const avail = matchStaticAnswer("Is Mike available for hire?");
    assert.ok(avail);
    assert.doesNotMatch(avail.answer, /full-time or contract/);
    assert.doesNotMatch(avail.answer, /Target roles/);
    assert.doesNotMatch(avail.answer, /—/);
    assert.match(avail.answer, /available/);
    assert.match(avail.answer, /mikencube03@gmail.com/);

    const site = matchStaticAnswer("What is Sitewarden?");
    assert.ok(site);
    assert.match(site.answer, /before consequential actions/);
    assert.doesNotMatch(site.answer, /before writes/);
  });
});
