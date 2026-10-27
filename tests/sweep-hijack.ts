import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, EMAIL_FALLBACK } from "../lib/answer";
import { matchProjectScopedAnswer, matchRecruiterIntent } from "../lib/intent";
import { isRefusal } from "../lib/refusal";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";
import { KNOWLEDGE_CHUNKS } from "../lib/knowledge";
import type { RetrievedChunk } from "../lib/rag";

const kbChunks: RetrievedChunk[] = KNOWLEDGE_CHUNKS
  .filter((c) => c.sourceUrl.startsWith("http"))
  .map((c) => ({ ...c, score: 0.9 }));

const modes = ["none", "gemini-refuse", "groq-refuse"] as const;
type SweepMode = (typeof modes)[number];

async function ask(question: string, mode: SweepMode) {
  return answerQuestion({
    question,
    retrieveFn: async () => kbChunks,
    ...(mode === "gemini-refuse"
      ? {
          generateGemini: async () => "I don't have information about that.",
          generateGroq: async () => EMAIL_FALLBACK,
        }
      : {}),
    ...(mode === "groq-refuse"
      ? {
          generateGemini: async () => {
            throw new Error("429");
          },
          generateGroq: async () => "I don't have information about that.",
        }
      : {}),
  });
}

export const HIJACK_CASES: Array<{
  question: string;
  match: RegExp;
  notMatch: RegExp;
}> = [
  {
    question: "What skills did ZDI need?",
    match: /FastAPI/,
    notMatch: /Flask|Bedrock|Claude/,
  },
  {
    question: "What languages is Sitewarden written in?",
    match: /FastAPI/,
    notMatch: /TypeScript|Flask/,
  },
  {
    question: "What AI tools does Zororo AI OS use?",
    match: /Presidio|Rego/,
    notMatch: /Claude|Bedrock|Flask/,
  },
  {
    question: "Who approves ZDI requests?",
    match: /requester → manager → Accounts/,
    notMatch: /Flask|Bedrock/,
  },
  {
    question: "Where is ZDI deployed?",
    match: /not yet live/,
    notMatch: /Flask|Bedrock/,
  },
  {
    question: "What stack does the CRM use?",
    match: /FastAPI/,
    notMatch: /Flask|Bedrock/,
  },
  {
    question: "What languages is Digi App Form written in?",
    match: /Flask|Python/,
    notMatch: /LangGraph|Bedrock/,
  },
  {
    question: "What AI tools does Sitewarden use?",
    match: /LangGraph/,
    notMatch: /Claude|Bedrock/,
  },
];

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("round 49 project hijack guard", () => {
  it("never assigns a Mike-wide recruiter intent to a named project", () => {
    for (const item of HIJACK_CASES) {
      assert.equal(matchRecruiterIntent(item.question), null, item.question);
      assert.ok(matchProjectScopedAnswer(item.question), item.question);
    }
  });

  for (const mode of modes) {
    it(`answers project-scoped questions with ${mode}`, async () => {
      for (const item of HIJACK_CASES) {
        const result = await ask(item.question, mode);
        const label = `${mode} ${item.question}`;
        assert.equal(isRefusal(result.response), false, `${label} => ${result.response}`);
        assert.match(result.response, item.match, `${label} => ${result.response}`);
        assert.doesNotMatch(result.response, item.notMatch, `${label} => ${result.response}`);
      }
    });
  }
});
