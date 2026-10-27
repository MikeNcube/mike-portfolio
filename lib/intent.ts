// Recruiter-intent canned answers from KB/CV facts only.
// Exemplar-bank classifier (TF-IDF cosine, local) with head-noun overrides.
// Project-named questions and start-date refusals never take a Mike-wide intent.

import { STATIC_ANSWERS, type StaticAnswer } from "./static-answers";
import {
  CANONICAL_TECH_LEAD_CRM_ANSWER,
  CANONICAL_ZDI_LIVE_ANSWER,
  isAwsQuestion,
  isExperienceQuestion,
  isTopicalTechBuildQuestion,
  isWorkQuestion,
} from "./status-copy";
import {
  INTENT_CANONICAL,
  INTENT_EXEMPLARS,
  type ClassifiedIntentId,
  type RecruiterIntentId,
} from "./intent-exemplars";

export type RecruiterIntent = {
  id: string;
  answer: StaticAnswer;
};

export type NamedProject = {
  id: string;
  sourceIds: string[];
  staticQuestion: string;
  stack: string;
  languages: string;
  ai: string;
};

export type IntentClassification = {
  id: ClassifiedIntentId;
  score: number;
  runnerUp: ClassifiedIntentId | null;
  runnerUpScore: number;
};

function staticByQuestion(question: string): StaticAnswer {
  const hit = STATIC_ANSWERS.find((item) => item.question === question);
  if (!hit) {
    throw new Error(`missing static answer: ${question}`);
  }
  return hit;
}

const INTENT_STOP = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "for",
  "with", "at", "by", "from", "as", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "me", "him", "her",
  "my", "your", "our", "their", "do", "does", "did", "has", "have", "had",
  "can", "could", "would", "should", "will", "just", "about", "into", "over",
  "than", "too", "very", "mike", "ncube", "please", "also", "really",
  "whats", "thats", "theres", "im", "ive",
]);

function canonicalStem(word: string): string {
  const w = word.toLowerCase();
  if (w === "studied" || w === "studies" || w === "study") return "studi";
  if (w === "lives" || w === "lived" || w === "living" || w === "live") return "live";
  if (w === "favourite" || w === "favorite") return "favorit";
  if (w === "colour" || w === "color") return "color";
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && w.length > 3) {
    return w.slice(0, -1);
  }
  return w;
}

function intentTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !INTENT_STOP.has(t))
    .map(canonicalStem);
}

type TfIdfVec = Map<string, number>;

type ExemplarDoc = {
  id: ClassifiedIntentId;
  tokens: string[];
  tfidf: TfIdfVec;
  norm: number;
};

const MIN_COSINE = 0.5;
const MIN_MARGIN = 0.04;

function tfMap(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
  return tf;
}

function vectorNorm(vec: TfIdfVec): number {
  let sum = 0;
  for (const value of vec.values()) sum += value * value;
  return Math.sqrt(sum) || 1;
}

function cosine(a: TfIdfVec, aNorm: number, b: TfIdfVec, bNorm: number): number {
  let dot = 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, weight] of smaller) {
    const other = larger.get(term);
    if (other) dot += weight * other;
  }
  return dot / (aNorm * bNorm);
}

function buildIndex(): { docs: ExemplarDoc[]; idf: Map<string, number> } {
  const raw: Array<{ id: ClassifiedIntentId; tokens: string[] }> = [];
  for (const [id, questions] of Object.entries(INTENT_EXEMPLARS) as Array<
    [ClassifiedIntentId, string[]]
  >) {
    for (const question of questions) {
      raw.push({ id, tokens: intentTokens(question) });
    }
  }
  const df = new Map<string, number>();
  for (const doc of raw) {
    for (const term of new Set(doc.tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const n = raw.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }
  const docs: ExemplarDoc[] = raw.map((doc) => {
    const tf = tfMap(doc.tokens);
    const vec: TfIdfVec = new Map();
    for (const [term, count] of tf) {
      vec.set(term, (count / doc.tokens.length) * (idf.get(term) ?? 0));
    }
    return { id: doc.id, tokens: doc.tokens, tfidf: vec, norm: vectorNorm(vec) };
  });
  return { docs, idf };
}

const INTENT_INDEX = buildIndex();

function queryVector(tokens: string[]): { vec: TfIdfVec; norm: number } {
  const tf = tfMap(tokens);
  const vec: TfIdfVec = new Map();
  for (const [term, count] of tf) {
    vec.set(term, (count / tokens.length) * (INTENT_INDEX.idf.get(term) ?? 0));
  }
  return { vec, norm: vectorNorm(vec) };
}

const PLACE_RE =
  /\b(?:city|country|based|live|lives|living|located|reside|province|region|whereabouts|south africa|johannesburg|where)\b/i;

function headNounOverride(question: string): ClassifiedIntentId | null {
  const hay = question.toLowerCase();
  if (
    /\b(?:favourites?|favorites?)\b/.test(hay)
    && /\b(?:project|build|system|flagship)\b/.test(hay)
  ) {
    return "strongest";
  }
  if (
    /\b(?:favourites?|favorites?|colour|color|pizza|pasta|weather|hobb(?:y|ies)|personal life)\b/.test(hay)
    && !/\b(?:project|build|system|work|role|stack|flagship)\b/.test(hay)
  ) {
    return "off-topic";
  }
  if (/\bai tools?\b/.test(hay) || /\bllm (?:tools?|frameworks?|stack)\b/.test(hay)) {
    return "ai-tools";
  }
  if (
    /\b(?:title|role|position|job)\b/.test(hay)
    && /\b(?:next|want|wants|hoping|after|target|suits?|like|open to)\b/.test(hay)
    && !/\bcurrent\b/.test(hay)
  ) {
    return "roles";
  }
  if (/\bopen to work\b/.test(hay) && !/\bhire\b/.test(hay)) {
    return "roles";
  }
  if (
    /\b(?:company|org|organisation|organization)\b/.test(hay)
    && /\b(?:value|bring|benefit)\b/.test(hay)
  ) {
    return "why-hire";
  }
  if (/\b(?:cv|resume)\b/.test(hay) && /\bhighlights?\b/.test(hay)) {
    return "who";
  }
  if (
    /\bprojects?\b/.test(hay)
    && /\b(?:best|shows?|demonstrat|highlight)\b/.test(hay)
  ) {
    return "strongest";
  }
  if (
    (/\bmanagers?\b/.test(hay) && /\b(?:people|team|engineering)\b/.test(hay))
    || /\bpeople manager\b/.test(hay)
    || (/\bpeople\b/.test(hay) && /\bmanag/.test(hay))
  ) {
    if (!/\b(?:zdi|join|start|begin)\b/.test(hay)) return "team";
  }
  if (
    /\bpart of\b/.test(hay)
    && /\b(?:team|department|engineering)\b/.test(hay)
    && !PLACE_RE.test(hay)
  ) {
    return "team";
  }
  if (
    /\bproduction\b/.test(hay)
    && /\b(?:bugs?|defects?|fallback|retries|auditable)\b/.test(hay)
  ) {
    return "engineering";
  }
  if (
    /\b(?:break|breaking|reliable|reliability)\b/.test(hay)
    && /\b(?:systems?|code|prod(?:uction)?)\b/.test(hay)
    && !/\b(?:bugs?|defects?|fallback|retries|auditable)\b/.test(hay)
  ) {
    return "testing";
  }
  if (/\b(?:teammates?|colleagues?)\b/.test(hay) && !/\bremote(?:ly)?\b/.test(hay)) {
    return "team";
  }
  if (/\borchestration\b/.test(hay) && /\b(?:librar(?:y|ies)|agents?|frameworks?)\b/.test(hay)) {
    return "ai-tools";
  }
  if (/\bself[- ]?taught\b/.test(hay) || (/\btaught\b/.test(hay) && /\bself\b/.test(hay))) {
    return "education";
  }
  if (/\bmoonlight\b/.test(hay)) {
    return "contract";
  }
  if (/\bmarket\b/.test(hay) && /\b(?:job|role|work)\b/.test(hay)) {
    return "roles";
  }
  if (/\balone\b/.test(hay) && /\b(?:others|teammates|colleagues|team)\b/.test(hay)) {
    return "team";
  }
  if (
    /\bhire\b/.test(hay)
    && /\b(?:why|should)\b/.test(hay)
    && !/\b(?:can i hire|available for hire)\b/.test(hay)
  ) {
    return "why-hire";
  }
  if (
    /\b(?:gigs?|freelance|consult(?:ing|ant)?)\b/.test(hay)
    && !/\b(?:available for hire|can i hire)\b/.test(hay)
  ) {
    return "contract";
  }
  if (
    /\bprofile\b/.test(hay)
    && /\b(?:describe|nutshell|summary|bio|brief)\b/.test(hay)
    && !/\blinkedin\b/.test(hay)
  ) {
    return "who";
  }
  return null;
}

export function classifyRecruiterIntent(question: string): IntentClassification | null {
  const override = headNounOverride(question);
  if (override) {
    return { id: override, score: 1, runnerUp: null, runnerUpScore: 0 };
  }
  const tokens = intentTokens(question);
  if (tokens.length === 0) return null;
  const query = queryVector(tokens);
  const bestById = new Map<ClassifiedIntentId, number>();
  for (const doc of INTENT_INDEX.docs) {
    const score = cosine(query.vec, query.norm, doc.tfidf, doc.norm);
    const prev = bestById.get(doc.id) ?? 0;
    if (score > prev) bestById.set(doc.id, score);
  }
  const ranked = [...bestById.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  const [id, score] = ranked[0];
  const [runnerId, runnerScore] = ranked[1] ?? [null, 0];
  if (score < MIN_COSINE) return null;
  if (runnerId && score - runnerScore < MIN_MARGIN) return null;
  return {
    id,
    score,
    runnerUp: runnerId,
    runnerUpScore: runnerScore,
  };
}

const PROJECTS: Array<{
  id: string;
  re: RegExp;
  sourceIds: string[];
  staticQuestion: string;
  stack: string;
  languages: string;
  ai: string;
}> = [
  {
    id: "zdi",
    re: /\b(?:zdi|zororo document intelligence)\b/i,
    sourceIds: ["zdi-signature-workflow"],
    staticQuestion: "What is ZDI?",
    stack: "ZDI is built with FastAPI, PostgreSQL and Next.js [1].",
    languages: "ZDI is written with FastAPI, PostgreSQL and Next.js [1].",
    ai: "ZDI has no AI in approvals [1].",
  },
  {
    id: "crm",
    re: /\b(?:the\s+)?crm\b|\blead-management crm\b/i,
    sourceIds: ["zororo-crm"],
    staticQuestion: "What is the CRM?",
    stack: "The CRM stack is FastAPI, PostgreSQL, Redis, Celery, and Docker [1].",
    languages: "The CRM is built with FastAPI, PostgreSQL, Redis, Celery, and Docker [1].",
    ai: "The CRM sources list FastAPI, PostgreSQL, Redis, Celery, and Docker. They do not list an LLM [1].",
  },
  {
    id: "digi",
    re: /\bdigi(?:\s+app\s+form)?\b/i,
    sourceIds: ["digi-app-form"],
    staticQuestion: "What is Digi App Form?",
    stack: "Digi App Form stack: Python, Flask, SQLite, Docker [1].",
    languages: "Digi App Form is a Flask web application in Python [1].",
    ai: "Digi App Form is a Flask intake system. The sources do not list an LLM [1].",
  },
  {
    id: "ai-os",
    re: /\bzororo ai os\b/i,
    sourceIds: ["zororo-ai-os"],
    staticQuestion: "What is Zororo AI OS?",
    stack:
      "Zororo AI OS stack: Python 3.12, FastAPI, Presidio, OPA/Rego, Pydantic, Terraform, and pytest [1]. LangGraph and pgvector are planned [1].",
    languages: "Zororo AI OS is written in Python with FastAPI [1].",
    ai: "Zororo AI OS uses Microsoft Presidio and OPA (Rego) [1]. LangGraph and pgvector are planned [1].",
  },
  {
    id: "claims",
    re: /\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b/i,
    sourceIds: ["zororo-claims"],
    staticQuestion: "What is the claims operations platform?",
    stack: "The claims platform stack: Next.js, TypeScript, NextAuth, Prisma, PostgreSQL, Docker [1].",
    languages: "The claims platform is written in TypeScript with Next.js [1].",
    ai: "The claims platform sources list Next.js, TypeScript, Prisma, and PostgreSQL. They do not list an LLM [1].",
  },
  {
    id: "sentinel",
    re: /\b(?:proactive )?sentinel\b/i,
    sourceIds: ["proactive-sentinel-overview", "proactive-sentinel-tech"],
    staticQuestion: "Walk me through Proactive Sentinel's architecture.",
    stack:
      "Proactive Sentinel stack: Python 3.11, Flask, PostgreSQL, Redis, OpenTelemetry, Docker [1].",
    languages: "Proactive Sentinel is a Python backend [1].",
    ai: "Proactive Sentinel is a Python backend, not an LLM product [1].",
  },
  {
    id: "sitewarden",
    re: /\bsitewarden\b/i,
    sourceIds: ["sitewarden"],
    staticQuestion: "What is Sitewarden?",
    stack: "Sitewarden uses FastAPI, LangGraph, Postgres, and pgvector [1].",
    languages: "Sitewarden is a FastAPI backend with LangGraph and Postgres [1].",
    ai: "Sitewarden uses a LangGraph state graph and pgvector hybrid search [1].",
  },
  {
    id: "cube",
    re: /\bcube(?:\s+agent)?\b/i,
    sourceIds: ["cube-agent"],
    staticQuestion: "What is Cube?",
    stack: "Cube is a coding agent prototype with provider-agnostic adapters [1].",
    languages: "Cube is a coding agent prototype. The sources do not name a language [1].",
    ai: "Cube is a coding agent with provider-agnostic model adapters [1].",
  },
  {
    id: "social",
    re: /\b(?:multi-agent content pipeline|social agent|ai-social-agent|content pipeline)\b/i,
    sourceIds: ["ai-social-agent"],
    staticQuestion: "What is the multi-agent content pipeline?",
    stack: "The content pipeline stack: Python, FastAPI, Jinja2, Ollama, Docker, n8n [1].",
    languages: "The content pipeline is written in Python [1].",
    ai: "The content pipeline runs on local Ollama [1].",
  },
  {
    id: "portfolio",
    re: /\bportfolio (?:rag )?assistant\b|\brag assistant\b/i,
    sourceIds: ["portfolio-rag-assistant", "this-assistant"],
    staticQuestion: "How does this assistant work?",
    stack: "The portfolio assistant is a RAG pipeline on Next.js with Gemini embeddings and Groq [1].",
    languages: "The portfolio assistant is a Next.js RAG pipeline [1].",
    ai: "The live RAG assistant uses Gemini embeddings and Groq [1].",
  },
];

export function isStartJoinAvailabilityQuestion(question: string): boolean {
  return (
    /\b(?:when (?:can|could|would|will) (?:mike|he) (?:start|join|begin)|(?:can|could) (?:mike|he) start|how soon can (?:mike|he) (?:start|join)|available to start|start (?:date|next|this|tomorrow|immediately))\b/i
      .test(question)
  );
}

const PROJECT_TESTING: Record<string, string> = {
  zdi: "ZDI has 525 backend tests [1].",
  sitewarden: "Sitewarden has 89 tests, including retrieval and trajectory evals [1].",
  sentinel: "Proactive Sentinel has 44 passing tests [1].",
  "ai-os": "Zororo AI OS has 310 passing tests, including pytest and Rego policy tests [1].",
  cube: "Cube has a sandboxed eval harness with a trusted verifier [1].",
};

const PROJECT_STATUS: Record<string, string> = {
  sentinel:
    "Proactive Sentinel was deployed to Railway for evaluation and is currently paused [1].",
};

export function namedProjects(question: string): NamedProject[] {
  const hits: NamedProject[] = [];
  for (const project of PROJECTS) {
    if (!project.re.test(question)) continue;
    hits.push({
      id: project.id,
      sourceIds: project.sourceIds,
      staticQuestion: project.staticQuestion,
      stack: project.stack,
      languages: project.languages,
      ai: project.ai,
    });
  }
  return hits;
}

type ProjectTopic =
  | "stack"
  | "languages"
  | "ai"
  | "approvers"
  | "deploy"
  | "lead"
  | "testing"
  | "remote"
  | "storage"
  | "status"
  | "writes"
  | "database"
  | "general";

function projectTopic(question: string): ProjectTopic {
  const hay = question.toLowerCase();
  if (/\b(?:tech lead|team lead|engineering lead)\b/i.test(hay)) return "lead";
  if (/\b(?:approv(?:e|es|er|ers|al)|who signs|who reviews)\b/i.test(hay)) return "approvers";
  if (/\b(?:still running|paused|currently paused)\b/i.test(hay)) return "status";
  if (
    /\b(?:deploy(?:ed|ment)?|where is .{0,24}hosted|live|production rollout|rolled out|rollout|rolling out)\b/i
      .test(hay)
  ) {
    return "deploy";
  }
  if (/\bremote(?:ly)?\b/i.test(hay)) return "remote";
  if (/\b(?:test(?:s|ed|ing)?|evals?|coverage)\b/i.test(hay)) return "testing";
  if (/\b(?:document storage|supporting-document|durable submission|document upload)\b/i.test(hay)) {
    return "storage";
  }
  if (/\b(?:before writ|writing files|approval prompts before writes)\b/i.test(hay)) return "writes";
  if (/\b(?:written in|programming languages?|what languages?)\b/i.test(hay)) return "languages";
  if (/\b(?:ai tools?|llm|frameworks?)\b/i.test(hay)) return "ai";
  if (/\b(?:database|postgres(?:ql)?)\b/i.test(hay)) return "database";
  if (/\b(?:skills?|stack|tech stack|built with|need)\b/i.test(hay)) {
    return "stack";
  }
  return "general";
}

export function matchProjectScopedAnswer(question: string): RecruiterIntent | null {
  const projects = namedProjects(question);
  if (projects.length !== 1) return null;
  const project = PROJECTS.find((item) => item.id === projects[0].id);
  if (!project) return null;
  const topic = projectTopic(question);
  switch (topic) {
    case "general":
      return null;
    case "lead":
      if (project.id !== "crm") return null;
      return {
        id: "project-crm-lead",
        answer: {
          question: "Did Mike act as tech lead on the CRM?",
          aliases: [],
          answer: CANONICAL_TECH_LEAD_CRM_ANSWER,
          sourceIds: ["zororo-crm", "employer"],
        },
      };
    case "approvers":
      if (project.id !== "zdi") return null;
      return { id: "project-zdi-approvers", answer: staticByQuestion("Who approves ZDI requests?") };
    case "deploy":
      if (project.id !== "zdi") return null;
      return {
        id: "project-zdi-deploy",
        answer: {
          question: "Where is ZDI deployed?",
          aliases: [],
          answer: CANONICAL_ZDI_LIVE_ANSWER,
          sourceIds: project.sourceIds,
        },
      };
    case "status": {
      const status = PROJECT_STATUS[project.id];
      if (!status) return null;
      return {
        id: `project-${project.id}-status`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: status,
          sourceIds: project.sourceIds,
        },
      };
    }
    case "remote":
      return {
        id: `project-${project.id}-remote`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: staticByQuestion(project.staticQuestion).answer,
          sourceIds: project.sourceIds,
        },
      };
    case "testing": {
      const testing = PROJECT_TESTING[project.id];
      if (!testing) return null;
      return {
        id: `project-${project.id}-testing`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: testing,
          sourceIds: project.sourceIds,
        },
      };
    }
    case "storage":
      return {
        id: `project-${project.id}-storage`,
        answer: staticByQuestion(project.staticQuestion),
      };
    case "writes":
      return {
        id: `project-${project.id}-writes`,
        answer: staticByQuestion(project.staticQuestion),
      };
    case "database": {
      if (!/\bpostgres(?:ql)?\b/i.test(project.stack)) return null;
      const name = project.id === "crm" ? "The CRM" : project.staticQuestion.replace(/^What is /i, "").replace(/\?$/, "");
      return {
        id: `project-${project.id}-database`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: `${name} uses PostgreSQL as its database [1].`,
          sourceIds: project.sourceIds,
        },
      };
    }
    case "stack":
      return {
        id: `project-${project.id}-stack`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: project.stack,
          sourceIds: project.sourceIds,
        },
      };
    case "languages":
      return {
        id: `project-${project.id}-languages`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: project.languages,
          sourceIds: project.sourceIds,
        },
      };
    case "ai":
      return {
        id: `project-${project.id}-ai`,
        answer: {
          question: project.staticQuestion,
          aliases: [],
          answer: project.ai,
          sourceIds: project.sourceIds,
        },
      };
    default: {
      const _exhaustive: never = topic;
      return _exhaustive;
    }
  }
}

function isTechKnowledgeQuestion(question: string): boolean {
  return /^(?:so |hey,? )?(?:does|has|did) mike (?:know|used?|built?|done)\b/i.test(question.trim());
}

function hasOwnTopicPath(question: string): boolean {
  return (
    /\b(?:grounding prompt|prompt injection|prompt templates?|prompt engineering)\b/i.test(question)
    || (/\brag\b/i.test(question) && !/\b(?:assistant|chatbot|this chat)\b/i.test(question))
    || /\bproduction systems?\b/i.test(question)
    || (
      /\b(?:contact|email|get in touch|reach (?:out|mike|him)|how (?:can|do) i reach)\b/i.test(question)
      && !/\bhire\b/i.test(question)
    )
    || /\bpopia\b/i.test(question)
    || /\bvector databases?\b/i.test(question)
    || /\bcertif/i.test(question)
    || (
      /\b(?:courses?|training)\b/i.test(question)
      && !/\b(?:education|degree|self[- ]?taught)\b/i.test(question)
    )
  );
}

export function matchRecruiterIntent(question: string): RecruiterIntent | null {
  if (namedProjects(question).length > 0) return null;
  if (isStartJoinAvailabilityQuestion(question)) return null;
  if (/\b(?:day rate|hourly rate|daily rate|notice period|relocat(?:e|ion)|time ?zone|timezone)\b/i.test(question)) {
    return null;
  }
  if (/\bgithub\b/i.test(question) && !/\blinkedin\b/i.test(question)) return null;
  if (isTechKnowledgeQuestion(question)) return null;
  if (hasOwnTopicPath(question)) return null;
  if (isAwsQuestion(question)) return null;
  if (isTopicalTechBuildQuestion(question)) return null;
  if (isExperienceQuestion(question) || isWorkQuestion(question)) return null;
  const hit = classifyRecruiterIntent(question);
  if (!hit || hit.id === "off-topic") return null;
  if (
    hit.id === "availability"
    && !/\b(?:hire|hiring|hireable|availability)\b/i.test(question)
  ) {
    return null;
  }
  const id = hit.id as RecruiterIntentId;
  const canonical = INTENT_CANONICAL[id];
  if (!canonical) return null;
  return { id, answer: staticByQuestion(canonical) };
}
