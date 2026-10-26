// Pre-written answers for the closest suggested question.
// Facts only from the CV. Never invent. Name tokens are ignored when scoring.

import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { tokenize } from "./bm25";
import {
  CANONICAL_AWS_ANSWER,
  CANONICAL_PRODUCTION_ANSWER,
  CANONICAL_TECH_LEAD_CRM_ANSWER,
  CANONICAL_ZDI_LIVE_ANSWER,
} from "./status-copy";

export type StaticAnswer = {
  question: string;
  aliases: string[];
  answer: string;
  sourceIds: string[];
};

export const STATIC_ANSWERS: StaticAnswer[] = [
  {
    question: "Who is Mike Ncube?",
    aliases: [
      "who is mike",
      "tell me about mike",
      "who are you",
      "introduce mike ncube",
    ],
    answer:
      "Mike S Ncube is an Applied AI Engineer and Systems Architect at Zororo-Phumulani Funeral Assurance (FSP 48558) in Johannesburg, South Africa [1]. He has been the sole AI engineer in a four-person IT team since 2022 [2]. Six-plus years in software, about three focused on generative AI. Email mikencube03@gmail.com.",
    sourceIds: ["positioning", "employer"],
  },
  {
    question: "How does the RAG pipeline work technically?",
    aliases: [
      "how does the rag pipeline work",
      "explain the rag assistant",
      "how does retrieval work",
    ],
    answer:
      "The live assistant embeds the knowledge base with Gemini embedding-001, embeds each query, retrieves the top 6 chunks by cosine similarity, drops chunks below 0.35, then generates a grounded answer [1]. If embeddings fail, it falls back to BM25 keyword search over the same chunks. Generation tries Gemini 2.5 Flash first, then Groq openai/gpt-oss-120b, then a static CV answer. Source code is lib/rag.ts and app/api/chat/route.ts [2].",
    sourceIds: ["portfolio-rag-assistant", "this-assistant"],
  },
  {
    question: "What production systems has Mike shipped?",
    aliases: [
      "what has mike shipped",
      "production systems",
      "what did mike build at zororo",
    ],
    answer: CANONICAL_PRODUCTION_ANSWER,
    sourceIds: ["digi-app-form", "zororo-crm", "zdi-signature-workflow", "zororo-claims"],
  },
  {
    question: "Walk me through Proactive Sentinel's architecture.",
    aliases: [
      "proactive sentinel architecture",
      "what is proactive sentinel",
      "tell me about proactive sentinel",
    ],
    answer:
      "Proactive Sentinel is a Flask SOC with a detection engine and an audit log [1]. Designed with POPIA in mind. 44 passing tests [2].",
    sourceIds: ["proactive-sentinel-overview", "proactive-sentinel-tech"],
  },
  {
    question: "Is Mike available for hire?",
    aliases: [
      "is mike available",
      "is mike hiring",
      "can i hire mike",
      "availability",
      "is mike open to contract as well as full-time",
      "is mike open to contract",
      "full-time or contract",
    ],
    answer:
      "Yes, Mike is available [1]. Email mikencube03@gmail.com.",
    sourceIds: ["availability"],
  },
  {
    question: "Did Mike act as tech lead on the CRM?",
    aliases: [
      "did mike act as tech lead on the crm",
      "was mike tech lead on the crm",
      "tech lead on the crm",
    ],
    answer: CANONICAL_TECH_LEAD_CRM_ANSWER,
    sourceIds: ["zororo-crm", "employer"],
  },
  {
    question: "What AWS experience does Mike have?",
    aliases: [
      "what aws experience does mike have",
      "does mike work with aws",
      "tell me about mike's aws skills",
      "aws experience",
      "mike aws",
    ],
    answer: CANONICAL_AWS_ANSWER,
    sourceIds: ["stack", "aws-web-tier", "certifications"],
  },
  {
    question: "What is Cube?",
    aliases: [
      "tell me about cube",
      "cube architecture",
      "explain cube",
      "what is the cube agent",
    ],
    answer:
      "Cube is a coding agent prototype [1]. Own tool-calling loop, provider-agnostic adapters so the model can be swapped without changing business logic, approval prompts before writes, and a sandboxed eval harness with a trusted verifier. Not deployed.",
    sourceIds: ["cube-agent"],
  },
  {
    question: "What is Sitewarden?",
    aliases: [
      "tell me about sitewarden",
      "sitewarden architecture",
      "explain sitewarden",
    ],
    answer:
      "Sitewarden is a governed AI operations platform prototype [1]. FastAPI with a LangGraph state graph: plan, analyse, self-check, write-report, await-approval, revise. Human interrupt before consequential actions, Postgres checkpoints, risk-tiered tool gateway, pgvector hybrid search. 89 tests. Not deployed.",
    sourceIds: ["sitewarden"],
  },
  {
    question: "What is ZDI?",
    aliases: [
      "tell me about zdi",
      "zdi architecture",
      "explain zdi",
      "what is zororo document intelligence",
      "what is the signature workflow",
      "zdi signature workflow",
    ],
    answer:
      "ZDI (approved for production rollout at Zororo-Phumulani, rolling out soon, not yet live) is a Signature & Approval Workflow: evidence-grade e-signatures and a requester → manager → Accounts approval workflow, the second domain of Zororo Document Intelligence [1]. FastAPI, PostgreSQL and Next.js. Append-only, hash-chained signing events. No AI in approvals. ZDI never pays, never produces a bank file and never marks anything as paid.",
    sourceIds: ["zdi-signature-workflow"],
  },
  {
    question: "Is ZDI live?",
    aliases: [
      "is zdi live",
      "is zdi in production",
      "is zororo document intelligence live",
    ],
    answer: CANONICAL_ZDI_LIVE_ANSWER,
    sourceIds: ["zdi-signature-workflow"],
  },
  {
    question: "What is Zororo AI OS?",
    aliases: [
      "tell me about zororo ai os",
      "zororo ai os architecture",
      "explain zororo ai os",
      "what is the governed ai control plane",
    ],
    answer:
      "Zororo AI OS is a governed AI control plane. It is built, early stage, and not deployed [1]. Every event passes Presidio PII detection, an OPA (Rego) policy check, risk scoring, then ALLOW / MONITOR / APPROVE / BLOCK, and a hash-chained audit log. If any step fails, the event is blocked by default. README reports 310 passing tests. LangGraph and pgvector are planned.",
    sourceIds: ["zororo-ai-os"],
  },
  {
    question: "What is the claims operations platform?",
    aliases: [
      "tell me about zororo-claims",
      "claims operations platform",
      "what is zororo claims",
      "claims standby",
    ],
    answer:
      "The claims operations platform is an approved, production-ready standby (failover), not the live system [1]. A role-based platform for funeral-case processing: claims, cash services and courtesy services. It takes over if the current claims system fails.",
    sourceIds: ["zororo-claims"],
  },
  {
    question: "What is the multi-agent content pipeline?",
    aliases: [
      "tell me about the multi-agent content pipeline",
      "what is ai-social-agent",
      "multi-agent content pipeline",
      "explain the content pipeline",
    ],
    answer:
      "The multi-agent content pipeline is a prototype [1]. Three agents (research, strategy, content) turn signals from GitHub, ArXiv and O'Reilly into platform-ready posts. It runs on local Ollama at zero API cost. Nothing is scheduled until a human approves it in a FastAPI dashboard. Versioned prompt templates; evals are in progress.",
    sourceIds: ["ai-social-agent"],
  },
];

const NAME_TOKENS = new Set(["mike", "ncube"]);
const MATCH_THRESHOLD = 0.6;
const MIN_OVERLAP = 2;

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / new Set([...a, ...b]).size;
}

export function normaliseQuestion(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function contentTokens(text: string): Set<string> {
  return new Set(tokenize(text).filter((t) => !NAME_TOKENS.has(t)));
}

export function matchStaticAnswer(question: string): StaticAnswer | null {
  const qNorm = normaliseQuestion(question);
  for (const item of STATIC_ANSWERS) {
    const candidates = [item.question, ...item.aliases];
    if (candidates.some((c) => normaliseQuestion(c) === qNorm)) return item;
  }

  const qTokens = contentTokens(question);
  if (qTokens.size === 0) return null;

  let best: { answer: StaticAnswer; score: number; overlap: number } | null = null;
  for (const item of STATIC_ANSWERS) {
    for (const c of [item.question, ...item.aliases]) {
      const cTokens = contentTokens(c);
      let overlap = 0;
      for (const t of qTokens) if (cTokens.has(t)) overlap += 1;
      const score = jaccard(qTokens, cTokens);
      if (!best || score > best.score) best = { answer: item, score, overlap };
    }
  }

  if (best && best.score >= MATCH_THRESHOLD && best.overlap >= MIN_OVERLAP) {
    return best.answer;
  }
  return null;
}

export function sourcesFor(answer: StaticAnswer): Array<{ id: string; title: string; url: string }> {
  return answer.sourceIds
    .map((id) => KNOWLEDGE_CHUNKS.find((c) => c.id === id))
    .filter((c): c is (typeof KNOWLEDGE_CHUNKS)[number] => Boolean(c))
    .filter((c) => c.sourceUrl.startsWith("http"))
    .map((c) => ({ id: c.id, title: c.title, url: c.sourceUrl }));
}
