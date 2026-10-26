// Pre-written answers for the closest suggested question.
// Facts only from the CV and lib/knowledge.ts. Never invent.

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
      "Mike S Ncube is an Applied AI Engineer and Systems Architect at Zororo-Phumulani Funeral Assurance (FSP 48558) in Johannesburg, South Africa. He has been the sole AI engineer in a four-person IT team since 2022. Six-plus years in software, about three focused on generative AI. Remote-first. Email mikencube03@gmail.com.",
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
      "The live assistant embeds the knowledge base with Gemini embedding-001, embeds each query, retrieves the top 4 chunks by cosine similarity, drops chunks below 0.35, then generates a grounded answer. If embeddings fail, it falls back to BM25 keyword search over the same chunks. Generation tries Gemini 2.5 Flash first, then Groq llama-3.3-70b-versatile, then a static CV answer. Source code is lib/rag.ts and app/api/chat/route.ts.",
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
      "At Zororo-Phumulani he shipped the lead-management CRM used by over 40 people across around 10 roles, and Digi App Form, the regulated funeral-assurance intake app. The claims document extraction pipeline is built and pending management approval. FastAPI, PostgreSQL, Redis, Celery, Flask, Docker.",
    sourceIds: ["zororo-crm", "digi-app-form", "claims-pipeline"],
  },
  {
    question: "Walk me through Proactive Sentinel's architecture.",
    aliases: [
      "proactive sentinel architecture",
      "what is proactive sentinel",
      "tell me about proactive sentinel",
    ],
    answer:
      "Proactive Sentinel is a Python Flask SOC platform, not an LLM product. Events are ingested, SHA-256 deduplicated in Redis, correlated with MITRE ATT&CK, then a severity-tiered dispatcher can flag, block an attacker IP, and write an audit entry. PostgreSQL 15, Redis 7, OpenTelemetry, Docker, Railway. 44 passing tests. v1.0.0, currently paused.",
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
      "Yes — Mike is available for full-time or contract, remote-first from South Africa. Target roles include Applied AI Engineer and Generative AI Engineer. Email mikencube03@gmail.com.",
    sourceIds: ["availability"],
  },
  {
    question: "What is Sitewarden?",
    aliases: [
      "tell me about sitewarden",
      "sitewarden architecture",
      "explain sitewarden",
    ],
    answer:
      "Sitewarden is a governed AI operations platform prototype. FastAPI with a LangGraph state graph: plan, analyse, self-check, write-report, await-approval, revise. Human interrupt before writes, Postgres checkpoints, risk-tiered tool gateway, pgvector hybrid search. 89 tests. Prototype, not deployed.",
    sourceIds: ["sitewarden"],
  },
];

const MATCH_THRESHOLD = 0.5;

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / new Set([...a, ...b]).size;
}

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchStaticAnswer(question: string): StaticAnswer | null {
  const qNorm = norm(question);
  const qTokens = new Set(tokenize(question));
  let best: { answer: StaticAnswer; score: number } | null = null;

  for (const item of STATIC_ANSWERS) {
    const candidates = [item.question, ...item.aliases];
    for (const c of candidates) {
      if (norm(c) === qNorm) return item;
      const score = jaccard(qTokens, new Set(tokenize(c)));
      if (!best || score > best.score) best = { answer: item, score };
    }
  }

  if (best && best.score >= MATCH_THRESHOLD) return best.answer;
  return null;
}

export function sourcesFor(answer: StaticAnswer): Array<{ title: string; url: string }> {
  return answer.sourceIds
    .map((id) => KNOWLEDGE_CHUNKS.find((c) => c.id === id))
    .filter((c): c is (typeof KNOWLEDGE_CHUNKS)[number] => Boolean(c))
    .filter((c) => c.sourceUrl.startsWith("http"))
    .map((c) => ({ title: c.title, url: c.sourceUrl }));
}
