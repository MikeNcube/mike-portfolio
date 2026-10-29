// Regressions from the strict live retest of fix/assistant-grounding (07ec311):
// (a) invented claim words passing the model validator, (b) wrong-topic static
// answers, (c) over-refusals. Retrieval is faked where live embedding order
// differed from local BM25, so each case holds whichever chunks rank first.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../lib/answer";
import { findUnsupportedClaims, validateModelSentences } from "../lib/grounding";
import { KNOWLEDGE_CHUNKS } from "../lib/knowledge";
import { resetProviderCircuits } from "../lib/providers";
import { resetQuotaForTests } from "../lib/quota";
import type { RetrievedChunk } from "../lib/rag";
import { isRefusal } from "../lib/refusal";
import { STATIC_ANSWERS } from "../lib/static-answers";

function kb(id: string, score = 0.9): RetrievedChunk {
  const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === id);
  assert.ok(chunk, `missing chunk ${id}`);
  return { ...chunk, score };
}

function canned(question: string, score = 0.95): RetrievedChunk {
  const answer = STATIC_ANSWERS.find((s) => s.question === question);
  assert.ok(answer, `missing static answer ${question}`);
  return { id: `static:${question}`, title: answer.question, sourceUrl: "static", text: answer.answer, score, cannedAnswer: answer };
}

function cited(...ids: string[]) {
  return ids.map((id) => {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === id);
    assert.ok(chunk, `missing chunk ${id}`);
    return { id, text: `${chunk.title}\n${chunk.text}` };
  });
}

function assertRefused(response: string, sources: unknown[], question: string): void {
  assert.equal(isRefusal(response), true, `${question} -> ${response}`);
  assert.equal(sources.length, 0, question);
}

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("live retest (a): validator rejects claim words the cited block does not state", () => {
  it("rejects a qualifier: ZDI approvals described as rule-based", () => {
    const text = "ZDI approvals are rule-based [1].";
    const problems = findUnsupportedClaims(text, cited("zdi-signature-workflow"));
    assert.deepEqual(problems.flatMap((p) => p.words), ["rule-based"]);
    assert.equal(validateModelSentences(text, cited("zdi-signature-workflow")), "");
  });

  it("rejects a purpose: Redis used for caching/deduplication", () => {
    const text = "Proactive Sentinel uses Redis for caching/deduplication [1].";
    const words = findUnsupportedClaims(text, cited("proactive-sentinel-overview")).flatMap((p) => p.words);
    assert.ok(words.includes("caching"), words.join(","));
    assert.ok(words.includes("deduplication"), words.join(","));
  });

  it("rejects a tool-to-project link: pytest credited to Sentinel and Sitewarden", () => {
    const text = "Proactive Sentinel and Sitewarden are tested with pytest [1][2][3].";
    const chunks = cited("proactive-sentinel-tech", "sitewarden", "stack");
    const words = findUnsupportedClaims(text, chunks).flatMap((p) => p.words);
    assert.ok(words.includes("pytest@sentinel"), words.join(","));
    assert.ok(words.includes("pytest@sitewarden"), words.join(","));
    assert.equal(validateModelSentences(text, chunks), "");
  });

  it("keeps an answer that uses its cited block's own words", () => {
    const text = "ZDI is approved for production rollout at Zororo-Phumulani, not yet live [1]. "
      + "It is a Signature & Approval Workflow on FastAPI, PostgreSQL and Next.js [1].";
    assert.deepEqual(findUnsupportedClaims(text, cited("zdi-signature-workflow")), []);
    assert.match(validateModelSentences(text, cited("zdi-signature-workflow")), /not yet live/);
  });

  it("credits a tool to a project when that project's own block lists it", () => {
    const text = "Zororo AI OS reports 310 passing tests, including pytest and Rego policy tests [1].";
    assert.deepEqual(findUnsupportedClaims(text, cited("zororo-ai-os")), []);
  });

  for (const { question, chunks, model, invented } of [
    {
      question: "How are ZDI approvals decided?",
      chunks: ["zdi-signature-workflow"],
      model: "ZDI approvals are rule-based [1].",
      invented: /rule-based/i,
    },
    {
      question: "What does Proactive Sentinel use Redis for?",
      chunks: ["proactive-sentinel-overview", "proactive-sentinel-tech"],
      model: "Proactive Sentinel uses Redis for caching and deduplication [1].",
      invented: /caching/i,
    },
    {
      question: "Which of Mike's projects use pytest?",
      chunks: ["proactive-sentinel-tech", "sitewarden", "stack"],
      model: "Proactive Sentinel and Sitewarden both use pytest [1][2][3].",
      invented: /(?:Sentinel|Sitewarden)[^.]*pytest/i,
    },
  ]) {
    it(`falls back from an invented model answer: ${question}`, async () => {
      for (const provider of ["generateGemini", "generateGroq"] as const) {
        resetProviderCircuits();
        const result = await answerQuestion({
          question,
          retrieveFn: async () => chunks.map((id) => kb(id)),
          [provider]: async () => model,
        });
        assert.notEqual(result.via, provider === "generateGemini" ? "gemini" : "groq", result.response);
        assert.doesNotMatch(result.response, invented, result.response);
      }
    });
  }
});

describe("live retest (b): answer from a real chunk or refuse, never a wrong topic", () => {
  it("refuses the colour of the CRM instead of describing the CRM", async () => {
    for (const question of ["What colour is the CRM?", "What color is the portfolio site?"]) {
      const result = await answerQuestion({ question });
      assertRefused(result.response, result.sources, question);
    }
  });

  it("refuses who Mike's manager is instead of describing ZDI's manager step", async () => {
    for (const question of [
      "Who is Mike's manager at Zororo?",
      "Who does Mike report to?",
      "Who is Mike's boss?",
    ]) {
      const result = await answerQuestion({
        question,
        retrieveFn: async () => [kb("zdi-signature-workflow"), canned("Did Mike lead a team?")],
      });
      assertRefused(result.response, result.sources, question);
    }
  });

  it("answers PII handling from a PII sentence even when a SOC overview ranks first", async () => {
    const question = "How does Mike handle PII?";
    for (const retrieveFn of [
      undefined,
      async () => [canned("Walk me through Proactive Sentinel's architecture."), kb("proactive-sentinel-tech", 0.6), kb("zororo-claims", 0.5)],
    ]) {
      const result = await answerQuestion({ question, retrieveFn });
      assert.equal(isRefusal(result.response), false, result.response);
      assert.match(splitFirst(result.response), /\bPII\b/, result.response);
      assert.doesNotMatch(result.response, /MITRE ATT&CK/, result.response);
    }
  });

  it("answers LLM and model failures from the engineering defaults, not the AI tool list", async () => {
    for (const question of ["How does Mike handle LLM/model failures?", "How does Mike handle model failures?"]) {
      const result = await answerQuestion({ question });
      assert.match(result.response, /fallible dependencies|fallback|retries/, `${question} -> ${result.response}`);
      assert.doesNotMatch(result.response, /AWS Bedrock/, result.response);
    }
  });

  it("gives the contact email even when retrieval and the model point elsewhere", async () => {
    const result = await answerQuestion({
      question: "Best way to contact Mike?",
      retrieveFn: async () => [canned("What is Mike's strongest project?"), kb("availability", 0.4)],
      generateGemini: async () => "Mike's strongest project is Digi App Form [1].",
    });
    assert.match(result.response, /mikencube03@gmail\.com/);
    assert.doesNotMatch(result.response, /strongest|Digi App Form/, result.response);
  });

  it("answers repo maturity labels from the labelling default, not the GitHub link", async () => {
    const result = await answerQuestion({ question: "What are the repo maturity labels?" });
    assert.match(result.response, /production, prototype, or lab/);
    assert.doesNotMatch(result.response, /github\.com/, result.response);
  });

  it("answers the lead management system with the CRM, never the tech-lead answer", async () => {
    for (const question of ["Tell me about the lead management system", "lead management system"]) {
      for (const retrieveFn of [
        undefined,
        async () => [canned("Did Mike act as tech lead on the CRM?"), canned("Did Mike lead a team?"), kb("zororo-crm", 0.5)],
      ]) {
        const result = await answerQuestion({ question, retrieveFn });
        assert.match(result.response, /lead-management CRM/, `${question} -> ${result.response}`);
        assert.doesNotMatch(result.response, /tech lead|four-person/, result.response);
      }
    }
  });
});

describe("live retest (c): over-refusals", () => {
  it("names GitHub Actions for CI questions", async () => {
    for (const question of [
      "What CI does Mike use?",
      "What CI/CD does Mike use?",
      "Does Mike know CI/CD?",
      "Does Mike use continuous integration?",
    ]) {
      const result = await answerQuestion({ question });
      assert.match(result.response, /GitHub Actions/, `${question} -> ${result.response}`);
    }
  });

  it("gives the isn't-listed note for EKS and Kubernetes while still declining", async () => {
    const result = await answerQuestion({ question: "Does Mike know EKS/Kubernetes?" });
    assert.match(result.response, /EKS and Kubernetes aren't listed in Mike's portfolio/);
    assertRefused(result.response, result.sources, "EKS/Kubernetes");
  });

  it("answers UK remote roles from the remote-first profile without claiming the UK", async () => {
    const result = await answerQuestion({ question: "Is Mike open to UK remote roles?" });
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /remote-first/);
    assert.doesNotMatch(result.response, /\bUK\b/);
  });

  it("still refuses relocation, on-site work elsewhere, and work authorisation", async () => {
    for (const question of [
      "Is Mike open to hybrid roles in London?",
      "Would Mike relocate to the UK?",
      "Does Mike have a UK work permit?",
    ]) {
      const result = await answerQuestion({ question });
      assertRefused(result.response, result.sources, question);
    }
  });
});

function splitFirst(text: string): string {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/)[0] ?? text;
}
