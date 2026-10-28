// Named-project matching used as a retrieval rank boost, never as a classify-first return.

import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { STATIC_ANSWERS, type StaticAnswer } from "./static-answers";
import {
  CANONICAL_TECH_LEAD_CRM_ANSWER,
  CANONICAL_ZDI_LIVE_ANSWER,
} from "./status-copy";
import { isPolarQuestion } from "./question-form";

export type RecruiterIntent = {
  id: string;
  answer: StaticAnswer;
};

export type NamedProject = {
  id: string;
  name: string;
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

const PROJECTS: Array<{
  id: string;
  name: string;
  re: RegExp;
  sourceIds: string[];
  staticQuestion: string;
  stack: string;
  languages: string;
  ai: string;
  database: string;
  // Sources for stack and language answers when they differ from sourceIds.
  stackSourceIds?: string[];
}> = [
  {
    id: "zdi",
    name: "ZDI",
    re: /\b(?:zdi|zororo document intelligence)\b/i,
    sourceIds: ["zdi-signature-workflow"],
    staticQuestion: "What is ZDI?",
    stack: "ZDI stack: FastAPI, PostgreSQL and Next.js [1].",
    languages: "The ZDI sources name frameworks rather than languages: FastAPI, PostgreSQL and Next.js [1].",
    ai: "ZDI has no AI in approvals [1]. Requests follow a requester → manager → Accounts approval workflow, and a requester can never approve their own request [1].",
    database: "ZDI uses PostgreSQL as its database [1].",
  },
  {
    id: "crm",
    name: "The CRM",
    // The knowledge base names it the lead-management CRM, so either half names it.
    re: /\b(?:the\s+)?crm\b|\blead[- ]management\b/i,
    sourceIds: ["zororo-crm"],
    staticQuestion: "What is the CRM?",
    stack: "The CRM stack is FastAPI, PostgreSQL, Redis, Celery, and Docker [1].",
    languages: "The CRM sources name frameworks rather than languages: FastAPI, PostgreSQL, Redis, Celery, and Docker [1].",
    ai: "The CRM sources list FastAPI, PostgreSQL, Redis, Celery, and Docker. They do not list an LLM [1].",
    database: "The CRM uses PostgreSQL as its database [1].",
  },
  {
    id: "digi",
    name: "Digi App Form",
    re: /\bdigi(?:\s+app\s+form)?\b/i,
    sourceIds: ["digi-app-form"],
    staticQuestion: "What is Digi App Form?",
    stack: "Digi App Form stack: Python, Flask, SQLite, Docker [1].",
    languages: "Digi App Form languages: Python, as a Flask web application [1].",
    ai: "Digi App Form is a Flask intake system. The sources do not list an LLM [1].",
    database: "Digi App Form uses SQLite as its database [1].",
  },
  {
    id: "ai-os",
    name: "Zororo AI OS",
    re: /\bzororo ai os\b/i,
    sourceIds: ["zororo-ai-os"],
    staticQuestion: "What is Zororo AI OS?",
    stack:
      "Zororo AI OS stack: Python 3.12, FastAPI, Presidio, OPA/Rego, Pydantic, Terraform, and pytest [1]. LangGraph and pgvector are planned [1].",
    languages: "Zororo AI OS languages: Python 3.12, with FastAPI [1].",
    ai: "Zororo AI OS uses Microsoft Presidio and OPA (Rego) [1]. LangGraph and pgvector are planned [1].",
    database: "The Zororo AI OS sources do not name a database; pgvector is planned [1].",
  },
  {
    id: "claims",
    name: "The claims platform",
    // "claims system" too: the platform's own source describes it as the standby for one.
    re: /\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b|\bclaims system\b/i,
    sourceIds: ["zororo-claims"],
    staticQuestion: "What is the claims operations platform?",
    stack: "The claims platform stack: Next.js, TypeScript, NextAuth, Prisma, PostgreSQL, Docker [1].",
    languages: "The claims platform languages: TypeScript, with Next.js [1].",
    ai: "The claims platform sources list Next.js, TypeScript, Prisma, and PostgreSQL. They do not list an LLM [1].",
    database: "The claims platform uses PostgreSQL as its database, through Prisma [1].",
  },
  {
    id: "sentinel",
    name: "Proactive Sentinel",
    re: /\b(?:proactive )?sentinel\b/i,
    sourceIds: ["proactive-sentinel-overview", "proactive-sentinel-tech"],
    staticQuestion: "Walk me through Proactive Sentinel's architecture.",
    stack:
      "Proactive Sentinel stack: Python 3.11, Flask, PostgreSQL, Redis, OpenTelemetry, Docker [1].",
    languages: "Proactive Sentinel is a Python backend (languages: Python 3.11, with Flask) [1].",
    stackSourceIds: ["proactive-sentinel-tech"],
    ai: "Proactive Sentinel is a Python backend, not an LLM product [1].",
    database: "Proactive Sentinel uses PostgreSQL 15 as its database [1].",
  },
  {
    id: "sitewarden",
    name: "Sitewarden",
    re: /\bsitewarden\b/i,
    sourceIds: ["sitewarden"],
    staticQuestion: "What is Sitewarden?",
    stack: "Sitewarden stack: FastAPI, LangGraph, Postgres, and pgvector [1].",
    languages: "The Sitewarden sources name frameworks rather than languages: FastAPI, LangGraph and Postgres [1].",
    ai: "Sitewarden uses a LangGraph state graph and pgvector hybrid search [1].",
    database: "Sitewarden uses Postgres as its database, with pgvector hybrid search [1].",
  },
  {
    id: "cube",
    name: "Cube",
    re: /\bcube(?:\s+agent)?\b/i,
    sourceIds: ["cube-agent"],
    staticQuestion: "What is Cube?",
    stack: "The Cube sources do not list a stack. Cube is a coding agent prototype with provider-agnostic adapters [1].",
    languages: "Cube is a coding agent prototype. The sources do not name its programming languages [1].",
    ai: "Cube is a coding agent with its own tool-calling loop and provider-agnostic model adapters [1].",
    database: "The Cube sources do not name a database [1].",
  },
  {
    id: "claims-pipeline",
    name: "The claims extraction pipeline",
    re: /\bclaims\s+(?:document\s+)?extraction(?:\s+pipeline)?\b/i,
    sourceIds: ["claims-pipeline"],
    staticQuestion: "What is the claims extraction pipeline?",
    stack: "The claims extraction pipeline uses Claude vision extraction validated through Pydantic schemas [1].",
    languages: "The claims extraction pipeline sources name Claude vision extraction and Pydantic schemas, not a programming language [1].",
    ai: "The claims extraction pipeline uses Claude vision extraction, validated through Pydantic schemas, with per-field confidence scoring and a needs-review flag for human verification [1].",
    database: "The claims extraction pipeline sources do not name a database [1].",
  },
  {
    id: "social",
    name: "The content pipeline",
    re: /\b(?:multi-agent content pipeline|social agent|ai-social-agent|content pipeline)\b/i,
    sourceIds: ["ai-social-agent"],
    staticQuestion: "What is the multi-agent content pipeline?",
    stack: "The content pipeline stack: Python, FastAPI, Jinja2, Ollama, Docker, n8n [1].",
    languages: "The content pipeline languages: Python, with FastAPI and Jinja2 [1].",
    ai: "The content pipeline runs on local Ollama [1].",
    database: "The content pipeline sources do not name a database [1].",
  },
  {
    id: "portfolio",
    name: "The portfolio assistant",
    re: /\bportfolio (?:rag )?assistant\b|\brag assistant\b/i,
    sourceIds: ["portfolio-rag-assistant", "this-assistant"],
    staticQuestion: "How does this assistant work?",
    stack: "The portfolio assistant is a RAG pipeline on Next.js with Gemini embeddings and Groq [1].",
    languages: "The portfolio assistant is a Next.js RAG pipeline [1].",
    ai: "The live RAG assistant uses Gemini embeddings and Groq [1].",
    database: "The portfolio assistant sources do not name a database [1].",
  },
];

const PROJECT_TESTING: Record<string, string> = {
  zdi: "ZDI has 525 backend tests [1].",
  sitewarden: "Sitewarden has 89 tests, including retrieval and trajectory evals [1].",
  sentinel: "Proactive Sentinel has 44 passing tests [1].",
  "ai-os": "Zororo AI OS has 310 passing tests, including pytest and Rego policy tests [1].",
  cube: "Cube has a sandboxed eval harness with a trusted verifier [1].",
};

// Deployment state per project, quoted from the knowledge base.
const PROJECT_STATE: Record<string, { live: boolean; prototype: boolean; line: string }> = {
  zdi: {
    live: false,
    prototype: false,
    line: "ZDI is approved for production rollout at Zororo-Phumulani and rolling out soon, but it is not yet live [1].",
  },
  crm: {
    live: true,
    prototype: false,
    line: "The lead-management CRM is a shipped live production system at Zororo-Phumulani, used by over 40 people across around 10 roles [1].",
  },
  digi: {
    live: true,
    prototype: false,
    line: "Digi App Form is a shipped live production system for regulated funeral-assurance intake at Zororo-Phumulani [1].",
  },
  "ai-os": { live: false, prototype: false, line: "Zororo AI OS is built, early stage, and not deployed [1]." },
  claims: {
    live: false,
    prototype: false,
    line: "The claims operations platform is an approved, production-ready standby (failover), not the live system [1].",
  },
  sentinel: {
    live: false,
    prototype: false,
    line: "Proactive Sentinel was deployed to Railway for evaluation and is currently paused [1].",
  },
  sitewarden: {
    live: false,
    prototype: true,
    line: "Sitewarden is a governed AI operations platform prototype, not deployed [1].",
  },
  cube: { live: false, prototype: true, line: "Cube is a coding agent prototype, not deployed [1]." },
  social: { live: false, prototype: true, line: "The multi-agent content pipeline is a prototype [1]." },
  "claims-pipeline": {
    live: false,
    prototype: false,
    line: "The claims document extraction pipeline is a production-ready system pending management approval [1].",
  },
};

// Technologies named in the knowledge base, for "Does <project> use <tech>?".
const KB_TECH_TERMS = [
  "fastapi", "flask", "postgresql", "postgres", "sqlite", "redis", "celery", "docker",
  "python", "typescript", "react", "next.js", "jwt", "langgraph", "langchain",
  "pgvector", "prisma", "nextauth", "presidio", "opa", "rego", "terraform", "ollama",
  "n8n", "opentelemetry", "gemini", "groq", "railway", "aws", "pytest", "sqlalchemy",
  "alembic", "pydantic", "jinja2", "gunicorn", "openai", "claude", "bedrock",
];

// Test frameworks a source may name. Used to say plainly when none is named.
const TEST_FRAMEWORKS = ["pytest", "jest", "vitest", "mocha", "cypress", "playwright", "selenium", "junit", "unittest"];

function askedTech(question: string): string | null {
  for (const term of KB_TECH_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = question.match(new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:$|[^a-z0-9])`, "i"));
    if (match) return match[1];
  }
  return null;
}

function chunkText(ids: string[]): string {
  return KNOWLEDGE_CHUNKS.filter((c) => ids.includes(c.id ?? "")).map((c) => c.text).join("\n");
}

function mentionsTech(text: string, tech: string): boolean {
  const lower = tech.toLowerCase();
  const needle = lower === "postgresql" || lower === "postgres" ? "postgres" : lower;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}`, "i").test(text);
}

function nameMidSentence(name: string): string {
  return name.startsWith("The ") ? `the ${name.slice(4)}` : name;
}

// Opens with a direct answer to the asked status word, then quotes the source line.
function projectStateAnswer(project: (typeof PROJECTS)[number], question: string): string | null {
  const state = PROJECT_STATE[project.id];
  if (!state) return null;
  const hay = question.toLowerCase();
  const name = nameMidSentence(project.name);
  let lead = "";
  if (/\bin prod(?:uction)?\b/.test(hay)) {
    lead = state.live ? `Yes, ${name} is in production [1].` : `No, ${name} is not in production [1].`;
  } else if (/\bprototypes?\b/.test(hay)) {
    lead = state.prototype ? `Yes, ${name} is a prototype [1].` : `No, ${name} is not a prototype [1].`;
  } else if (/\bship(?:ped|s)?\b/.test(hay)) {
    lead = state.live ? `Yes, Mike shipped ${name} [1].` : `No, ${name} has not shipped yet [1].`;
  } else if (/\blive\b/.test(hay)) {
    lead = state.live ? `Yes, ${name} is live [1].` : `No, ${name} is not live [1].`;
  } else if (/\bdeploy/.test(hay) && !/\bdeployed\b/.test(state.line)) {
    lead = state.live
      ? `${project.name} is deployed in production at Zororo-Phumulani [1].`
      : `${project.name} is not deployed to production [1].`;
  } else if (/\bstatus\b/.test(hay)) {
    lead = "Status:";
  }
  return lead ? `${lead} ${state.line}` : state.line;
}

// The text with every project name blanked out, so its words ("Proactive") are
// not mistaken for something else the visitor asked about.
export function withoutProjectNames(text: string): string {
  return PROJECTS.reduce((out, project) => out.replace(new RegExp(project.re.source, "gi"), " "), text);
}

export function namedProjects(question: string): NamedProject[] {
  const hits: NamedProject[] = [];
  for (const project of PROJECTS) {
    if (!project.re.test(question)) continue;
    hits.push({
      id: project.id,
      name: project.name,
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
  | "uses-tech"
  | "acronym"
  | "general";

function projectTopic(question: string): ProjectTopic {
  const hay = question.toLowerCase();
  if (/\b(?:tech lead|team lead|engineering lead)\b/i.test(hay)) return "lead";
  if (/\b(?:stands? for|acronym|abbreviation|short for|full name)\b/i.test(hay)) return "acronym";
  if (/\b(?:use|uses|using)\s+(?:any\s+)?(?:ai|llms?|models?|machine learning)\b/i.test(hay)) return "ai";
  // AI as the asked agent or method ("decided by AI"), outside a project's own name.
  if (/\b(?:ai|llms?|machine learning|genai|gpt)\b/i.test(hay.replace(/\bzororo ai os\b/g, ""))) return "ai";
  if (/\b(?:which|what)\s+(?:ai\s+|llm\s+|language\s+|vision\s+)?models?\b/i.test(hay)) return "ai";
  if (/\b(?:approv(?:e|es|er|ers|al)|who signs|who reviews|signs? off|signed off|sign-off)\b/i.test(hay)) return "approvers";
  // "status of their case" asks about a record inside the system, not the project's status.
  const recordStatus = /\bstatus\s+of\s+(?:their|a|an|his|her|my|your|each|every)\b/i.test(hay);
  // A project's label or tag is its maturity status.
  if (!recordStatus && /\b(?:still running|paused|currently paused|serving traffic|run state|stay up|status|prototypes?|label(?:led|ed)?|tag(?:ged)?|maturity)\b/i.test(hay)) {
    return "status";
  }
  if (
    /\b(?:deploy(?:ed|ment)?|where is .{0,24}hosted|live|in prod(?:uction)?|production rollout|rolled out|rollout|rolling out|ship(?:ped)?)\b/i
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
  if (/\b(?:written in|programming languages?|what languages?|which languages?)\b/i.test(hay)) return "languages";
  if (
    askedTech(question)
    && /\b(?:use|uses|using|used|run on|runs on|built (?:with|on)|rely on|relies on|include|includes)\b/i.test(hay)
  ) {
    return "uses-tech";
  }
  if (/\b(?:ai tools?|llms?|(?:ai|agent|llm) frameworks?)\b/i.test(hay)) return "ai";
  if (/\b(?:database|postgres(?:ql)?)\b/i.test(hay)) return "database";
  if (/\b(?:skills?|stack|tech stack|built (?:with|on)|need|frameworks?)\b/i.test(hay)) {
    return "stack";
  }
  return "general";
}

function scoped(
  project: (typeof PROJECTS)[number],
  suffix: string,
  answer: string,
  sourceIds: string[] = project.sourceIds,
): RecruiterIntent {
  return {
    id: `project-${project.id}-${suffix}`,
    answer: { question: project.staticQuestion, aliases: [], answer, sourceIds },
  };
}

// "What is X used for" asks a purpose. The sources list tools, not their purposes.
const PURPOSE_RE = /\b(?:used\s+for|uses?\s+(?:\S+\s+){1,2}for|for\s+what|purpose|role\s+of)\b/i;

function usesTechAnswer(project: (typeof PROJECTS)[number], question: string): RecruiterIntent | null {
  const tech = askedTech(question);
  if (!tech) return null;
  const sourceIds = project.stackSourceIds ?? project.sourceIds;
  const bareName = nameMidSentence(project.name).replace(/^the /, "");
  if (mentionsTech(chunkText(sourceIds), tech)) {
    if (isPolarQuestion(question)) return scoped(project, "uses-tech", `Yes. ${project.stack}`, sourceIds);
    const purpose = PURPOSE_RE.test(question)
      ? ` The ${bareName} sources list ${tech} but do not say what it is used for.`
      : "";
    return scoped(project, "uses-tech", `${project.stack}${purpose}`, sourceIds);
  }
  if (!mentionsTech(chunkText(["stack"]), tech)) {
    return scoped(project, "uses-tech", `No. ${project.stack}`, sourceIds);
  }
  const cite = sourceIds.length + 1;
  return scoped(
    project,
    "uses-tech",
    `No. ${project.stack} ${tech} is in Mike's wider stack [${cite}], not in the ${bareName} sources.`,
    [...sourceIds, "stack"],
  );
}

// Names the test framework a project's own sources state, or says none is named.
function testFrameworkAnswer(project: (typeof PROJECTS)[number], testing: string): string {
  const text = chunkText(project.sourceIds).toLowerCase();
  const named = TEST_FRAMEWORKS.filter((name) => new RegExp(`\\b${name}\\b`).test(text));
  const name = nameMidSentence(project.name).replace(/^the /, "");
  const lead = named.length > 0
    ? `The ${name} sources name ${named.join(" and ")} [1].`
    : `The ${name} sources do not name a test framework [1].`;
  return `${lead} ${testing}`;
}

// A named technology with no project: answer the asked aspect across Mike's work.
export function matchTechScopedAnswer(question: string): RecruiterIntent | null {
  if (namedProjects(question).length > 0) return null;
  const tech = askedTech(question);
  if (!tech) return null;
  const hay = question.toLowerCase();
  const inStack = mentionsTech(chunkText(["stack"]), tech);
  const withTechLead = (id: string, canonical: string): RecruiterIntent => {
    const base = staticByQuestion(canonical);
    // Both sentences cite the stack chunk, so the lead keeps the [1] numbering intact.
    const answer = inStack && base.sourceIds[0] === "stack"
      ? `${tech} is in Mike's stack [1]. ${base.answer}`
      : base.answer;
    return { id, answer: { ...base, answer } };
  };
  if (/\b(?:written in|languages?)\b/.test(hay)) {
    return withTechLead("tech-languages", "What programming languages does Mike use?");
  }
  if (/\b(?:databases?|data stores?)\b/.test(hay)) {
    return withTechLead("tech-database", "What databases does Mike use?");
  }
  if (!/\b(?:in prod(?:uction)?|live|shipped|deploy(?:ed|ment)?)\b/.test(hay)) return null;
  const deployWord = /\bdeploy/.test(hay);
  const using = PROJECTS.filter((p) => PROJECT_STATE[p.id]?.live && mentionsTech(chunkText(p.sourceIds), tech));
  if (using.length > 0) {
    const names = using.map((p, i) => `${nameMidSentence(p.name)} [${i + 1}]`).join(" and ");
    return {
      id: "tech-production",
      answer: {
        question: "What production systems has Mike shipped?",
        aliases: [],
        answer: `${tech} is ${deployWord ? "deployed" : ""} in production in ${names}.`.replace(/\s+/g, " "),
        sourceIds: using.flatMap((p) => p.sourceIds),
      },
    };
  }
  if (!mentionsTech(chunkText(["stack"]), tech)) return null;
  const systems = deployWord ? "deployed production system" : "system in production";
  return {
    id: "tech-production",
    answer: {
      question: "What production systems has Mike shipped?",
      aliases: [],
      answer: `${tech} is in Mike's stack [1], but neither ${systems} (Digi App Form [2] and the lead-management CRM [3]) lists it.`,
      sourceIds: ["stack", "digi-app-form", "zororo-crm"],
    },
  };
}

export function matchProjectScopedAnswer(question: string): RecruiterIntent | null {
  const projects = namedProjects(question);
  if (projects.length !== 1) return null;
  const project = PROJECTS.find((item) => item.id === projects[0].id);
  if (!project) return null;
  const topic = projectTopic(question);
  switch (topic) {
    case "general":
      // "What problem does ZDI solve?": the project overview, not a chunk sentence.
      return { id: `project-${project.id}-overview`, answer: staticByQuestion(project.staticQuestion) };
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
    case "status": {
      if (project.id === "zdi" && topic === "deploy" && !/\b(?:in prod(?:uction)?|ship(?:ped)?)\b/i.test(question)) {
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
      const state = projectStateAnswer(project, question);
      return state ? scoped(project, "status", state) : null;
    }
    case "remote":
      return scoped(project, "remote", staticByQuestion(project.staticQuestion).answer);
    case "testing": {
      const testing = PROJECT_TESTING[project.id];
      if (!testing) return null;
      if (/\b(?:framework|library|runner|tool(?:ing)?)s?\b/i.test(question)) {
        return scoped(project, "testing", testFrameworkAnswer(project, testing));
      }
      return scoped(project, "testing", testing);
    }
    case "storage":
      return { id: `project-${project.id}-storage`, answer: staticByQuestion(project.staticQuestion) };
    case "writes":
      return { id: `project-${project.id}-writes`, answer: staticByQuestion(project.staticQuestion) };
    case "uses-tech":
      return usesTechAnswer(project, question);
    case "database":
      return scoped(project, "database", project.database);
    case "stack":
      return scoped(project, "stack", project.stack, project.stackSourceIds ?? project.sourceIds);
    case "languages":
      return scoped(project, "languages", project.languages, project.stackSourceIds ?? project.sourceIds);
    case "ai":
      return scoped(project, "ai", project.ai);
    case "acronym":
      if (project.id !== "zdi") return null;
      return scoped(project, "acronym", "ZDI stands for Zororo Document Intelligence [1].");
    default: {
      const _exhaustive: never = topic;
      return _exhaustive;
    }
  }
}

/** Rank boost: source ids that should rise when the question names a project. */
export function projectBoostIds(question: string): string[] {
  return namedProjects(question).flatMap((p) => p.sourceIds);
}
