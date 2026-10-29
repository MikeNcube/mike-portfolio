import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  answerQuestion,
  citedFallbackFromChunks,
  EMAIL_FALLBACK,
  isContactQuestion,
} from "../lib/answer";
import { isExperienceQuestion, isWorkQuestion } from "../lib/status-copy";
import { isRefusal } from "../lib/refusal";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";
import type { RetrievedChunk } from "../lib/rag";

export type SweepExpect =
  | { kind: "intent"; id: string; match: RegExp; notMatch?: RegExp }
  | { kind: "static"; match: RegExp; notMatch?: RegExp }
  | { kind: "refuse" };

export const VISITOR_SWEEP: Array<{ question: string; expect: SweepExpect }> = [
  {
    question: "Where is Mike based?",
    expect: { kind: "intent", id: "location", match: /Johannesburg/, notMatch: /shift-based/i },
  },
  {
    question: "Where is Mike located?",
    expect: { kind: "intent", id: "location", match: /Johannesburg/ },
  },
  {
    question: "Where does Mike live?",
    expect: { kind: "intent", id: "location", match: /Johannesburg/ },
  },
  {
    question: "Does Mike work remotely?",
    expect: { kind: "intent", id: "remote", match: /remote-first/ },
  },
  {
    question: "Does Mike work remote-first?",
    expect: { kind: "intent", id: "remote", match: /remote-first/ },
  },
  {
    question: "How many years of experience does Mike have?",
    expect: { kind: "intent", id: "years", match: /frontend development since 2022/i },
  },
  {
    question: "How long has Mike been an engineer?",
    expect: { kind: "intent", id: "years", match: /frontend development since 2022/i },
  },
  {
    question: "What is Mike's current job title?",
    expect: {
      kind: "intent",
      id: "title",
      match: /Applied AI Engineer/,
      notMatch: /takes over if the current claims/i,
    },
  },
  {
    question: "What is Mike's current role?",
    expect: { kind: "intent", id: "title", match: /Applied AI Engineer/ },
  },
  {
    question: "Where does Mike work?",
    expect: { kind: "intent", id: "employer", match: /Zororo-Phumulani/ },
  },
  {
    question: "Who does Mike work for?",
    expect: { kind: "intent", id: "employer", match: /Zororo-Phumulani/ },
  },
  {
    question: "What roles is Mike looking for?",
    expect: {
      kind: "intent",
      id: "roles",
      match: /Generative AI Engineer/,
      notMatch: /role-based access/i,
    },
  },
  {
    question: "What is Mike looking for?",
    expect: { kind: "intent", id: "roles", match: /target roles/i },
  },
  {
    question: "What AI tools does Mike use?",
    expect: {
      kind: "intent",
      id: "ai-tools",
      match: /Claude/,
      notMatch: /No AI in approvals/i,
    },
  },
  {
    question: "What are Mike's main skills?",
    expect: {
      kind: "intent",
      id: "skills",
      match: /Python/,
      notMatch: /no named certifications/i,
    },
  },
  {
    question: "What is Mike's tech stack?",
    expect: { kind: "intent", id: "skills", match: /FastAPI/ },
  },
  {
    question: "What programming languages does Mike use?",
    expect: { kind: "intent", id: "languages", match: /TypeScript/ },
  },
  {
    question: "What is Mike's education?",
    expect: { kind: "intent", id: "education", match: /no named certifications/ },
  },
  {
    question: "Does Mike have a degree?",
    expect: { kind: "intent", id: "education", match: /no formal degree/ },
  },
  {
    question: "What is Mike's team size?",
    expect: { kind: "intent", id: "team", match: /four-person/ },
  },
  {
    question: "Did Mike lead a team?",
    expect: {
      // r52: exact static identity is the tech-lead CRM answer, not the
      // classify-first "team size" intent that previously swallowed this phrasing.
      kind: "intent",
      id: "team",
      match: /four-person/,
    },
  },
  {
    question: "What is Mike's LinkedIn?",
    expect: { kind: "intent", id: "linkedin", match: /linkedin\.com\/in\/mike-ncube-669563a7/ },
  },
  {
    question: "Why should we hire Mike?",
    expect: {
      kind: "intent",
      id: "why-hire",
      match: /regulated/,
      notMatch: /Email Mike at mikencube03@gmail\.com \[1\]\. He works remote-first/,
    },
  },
  {
    question: "Is Mike a good fit for a senior AI engineer role?",
    expect: { kind: "intent", id: "why-hire", match: /Digi App Form/ },
  },
  {
    question: "What makes Mike different?",
    expect: { kind: "intent", id: "why-hire", match: /regulated funeral-assurance/ },
  },
  {
    question: "What is Mike's strongest project?",
    expect: { kind: "intent", id: "strongest", match: /Digi App Form/ },
  },
  {
    question: "How does this assistant work?",
    expect: { kind: "intent", id: "assistant", match: /Gemini embedding-001/ },
  },
  {
    question: "What testing has Mike done?",
    expect: { kind: "intent", id: "testing", match: /525 backend tests/ },
  },
  {
    question: "How can I contact Mike?",
    expect: { kind: "static", match: /mikencube03@gmail\.com/ },
  },
  {
    question: "Give me Mike's contact details",
    expect: { kind: "static", match: /mikencube03@gmail\.com/ },
  },
  {
    question: "Tell me about Mike's experience",
    expect: { kind: "static", match: /Applied AI Engineer/ },
  },
  {
    question: "Give me a summary of Mike's experience",
    expect: { kind: "static", match: /2022/ },
  },
  {
    question: "Give me an overview of Mike's work",
    expect: { kind: "static", match: /lead-management CRM/ },
  },
  {
    question: "Show me Mike's projects",
    expect: { kind: "static", match: /Digi App Form/ },
  },
  {
    question: "Show me Mike's GitHub",
    expect: { kind: "static", match: /github\.com\/MikeNcube/ },
  },
  {
    question: "Who is Mike Ncube?",
    expect: { kind: "static", match: /Zororo-Phumulani/ },
  },
  {
    question: "What production systems has Mike shipped?",
    expect: { kind: "static", match: /Shipped: Digi App Form/ },
  },
  {
    question: "Is Mike available for full-time or contract?",
    expect: { kind: "static", match: /available|full-time or contract|mikencube03@gmail\.com/ },
  },
  { question: "What is Mike's day rate?", expect: { kind: "refuse" } },
  { question: "What is Mike's notice period?", expect: { kind: "refuse" } },
  { question: "Would Mike relocate?", expect: { kind: "refuse" } },
  { question: "What is Mike's time zone?", expect: { kind: "refuse" } },
];

const misleadingChunks: RetrievedChunk[] = [
  {
    id: "zororo-claims",
    title: "Claims operations platform",
    sourceUrl: "https://github.com/MikeNcube",
    text: "It takes over if the current claims system fails. Shift-based routing is used in claims.",
    score: 0.95,
  },
  {
    id: "zororo-crm",
    title: "Lead-management CRM",
    sourceUrl: "https://github.com/MikeNcube",
    text: "The CRM has role-based access. No AI in approvals.",
    score: 0.94,
  },
  {
    id: "certifications",
    title: "Courses and training",
    sourceUrl: "https://github.com/MikeNcube",
    text: "Mike has no named certifications and no formal degree.",
    score: 0.93,
  },
  {
    id: "zdi-signature-workflow",
    title: "ZDI",
    sourceUrl: "https://github.com/MikeNcube",
    text: "No AI in approvals. It takes over if the current claims system fails.",
    score: 0.92,
  },
];

const modes = ["none", "gemini-refuse", "groq-refuse"] as const;
type SweepMode = (typeof modes)[number];

async function ask(question: string, mode: SweepMode) {
  return answerQuestion({
    question,
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

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("round 48 visitor sweep", () => {
  it("has 42 recruiter questions with intent or refuse labels", () => {
    assert.equal(VISITOR_SWEEP.length, 42);
  });

  it("does not treat why-hire as a contact question", () => {
    assert.equal(isContactQuestion("Why should we hire Mike?"), false);
    assert.equal(isContactQuestion("Is Mike a good fit for a senior AI engineer role?"), false);
    assert.equal(isContactQuestion("What makes Mike different?"), false);
  });

  it("keeps experience and work overview on the existing static paths", () => {
    assert.equal(isExperienceQuestion("Tell me about Mike's experience"), true);
    assert.equal(isWorkQuestion("Give me an overview of Mike's work"), true);
  });

  it("refuses honest-unknown visitor questions before retrieval", async () => {
    for (const item of VISITOR_SWEEP) {
      if (item.expect.kind !== "refuse") continue;
      const result = await ask(item.question, "none");
      assert.equal(result.response, EMAIL_FALLBACK, item.question);
    }
  });

  for (const mode of modes) {
    it(`answers or refuses the visitor sweep with ${mode}`, async () => {
      for (const item of VISITOR_SWEEP) {
        const result = await ask(item.question, mode);
        const label = `${mode} ${item.question}`;
        if (item.expect.kind === "refuse") {
          assert.equal(result.response, EMAIL_FALLBACK, label);
          assert.equal(isRefusal(result.response), true, label);
          assert.equal(result.sources.length, 0, label);
          continue;
        }
        assert.equal(isRefusal(result.response), false, `${label} => ${result.response}`);
        assert.notEqual(result.response, EMAIL_FALLBACK, label);
        assert.match(result.response, item.expect.match, `${label} => ${result.response}`);
        if (item.expect.notMatch) {
          assert.doesNotMatch(result.response, item.expect.notMatch, label);
        }
      }
    });
  }

  it("states Applied AI Engineer once in the experience answer", async () => {
    const result = await ask("Tell me about Mike's experience", "none");
    const matches = result.response.match(/Applied AI Engineer/g) ?? [];
    assert.equal(matches.length, 1, result.response);
    assert.doesNotMatch(result.response, /Title:/);
  });

  it("lists the KB stack on the skills answer", async () => {
    const result = await ask("What is Mike's tech stack?", "none");
    assert.match(result.response, /Python/);
    assert.match(result.response, /FastAPI/);
    assert.match(result.response, /Next\.js/);
    assert.match(result.response, /TypeScript/);
    assert.match(result.response, /PostgreSQL/);
    assert.match(result.response, /pgvector/);
    assert.match(result.response, /AWS/);
  });

  it("refuses ordinary-word questions from misleading chunks", () => {
    const questions = [
      "Where is Mike based?",
      "What is Mike's current job title?",
      "What roles is Mike looking for?",
      "What AI tools does Mike use?",
      "What are Mike's main skills?",
      "Is Mike a good fit for a senior AI engineer role?",
      "What makes Mike different?",
      "Why should we hire Mike?",
      "How many years of experience does Mike have?",
      "Does Mike work remotely?",
    ];
    for (const question of questions) {
      assert.equal(citedFallbackFromChunks(question, misleadingChunks), null, question);
    }
  });
});
