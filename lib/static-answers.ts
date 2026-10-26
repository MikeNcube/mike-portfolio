// Pre-written answers for the closest suggested question.
// Facts only from the CV. Never invent. Name tokens are ignored when scoring.

import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { tokenize } from "./bm25";

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
      "Mike S Ncube is an Applied AI Engineer and Systems Architect at Zororo-Phumulani Funeral Assurance (FSP 48558) in Johannesburg, South Africa. He has been the sole AI engineer in a four-person IT team since 2022. Six-plus years in software, about three focused on generative AI. Email mikencube03@gmail.com.",
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
      "The live assistant embeds the knowledge base with Gemini embedding-001, embeds each query, retrieves the top 6 chunks by cosine similarity, drops chunks below 0.35, then generates a grounded answer. If embeddings fail, it falls back to BM25 keyword search over the same chunks. Generation tries Gemini 2.5 Flash first, then Groq openai/gpt-oss-120b, then a static CV answer. Source code is lib/rag.ts and app/api/chat/route.ts.",
    sourceIds: ["portfolio-rag-assistant", "this-assistant"],
  },
  {
    question: "What production systems has Mike shipped?",
    aliases: [
      "what has mike shipped",
      "production systems",
      "what did mike build at zororo",
    ],
    answer:
      "At Zororo-Phumulani he shipped the lead-management CRM used by over 40 people across around 10 roles. The claims document extraction pipeline is built and pending management approval.",
    sourceIds: ["zororo-crm", "claims-pipeline"],
  },
  {
    question: "Walk me through Proactive Sentinel's architecture.",
    aliases: [
      "proactive sentinel architecture",
      "what is proactive sentinel",
      "tell me about proactive sentinel",
    ],
    answer:
      "Proactive Sentinel is a Flask SOC with a detection engine and an audit log. Designed with POPIA in mind. 44 passing tests.",
    sourceIds: ["proactive-sentinel-overview", "proactive-sentinel-tech"],
  },
  {
    question: "Is Mike available for hire?",
    aliases: [
      "is mike available",
      "is mike hiring",
      "can i hire mike",
      "availability",
    ],
    answer:
      "Yes, Mike is available. Email mikencube03@gmail.com.",
    sourceIds: ["availability"],
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
      "Cube is a coding agent prototype. Own tool-calling loop, provider-agnostic adapters so the model can be swapped without changing business logic, approval prompts before writes, and a sandboxed eval harness with a trusted verifier. Prototype, not deployed.",
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
      "Sitewarden is a governed AI operations platform prototype. FastAPI with a LangGraph state graph: plan, analyse, self-check, write-report, await-approval, revise. Human interrupt before consequential actions, Postgres checkpoints, risk-tiered tool gateway, pgvector hybrid search. 89 tests. Prototype, not deployed.",
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
      "ZDI (Zororo Document Intelligence) is a Signature & Approval Workflow: evidence-grade e-signatures and a requester → manager → Accounts approval workflow, the second domain of Zororo Document Intelligence. Status: Built. Approved for production rollout at Zororo-Phumulani; rollout starting soon. FastAPI, PostgreSQL and Next.js. Append-only, hash-chained signing events. No AI in approvals. ZDI never pays, never produces a bank file and never marks anything as paid.",
    sourceIds: ["zdi-signature-workflow"],
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

export function sourcesFor(answer: StaticAnswer): Array<{ title: string; url: string }> {
  return answer.sourceIds
    .map((id) => KNOWLEDGE_CHUNKS.find((c) => c.id === id))
    .filter((c): c is (typeof KNOWLEDGE_CHUNKS)[number] => Boolean(c))
    .filter((c) => c.sourceUrl.startsWith("http"))
    .map((c) => ({ title: c.title, url: c.sourceUrl }));
}
