// Named-project matching used as a retrieval rank boost, never as a classify-first return.

import { STATIC_ANSWERS, type StaticAnswer } from "./static-answers";
import {
  CANONICAL_TECH_LEAD_CRM_ANSWER,
  CANONICAL_ZDI_LIVE_ANSWER,
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
  if (/\b(?:still running|paused|currently paused|serving traffic|run state|stay up)\b/i.test(hay)) {
    return "status";
  }
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
      return {
        id: `project-${project.id}-general`,
        answer: staticByQuestion(project.staticQuestion),
      };
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

/** Rank boost: source ids that should rise when the question names a project. */
export function projectBoostIds(question: string): string[] {
  return namedProjects(question).flatMap((p) => p.sourceIds);
}
