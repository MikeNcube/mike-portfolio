import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  contentTerms,
  evaluateGrounding,
  unknownTechNote,
  validateModelSentences,
} from "../lib/grounding";
import { isUnknowableQuestion, UNKNOWABLE_REGEX_COUNT } from "../lib/unknowable";

describe("r52 grounding gate", () => {
  it("treats unmatched World Cup terms as a failed candidate", () => {
    const g = evaluateGrounding(
      "Who won the 2026 World Cup?",
      "Mike S Ncube is an Applied AI Engineer in Johannesburg [1].",
    );
    assert.equal(g.ok, false);
    assert.ok(g.unmatchedNonTech.length > 0);
  });

  it("passes Redis and notes Kafka as unknown tech", () => {
    const g = evaluateGrounding(
      "Has Mike used Redis and Kafka?",
      "Mike's stack lists Redis [1].",
    );
    assert.equal(g.ok, true);
    assert.ok(g.knownTerms.some((t) => t.toLowerCase() === "redis"));
    assert.ok(g.unknownTech.some((t) => t.toLowerCase() === "kafka"));
    assert.match(unknownTechNote(g.unknownTech), /Kafka isn't listed/i);
  });

  it("fails a Kubernetes-only years hijack", () => {
    const g = evaluateGrounding(
      "Does Mike have experience with Kubernetes?",
      "Mike has six-plus years in software [1].",
    );
    assert.equal(g.ok, false);
  });

  it("grounds favourite programming language on Python", () => {
    const terms = contentTerms("What's Mike's favourite programming language?");
    assert.ok(terms.some((t) => /program|language/i.test(t)));
    const g = evaluateGrounding(
      "What's Mike's favourite programming language?",
      "The stack lists Python and TypeScript [1].",
    );
    assert.equal(g.ok, true, JSON.stringify(g));
  });

  it("grounds metro/stationed paraphrases on Johannesburg", () => {
    const g = evaluateGrounding(
      "Which metro is Mike stationed in?",
      "Mike is based in Johannesburg, South Africa [1]. He works remote-first [1].",
    );
    assert.equal(g.ok, true, JSON.stringify(g));
  });

  it("does not treat bare go as a golang distinctive term", () => {
    const terms = contentTerms("Is ZDI still waiting to go live?");
    assert.equal(terms.includes("go"), false, JSON.stringify(terms));
  });

  it("treats 'specific' as a question-function word on location paraphrases", () => {
    const terms = contentTerms("Is Mike based in a specific city?");
    assert.equal(terms.includes("specific"), false, JSON.stringify(terms));
    const g = evaluateGrounding(
      "Is Mike based in a specific city?",
      "Mike is based in Johannesburg, South Africa [1].",
    );
    assert.equal(g.ok, true, JSON.stringify({ terms, g }));
  });

  it("does not treat 'living' as a match for production-live copy", () => {
    const terms = contentTerms("Where is Mike living?");
    assert.equal(terms.includes("living"), false, JSON.stringify(terms));
    const location = evaluateGrounding(
      "Where is Mike living?",
      "Mike is based in Johannesburg, South Africa [1]. He works remote-first [1].",
    );
    assert.equal(location.ok, true, JSON.stringify(location));
    const zdi = evaluateGrounding(
      "Does Mike have experience with Kubernetes?",
      "ZDI is approved for production rollout and not yet live [1].",
    );
    assert.equal(zdi.ok, false, JSON.stringify(zdi));
  });
});

describe("r52 model-output validator", () => {
  it("strips a sentence that invents a number or tool", () => {
    const chunk = "ZDI is approved for production rollout and not yet live. FastAPI, PostgreSQL and Next.js.";
    const kept = validateModelSentences(
      "Mike shipped 99 production systems [1]. He uses Kubernetes [1]. ZDI is approved for production rollout [1].",
      [chunk],
    );
    assert.match(kept, /approved for production rollout/i);
    assert.doesNotMatch(kept, /99/);
    assert.doesNotMatch(kept, /Kubernetes/);
  });

  it("drops sentences that do not cite a chunk", () => {
    const kept = validateModelSentences(
      "ZDI is approved for production rollout. FastAPI is used [1].",
      ["ZDI uses FastAPI."],
    );
    assert.match(kept, /FastAPI/);
    assert.doesNotMatch(kept, /approved for production rollout/);
  });
});

describe("r52 unknowable table", () => {
  it("covers salary, sports, spoken languages, and news", () => {
    assert.equal(isUnknowableQuestion("What's Mike's current salary?"), true);
    assert.equal(isUnknowableQuestion("Who won the 2026 World Cup?"), true);
    assert.equal(isUnknowableQuestion("What languages does Mike speak?"), true);
    assert.equal(isUnknowableQuestion("What's in the news today?"), true);
    assert.equal(isUnknowableQuestion("What's Mike's favourite programming language?"), false);
    assert.ok(UNKNOWABLE_REGEX_COUNT >= 40, String(UNKNOWABLE_REGEX_COUNT));
  });
});
