// Pre-written answers for the closest suggested question.
// Facts only from the CV. Never invent. Name tokens are ignored when scoring.

import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { tokenize } from "./bm25";
import {
  CANONICAL_AWS_ANSWER,
  CANONICAL_PRODUCTION_ANSWER,
  CANONICAL_TECH_LEAD_CRM_ANSWER,
  CANONICAL_WORK_ANSWER,
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
    question: "How does Mike defend against prompt injection in his RAG systems?",
    aliases: [
      "how does mike defend against prompt injection",
      "can you jailbreak-proof a rag chatbot how does mike handle it",
      "jailbreak-proof a rag chatbot",
      "prompt injection in his rag",
      "how does mike handle prompt injection",
      "how does mike resist prompt injection",
      "how does mike protect against prompt injection",
      "how does mike guard against prompt injection",
      "how does mike guard against jailbreaks",
      "how does mike mitigate prompt injection",
      "how does mike prevent prompt injection",
      "how does mike handle jailbreaks",
      "rag jailbreak defences",
      "rag prompt injection",
    ],
    answer:
      "Mike's portfolio RAG uses a retrieval gate that discards chunks below 0.35 cosine similarity [1]. Jailbreak and role-play attempts are matched with word-boundary phrases and refused before retrieval [1]. Factual answers must include inline [n] citations, and out-of-scope questions are refused [2]. The grounding prompt is server-side, so the chat input cannot override it [2].",
    sourceIds: ["rag-injection-defence", "this-assistant"],
  },
  {
    question: "What production systems has Mike shipped?",
    aliases: [
      "what has mike shipped",
      "production systems",
      "what did mike ship at zororo",
    ],
    answer: CANONICAL_PRODUCTION_ANSWER,
    sourceIds: ["digi-app-form", "zororo-crm", "zdi-signature-workflow", "zororo-claims"],
  },
  {
    question: "What has Mike built at Zororo-Phumulani?",
    aliases: [
      "what has mike built at zororo",
      "what did mike build at zororo",
      "what did mike build at zororo-phumulani",
      "what does mike work on",
      "what does mike work on at zororo",
      "what does mike work on at zororo-phumulani",
      "what has mike built",
      "what has mike delivered at zororo-phumulani",
      "what did mike deliver at zororo",
      "what projects has mike built for his employer",
      "which systems did mike build for zororo-phumulani funeral assurance",
      "which systems did mike build for zororo-phumulani",
    ],
    answer: CANONICAL_WORK_ANSWER,
    sourceIds: [
      "digi-app-form",
      "zororo-crm",
      "zdi-signature-workflow",
      "zororo-claims",
      "zororo-ai-os",
    ],
  },
  {
    question: "Walk me through Proactive Sentinel's architecture.",
    aliases: [
      "proactive sentinel architecture",
      "what is proactive sentinel",
      "tell me about proactive sentinel",
    ],
    answer:
      "Proactive Sentinel maps events to MITRE ATT&CK and correlates them into chain alerts [1]. It is a Flask SOC with a detection engine, a single SHA-256 ingest fingerprint in Redis, and an audit log. Designed with POPIA in mind. 44 passing tests [2].",
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
      "what has mike built using aws",
      "what has mike built with aws",
    ],
    answer: CANONICAL_AWS_ANSWER,
    sourceIds: ["stack", "aws-web-tier", "certifications"],
  },
  {
    question: "What certifications does Mike hold?",
    aliases: [
      "what certifications does mike have",
      "does mike have any certifications",
      "mike certifications",
      "what courses has mike taken",
      "what training courses does mike have",
    ],
    answer:
      "Mike has no named certifications and no formal degree [1]. His courses include the Becoming an AI Practitioner Series (Introduction to AI; Introduction to Generative AI; Prompts and Working with Foundation Models) and DeepLearning.AI courses in Retrieval-Augmented Generation (RAG), Generative AI with LLMs, Agentic AI, Introduction to Data Engineering, and LangChain for LLM Application Development [1]. AWS Training and Certification and AWS Skills Center are training providers, not certificates [1].",
    sourceIds: ["certifications"],
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
      "what does zdi do",
      "what does the zdi do",
      "what does zororo document intelligence do",
      "what does the signature workflow do",
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
    question: "What is the CRM?",
    aliases: [
      "tell me about the crm",
      "what is the lead-management crm",
      "explain the crm",
      "what is zororo crm",
    ],
    answer:
      "The lead-management CRM is a shipped live production system at Zororo-Phumulani, used by over 40 people across around 10 roles [1]. Deterministic lead grading, strict round-robin routing, role-based access, and an adapter isolating the policy system of record. FastAPI, PostgreSQL, Redis, Celery, and Docker.",
    sourceIds: ["zororo-crm"],
  },
  {
    question: "What is Digi App Form?",
    aliases: [
      "tell me about digi app form",
      "explain digi app form",
      "what is the digi app form",
    ],
    answer:
      "Digi App Form is a shipped live production system for regulated funeral-assurance intake at Zororo-Phumulani [1]. Full-stack Flask: multi-step intake, server-side validation, automated policy-PDF generation, document upload, and a staff admin dashboard.",
    sourceIds: ["digi-app-form"],
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

const PROJECT_STATIC_MENTIONS: Array<{ mention: RegExp; question: string }> = [
  { mention: /\b(?:zdi|zororo document intelligence)\b/i, question: "What is ZDI?" },
  { mention: /\bzororo ai os\b/i, question: "What is Zororo AI OS?" },
  {
    mention: /\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b/i,
    question: "What is the claims operations platform?",
  },
  { mention: /\bcube(?:\s+agent)?\b/i, question: "What is Cube?" },
  { mention: /\bsitewarden\b/i, question: "What is Sitewarden?" },
  {
    mention: /\b(?:the\s+)?crm\b|\blead-management crm\b/i,
    question: "What is the CRM?",
  },
  { mention: /\bdigi app form\b/i, question: "What is Digi App Form?" },
  {
    mention: /\bproactive sentinel\b/i,
    question: "Walk me through Proactive Sentinel's architecture.",
  },
  {
    mention: /\bsentinel\b/i,
    question: "Walk me through Proactive Sentinel's architecture.",
  },
];

function remapAnswerCites(answer: string, offset: number): string {
  if (offset === 0) return answer;
  return answer.replace(/\[(\d+)\]/g, (_, raw: string) => `[${Number(raw) + offset}]`);
}

// Stitch one static answer per named project, in mention order, when the question names two or more.
export function matchMultiProjectAnswer(question: string): StaticAnswer | null {
  const hits: Array<{ index: number; item: StaticAnswer }> = [];
  for (const { mention, question: canonical } of PROJECT_STATIC_MENTIONS) {
    mention.lastIndex = 0;
    const m = mention.exec(question);
    if (!m) continue;
    const item = STATIC_ANSWERS.find((a) => a.question === canonical);
    if (!item) continue;
    hits.push({ index: m.index, item });
  }
  if (hits.length < 2) return null;
  hits.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  const items: StaticAnswer[] = [];
  for (const hit of hits) {
    if (seen.has(hit.item.question)) continue;
    seen.add(hit.item.question);
    items.push(hit.item);
  }
  if (items.length < 2) return null;
  const sourceIds: string[] = [];
  const parts: string[] = [];
  for (const item of items) {
    parts.push(remapAnswerCites(item.answer, sourceIds.length));
    sourceIds.push(...item.sourceIds);
  }
  return {
    question,
    aliases: [],
    answer: parts.join(" "),
    sourceIds,
  };
}

export function matchStaticAnswer(question: string): StaticAnswer | null {
  const multi = matchMultiProjectAnswer(question);
  if (multi) return multi;
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
