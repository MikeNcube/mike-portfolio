import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cannedFitsQuestion,
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

  it("fails an AWS-experience dump for a Kubernetes question", () => {
    const g = evaluateGrounding(
      "Does Mike have experience with Kubernetes?",
      "Mike's AWS experience lists S3, EC2, IAM, CloudWatch, and Bedrock [1].",
    );
    assert.equal(g.ok, false, JSON.stringify(g));
    assert.ok(g.unknownTech.some((t) => t.toLowerCase() === "kubernetes"));
  });

  it("fails a production-systems dump for a GCP question", () => {
    const g = evaluateGrounding(
      "Has Mike deployed production systems on GCP?",
      "Shipped: Digi App Form [1] and the Zororo CRM [2].",
    );
    assert.equal(g.ok, false, JSON.stringify(g));
    assert.ok(g.unknownTech.some((t) => t.toLowerCase() === "gcp"));
  });

  it("grounds favourite programming language on Python", () => {
    const terms = contentTerms("What's Mike's favourite programming language?");
    assert.ok(terms.some((t) => /program|language/i.test(t)));
    const g = evaluateGrounding(
      "What's Mike's favourite programming language?",
      "The stack lists Python and TypeScript as programming languages [1].",
    );
    assert.equal(g.ok, true, JSON.stringify(g));
  });

  it("rejects metro/stationed paraphrases that are not in the candidate", () => {
    const g = evaluateGrounding(
      "Which metro is Mike stationed in?",
      "Mike is based in Johannesburg, South Africa [1]. He works remote-first [1].",
    );
    assert.equal(g.ok, false, JSON.stringify(g));
    assert.ok(g.unmatchedNonTech.length > 0, JSON.stringify(g));
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

  it("rejects a tech-lead canned question on a generic CRM ask", () => {
    assert.equal(
      cannedFitsQuestion("Does Mike know the CRM?", "Did Mike act as tech lead on the CRM?"),
      false,
    );
    assert.equal(
      cannedFitsQuestion("Did Mike act as tech lead on the CRM?", "Did Mike act as tech lead on the CRM?"),
      true,
    );
    assert.equal(
      cannedFitsQuestion("Does Mike know the CRM?", "What is the CRM?"),
      true,
    );
  });

  it("grounds 'living' on based, not on production-live copy", () => {
    const terms = contentTerms("Where is Mike living?");
    assert.ok(terms.includes("living"), JSON.stringify(terms));
    const location = evaluateGrounding(
      "Where is Mike living?",
      "Mike is based in Johannesburg, South Africa [1]. He works remote-first [1].",
    );
    assert.equal(location.ok, true, JSON.stringify(location));
    const zdiLive = evaluateGrounding(
      "Where is Mike living?",
      "ZDI is approved for production rollout and not yet live [1].",
    );
    assert.equal(zdiLive.ok, false, JSON.stringify(zdiLive));
    const zdi = evaluateGrounding(
      "Does Mike have experience with Kubernetes?",
      "ZDI is approved for production rollout and not yet live [1].",
    );
    assert.equal(zdi.ok, false, JSON.stringify(zdi));
  });

  it("fails content terms that are absent from the candidate, including paid and trophy", () => {
    const paid = evaluateGrounding(
      "What does Mike get paid per year?",
      "Mike has six-plus years in software [1].",
    );
    assert.equal(paid.ok, false, JSON.stringify(paid));
    const trophy = evaluateGrounding(
      "Which team lifted the trophy at the last FIFA tournament?",
      "Mike is the sole AI engineer in a four-person IT team [1].",
    );
    assert.equal(trophy.ok, false, JSON.stringify(trophy));
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

  it("strips number-word, lowercase-tech, and lead/team-size claims missing from the cited chunk", () => {
    const years = validateModelSentences(
      "Mike has five years of hands-on kubernetes and terraform experience [1].",
      ["Mike has six-plus years in software, about three focused on generative AI."],
    );
    assert.equal(years, "");
    const lead = validateModelSentences(
      "Mike led the CRM team of 40 people as tech lead [1].",
      ["Shipped live production system: lead-management CRM used by over 40 people across around 10 roles."],
    );
    assert.equal(lead, "");
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

  it("refuses paid/earns, FIFA trophy, parliament geography, and Mike's manager", () => {
    assert.equal(isUnknowableQuestion("What does Mike get paid per year?"), true);
    assert.equal(isUnknowableQuestion("How much does Mike earn?"), true);
    assert.equal(isUnknowableQuestion("Which team lifted the trophy at the last FIFA tournament?"), true);
    assert.equal(isUnknowableQuestion("Which city is the seat of the South African parliament?"), true);
    assert.equal(isUnknowableQuestion("Who is Mike's manager at Zororo?"), true);
    assert.equal(isUnknowableQuestion("Does Mike manage people?"), false);
    assert.equal(isUnknowableQuestion("What is Mike's favourite programming language?"), false);
    assert.equal(isUnknowableQuestion("Does Mike work with venture capital tools?"), false);
  });
});
