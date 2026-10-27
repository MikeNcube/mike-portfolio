// Recruiter-intent canned answers from KB/CV facts only.
// Concept scoring with synonyms and light stemming, not literal sentences.
// Project-named questions never take a Mike-wide intent.

import { STATIC_ANSWERS, type StaticAnswer } from "./static-answers";
import {
  CANONICAL_TECH_LEAD_CRM_ANSWER,
  CANONICAL_ZDI_LIVE_ANSWER,
  isExperienceQuestion,
  isWorkQuestion,
} from "./status-copy";

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

function staticByQuestion(question: string): StaticAnswer {
  const hit = STATIC_ANSWERS.find((item) => item.question === question);
  if (!hit) {
    throw new Error(`missing static answer: ${question}`);
  }
  return hit;
}

function stem(word: string): string[] {
  const w = word.toLowerCase();
  const out = new Set([w]);
  if (w.length <= 3) return [...out];
  if (w.endsWith("ies") && w.length > 4) out.add(`${w.slice(0, -3)}y`);
  if (w.endsWith("es") && w.length > 4) out.add(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && w.length > 3) {
    out.add(w.slice(0, -1));
  }
  if (w.endsWith("ing") && w.length > 5) {
    const stemRoot = w.slice(0, -3);
    out.add(stemRoot);
    out.add(`${stemRoot}e`);
  }
  if (w.endsWith("ed") && w.length > 4) {
    out.add(w.slice(0, -2));
    out.add(w.slice(0, -1));
  }
  if (w === "studied" || w === "studies" || w === "study") {
    out.add("study");
    out.add("studied");
  }
  if (w === "lives" || w === "lived" || w === "living" || w === "live") {
    out.add("live");
  }
  return [...out];
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hasKeyword(hay: string, tokens: string[], keyword: string): boolean {
  const kw = keyword.toLowerCase();
  if (kw.includes(" ")) return hay.includes(kw);
  if (kw === "engineers" || kw === "engineer") {
    return /\bengineers?\b/i.test(hay);
  }
  if ((kw === "language" || kw === "languages") && /\bnatural language\b/i.test(hay)) {
    return false;
  }
  const kwStems = new Set(stem(kw));
  return tokens.some((token) => stem(token).some((s) => kwStems.has(s)));
}

type Concept = {
  id: string;
  question: string;
  keywords: string[];
  strong?: string[];
  allOf?: string[][];
};

const CONCEPTS: Concept[] = [
  { id: "linkedin", question: "What is Mike's LinkedIn?", keywords: [], strong: ["linkedin"] },
  {
    id: "education",
    question: "What is Mike's education?",
    keywords: ["school", "educational"],
    strong: ["degree", "study", "studied", "education", "university", "college", "qualification"],
  },
  {
    id: "years",
    question: "How many years of experience does Mike have?",
    keywords: [],
    strong: ["years", "how long", "how many years", "six-plus"],
  },
  {
    id: "remote",
    question: "Does Mike work remotely?",
    keywords: [],
    strong: ["remote", "remotely", "remote-first", "work from home"],
  },
  {
    id: "location",
    question: "Where is Mike based?",
    keywords: ["where", "country", "from"],
    strong: ["based", "live", "city", "located", "reside"],
  },
  {
    id: "title",
    question: "What is Mike's current job title?",
    keywords: ["job"],
    strong: [
      "title",
      "position",
      "current title",
      "current role",
      "current job",
      "job title",
      "current position",
    ],
  },
  {
    id: "employer",
    question: "Where does Mike work?",
    keywords: ["firm"],
    strong: ["employer", "company", "organisation", "organization", "work for", "works at", "works for", "where does mike work", "employed"],
    allOf: [
      ["where", "work"],
      ["who", "work"],
      ["who", "employ"],
    ],
  },
  {
    id: "contract",
    question: "Would Mike consider a contract role?",
    keywords: ["consult", "consulting"],
    strong: ["contract", "contractor", "freelance", "part-time"],
  },
  {
    id: "roles",
    question: "What roles is Mike looking for?",
    keywords: ["want", "wants", "targeting"],
    strong: ["looking for", "seeking", "target role", "target roles", "open to"],
    allOf: [
      ["position", "want"],
      ["position", "wants"],
      ["position", "seeking"],
      ["position", "looking"],
      ["role", "want"],
      ["role", "wants"],
      ["role", "seeking"],
      ["role", "looking"],
    ],
  },
  {
    id: "ai-tools",
    question: "What AI tools does Mike use?",
    keywords: ["framework", "frameworks"],
    strong: ["ai tool", "ai tools", "llm", "llm framework", "llm frameworks"],
  },
  {
    id: "languages",
    question: "What programming languages does Mike use?",
    keywords: ["language", "languages"],
    strong: ["programming language", "programming languages", "written in"],
  },
  {
    id: "skills",
    question: "What are Mike's main skills?",
    keywords: [],
    strong: ["skills", "stack", "tech stack", "main skills"],
  },
  {
    id: "team",
    question: "What is Mike's team size?",
    keywords: ["engineers", "lead", "report", "reports", "teammates", "manager"],
    strong: ["team", "colleagues", "leadership", "team size", "work with", "manage"],
    allOf: [
      ["manage", "people"],
      ["lead", "team"],
      ["how many", "engineers"],
    ],
  },
  {
    id: "availability",
    question: "Is Mike available for hire?",
    keywords: ["available"],
    strong: ["availability", "can i hire", "available for hire"],
    allOf: [
      ["available", "hire"],
    ],
  },
  {
    id: "why-hire",
    question: "Why should we hire Mike?",
    keywords: ["fit"],
    strong: ["hire", "good fit", "strong candidate", "strong fit", "why mike", "what makes", "should we hire", "different"],
    allOf: [
      ["why", "hire"],
    ],
  },
  {
    id: "strongest",
    question: "What is Mike's strongest project?",
    keywords: ["impressive"],
    strong: ["strongest", "best project", "best build", "most impressive"],
    allOf: [
      ["impressive", "build"],
      ["impressive", "project"],
    ],
  },
  {
    id: "assistant",
    question: "How does this assistant work?",
    keywords: [],
    strong: ["chatbot", "this assistant", "the assistant", "fact assistant"],
    allOf: [
      ["assistant", "work"],
      ["assistant", "built"],
      ["chatbot", "built"],
    ],
  },
  {
    id: "testing",
    question: "What testing has Mike done?",
    keywords: ["testing", "tests", "coverage"],
    strong: ["test coverage", "quality", "reliable", "reliability"],
    allOf: [
      ["testing", "quality"],
      ["code", "reliable"],
    ],
  },
  {
    id: "who",
    question: "Who is Mike Ncube?",
    keywords: ["about", "intro"],
    strong: [
      "who is",
      "who mike",
      "bio",
      "brief",
      "summary",
      "summarise",
      "summarize",
      "introduce",
      "introduction",
    ],
    allOf: [
      ["brief", "about"],
      ["about", "who"],
    ],
  },
];

const SPECIFIC_IDS = new Set(CONCEPTS.map((c) => c.id).filter((id) => id !== "who"));

const SPECIFICITY: Record<string, number> = {
  linkedin: 100,
  contract: 90,
  availability: 88,
  employer: 85,
  education: 80,
  remote: 78,
  years: 76,
  title: 74,
  "ai-tools": 72,
  languages: 70,
  assistant: 68,
  testing: 66,
  strongest: 64,
  "why-hire": 62,
  team: 60,
  roles: 50,
  skills: 48,
  location: 40,
  who: 10,
};

function scoreConcept(hay: string, tokens: string[], concept: Concept): number {
  let score = 0;
  const seen = new Set<string>();
  const bump = (key: string, weight: number) => {
    if (seen.has(key)) return;
    seen.add(key);
    score += weight;
  };
  for (const kw of concept.keywords) {
    if (hasKeyword(hay, tokens, kw)) bump(kw, kw.includes(" ") ? 2 : 1);
  }
  for (const kw of concept.strong ?? []) {
    if (hasKeyword(hay, tokens, kw)) bump(kw, 2);
  }
  for (const group of concept.allOf ?? []) {
    if (group.every((kw) => hasKeyword(hay, tokens, kw))) bump(group.join("+"), 2);
  }
  return score;
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

function projectTopic(
  question: string,
): "stack" | "languages" | "ai" | "approvers" | "deploy" | "lead" | "general" {
  const hay = question.toLowerCase();
  if (/\b(?:tech lead|team lead|engineering lead)\b/i.test(hay)) return "lead";
  if (/\b(?:approv(?:e|es|er|ers|al)|who signs|who reviews)\b/i.test(hay)) return "approvers";
  if (/\b(?:deploy(?:ed|ment)?|where is .{0,24}hosted|live|production rollout)\b/i.test(hay)) {
    return "deploy";
  }
  if (/\b(?:written in|programming languages?|what languages?)\b/i.test(hay)) return "languages";
  if (/\b(?:ai tools?|llm|frameworks?)\b/i.test(hay)) return "ai";
  if (/\b(?:skills?|stack|tech stack|built with|need)\b/i.test(hay)) return "stack";
  return "general";
}

export function matchProjectScopedAnswer(question: string): RecruiterIntent | null {
  const projects = namedProjects(question);
  if (projects.length !== 1) return null;
  const project = PROJECTS.find((item) => item.id === projects[0].id);
  if (!project) return null;
  const topic = projectTopic(question);
  if (topic === "general") return null;
  if (topic === "lead" && project.id === "crm") {
    return {
      id: "project-crm-lead",
      answer: {
        question: "Did Mike act as tech lead on the CRM?",
        aliases: [],
        answer: CANONICAL_TECH_LEAD_CRM_ANSWER,
        sourceIds: ["zororo-crm", "employer"],
      },
    };
  }
  if (topic === "approvers" && project.id === "zdi") {
    return { id: "project-zdi-approvers", answer: staticByQuestion("Who approves ZDI requests?") };
  }
  if (topic === "deploy" && project.id === "zdi") {
    return {
      id: "project-zdi-deploy",
      answer: {
        question: "Where is ZDI deployed?",
        aliases: [],
        answer: CANONICAL_ZDI_LIVE_ANSWER,
        sourceIds: project.sourceIds,
      },
    };
  }
  if (topic === "stack") {
    return {
      id: `project-${project.id}-stack`,
      answer: {
        question: project.staticQuestion,
        aliases: [],
        answer: project.stack,
        sourceIds: project.sourceIds,
      },
    };
  }
  if (topic === "languages") {
    return {
      id: `project-${project.id}-languages`,
      answer: {
        question: project.staticQuestion,
        aliases: [],
        answer: project.languages,
        sourceIds: project.sourceIds,
      },
    };
  }
  if (topic === "ai") {
    return {
      id: `project-${project.id}-ai`,
      answer: {
        question: project.staticQuestion,
        aliases: [],
        answer: project.ai,
        sourceIds: project.sourceIds,
      },
    };
  }
  return {
    id: `project-${project.id}`,
    answer: staticByQuestion(project.staticQuestion),
  };
}

export function matchRecruiterIntent(question: string): RecruiterIntent | null {
  if (namedProjects(question).length > 0) return null;
  const hay = question.toLowerCase();
  const tokens = tokenizeWords(question);
  const scored = CONCEPTS.map((concept) => ({
    concept,
    score: scoreConcept(hay, tokens, concept),
  })).sort((a, b) => b.score - a.score);

  const dropWho = isExperienceQuestion(question) || isWorkQuestion(question);
  const specific = scored.filter((row) => SPECIFIC_IDS.has(row.concept.id) && row.score > 0);
  const pool = (specific.length > 0 ? specific : scored.filter((row) => row.score > 0)).filter(
    (row) => !(dropWho && row.concept.id === "who"),
  );
  if (pool.length === 0) return null;
  const best = pool[0];
  const tied = pool.filter((row) => row.score === best.score);
  if (best.score < 2) return null;
  const winner = tied.reduce((a, b) =>
    (SPECIFICITY[a.concept.id] ?? 0) >= (SPECIFICITY[b.concept.id] ?? 0) ? a : b,
  );
  const runnerUp = tied.find((row) => row.concept.id !== winner.concept.id);
  if (
    runnerUp
    && (SPECIFICITY[winner.concept.id] ?? 0) === (SPECIFICITY[runnerUp.concept.id] ?? 0)
  ) {
    return null;
  }
  return { id: winner.concept.id, answer: staticByQuestion(winner.concept.question) };
}
