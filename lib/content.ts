export type Project = {
  slug: string;
  name: string;
  tagline: string;
  problem: string;
  approach: string;
  outcome: string;
  stack: string[];
  signals: string[];
  domain: string;
  year: string;
  role: string;
  href?: string;
};

/**
 * Flagship projects are surfaced first — highest recruiter / hiring-manager signal.
 * Each entry is framed as a SYSTEM, not a tutorial: problem, architectural choices, outcome.
 */
export const flagshipProjects: Project[] = [
  {
    slug: "agentic-workflow-automation",
    name: "Agentic AI Workflow Automation System",
    tagline:
      "Multi-step LLM agent that plans, executes, and self-corrects long-running business workflows.",
    problem:
      "Operations teams lose hours to repetitive, multi-tool workflows (triage, routing, summarising, drafting). Off-the-shelf chatbots can't reliably chain steps or recover from tool failures.",
    approach:
      "Designed a tool-calling agent with a planner/executor loop, typed tool registry, deterministic step IDs, and structured memory. Each step is idempotent, retryable, and emits a trace event — so runs can be replayed, audited, or resumed after failure.",
    outcome:
      "Reduced manual workflow time by an order of magnitude for supported tasks, with 100% replayable runs and full observability across tool calls, token usage, and latency.",
    stack: [
      "Python",
      "FastAPI",
      "LangChain / LangGraph",
      "OpenAI / Anthropic",
      "AWS",
      "PostgreSQL",
      "Redis",
    ],
    signals: [
      "Agent orchestration",
      "Tool calling",
      "Idempotent steps",
      "Run replay & audit",
      "Typed contracts",
    ],
    domain: "Agentic AI · Automation",
    year: "2025",
    role: "System design · Backend · LLM orchestration",
  },
  {
    slug: "llm-backend-intelligence",
    name: "LLM-Powered Backend Intelligence System",
    tagline:
      "RAG + structured-output service that turns unstructured enterprise data into reliable API responses.",
    problem:
      "Internal teams needed trustworthy answers grounded in policies, PDFs, and tickets — not hallucinated paragraphs — with auditability and hard latency budgets.",
    approach:
      "Built a FastAPI inference service with hybrid retrieval (BM25 + dense vectors), reranking, citation-preserving answer synthesis, and JSON-schema-enforced outputs. Added per-tenant quotas, prompt versioning, and evaluation harness for regression-testing model changes.",
    outcome:
      "Sub-second p95 retrieval, measurable grounding rate via eval harness, and a clean HTTP contract any product team can integrate in under a day.",
    stack: [
      "Python",
      "FastAPI",
      "LangChain",
      "pgvector / OpenSearch",
      "AWS (S3, Lambda, Bedrock)",
      "Redis",
      "Docker",
    ],
    signals: [
      "RAG",
      "Hybrid retrieval",
      "Structured outputs",
      "Eval harness",
      "Multi-tenant",
    ],
    domain: "LLM Systems · Backend",
    year: "2025",
    role: "Backend engineering · Retrieval · Eval",
  },
  {
    slug: "automated-data-pipeline",
    name: "Automated Data Pipeline & Processing System",
    tagline:
      "Event-driven ingestion pipeline that normalises messy third-party data into analytics-ready tables.",
    problem:
      "Downstream dashboards and ML features depended on fragile, ad-hoc CSV pulls — late, schema-drifting, and impossible to debug.",
    approach:
      "Built a scheduled + event-driven pipeline with typed contracts at every hop: extractors, validators (Pydantic), transformers, and loaders. Added schema-drift detection, quarantine tables for bad rows, and per-job SLIs (freshness, completeness, row counts).",
    outcome:
      "Pipeline freshness moved from daily-and-flaky to near-real-time-and-observable, with automated alerts on schema drift and a clear ownership model per data contract.",
    stack: [
      "Python",
      "FastAPI",
      "AWS (S3, Lambda, SQS)",
      "PostgreSQL",
      "Pandas / Polars",
      "Pydantic",
      "Docker",
    ],
    signals: [
      "Schema contracts",
      "Drift detection",
      "SLIs per job",
      "Replayable runs",
      "Quarantine pattern",
    ],
    domain: "Data Engineering · Automation",
    year: "2025",
    role: "Data pipeline design · Backend",
  },
];

export const agenticProjects: Project[] = [
  {
    slug: "multi-agent-research",
    name: "Multi-Agent Research & Synthesis System",
    tagline:
      "Coordinated agents that decompose a research goal, fetch sources, cross-verify, and produce cited briefs.",
    problem:
      "Single-shot LLM 'research' is shallow and ungrounded — one agent can't plan, browse, verify, and write without supervision.",
    approach:
      "Planner → Researcher → Critic → Synthesiser agent graph with shared scratchpad, source registry, and a mandatory citation check before the Synthesiser is allowed to emit output. Critic can reject and re-dispatch steps.",
    outcome:
      "Higher factual grounding than single-prompt baselines, with every claim traceable to a source URL and a visible rejection/retry trail.",
    stack: ["Python", "FastAPI", "OpenAI", "Pydantic", "PostgreSQL"],
    signals: ["Planner/Critic loop", "Citation enforcement", "Shared memory"],
    domain: "Agentic AI",
    year: "2025",
    role: "Agent graph design",
  },
  {
    slug: "llm-ops-router",
    name: "LLM Routing & Cost Control Layer",
    tagline:
      "Request-level router that picks the cheapest model capable of passing the task's eval suite.",
    problem:
      "Teams default to the largest model for every request, burning budget on tasks a smaller model can solve.",
    approach:
      "Task-type classifier + per-task eval gates decide whether a cheap model is sufficient; else escalate. All decisions logged with cost-per-request and pass/fail — so model choice becomes a measurable product decision.",
    outcome:
      "Meaningful cost-per-task reduction for bulk workloads while keeping quality gated by automated evals instead of vibes.",
    stack: ["Python", "FastAPI", "OpenAI / Anthropic / local", "Redis"],
    signals: ["Eval gates", "Cost telemetry", "Model fallback"],
    domain: "LLM Systems",
    year: "2025",
    role: "LLM infra",
  },
  {
    slug: "rag-eval-harness",
    name: "RAG Evaluation Harness",
    tagline:
      "Offline + online eval framework for retrieval quality, answer grounding, and regression detection.",
    problem:
      "RAG systems silently degrade as corpora, chunking, or prompts change — without a harness, regressions ship.",
    approach:
      "Golden-set + LLM-as-judge hybrid with per-change diff reports, failure bucketing, and CI integration. Flags regressions on PRs before merge.",
    outcome:
      "Every prompt / retrieval / chunking change is a measurable experiment with a reproducible scorecard.",
    stack: ["Python", "Pytest", "Pandas", "OpenAI"],
    signals: ["Golden sets", "LLM-as-judge", "CI-gated quality"],
    domain: "LLM Evaluation",
    year: "2025",
    role: "Eval tooling",
  },
];

export const backendProjects: Project[] = [
  {
    slug: "fastapi-platform-service",
    name: "FastAPI Platform Service",
    tagline:
      "Typed, observable HTTP platform for AI + automation workloads.",
    problem:
      "AI features kept getting bolted onto fragile endpoints with no consistent auth, validation, or error semantics.",
    approach:
      "FastAPI service with Pydantic contracts, dependency-injected auth, structured JSON logging, request-scoped tracing IDs, OpenAPI-first design, and a shared error envelope. Postgres for durable state, Redis for ephemeral.",
    outcome:
      "New AI endpoints ship in hours, not days — with uniform validation, observability, and contract tests out of the box.",
    stack: ["Python", "FastAPI", "Pydantic", "PostgreSQL", "Redis", "Docker"],
    signals: ["OpenAPI-first", "Typed contracts", "Tracing IDs"],
    domain: "Backend Engineering",
    year: "2025",
    role: "Backend / platform",
  },
  {
    slug: "flask-automation-api",
    name: "Flask Automation API",
    tagline:
      "Lean Flask service powering webhook-driven automations across internal tools.",
    problem:
      "Event hooks from SaaS tools needed reliable, auditable fan-out into internal systems without a heavyweight stack.",
    approach:
      "Flask + Blueprint-based routing, HMAC-verified webhook ingress, idempotency keys, async task hand-off, and replayable dead-letter storage.",
    outcome:
      "Zero duplicated side-effects under retry storms, and every inbound event is recoverable from storage.",
    stack: ["Python", "Flask", "Celery / RQ", "PostgreSQL"],
    signals: ["Idempotency keys", "HMAC verify", "Dead-letter replay"],
    domain: "Backend Engineering",
    year: "2024",
    role: "Backend",
  },
  {
    slug: "auth-and-quota",
    name: "Auth, Tenancy & Quota Layer",
    tagline:
      "Re-usable authorisation + per-tenant rate/quota module for AI APIs.",
    problem:
      "Exposing LLM endpoints without hard quotas invites cost blowouts and noisy-neighbour outages.",
    approach:
      "JWT auth, tenant-scoped API keys, token-bucket rate limits in Redis, and per-tenant monthly quotas with graceful 429s and usage webhooks.",
    outcome:
      "Predictable spend and clean tenant isolation — the boring infra that makes an AI product sellable.",
    stack: ["Python", "FastAPI", "Redis", "PostgreSQL"],
    signals: ["Token bucket", "Tenant isolation", "Graceful degradation"],
    domain: "Backend Engineering",
    year: "2024",
    role: "Backend",
  },
];

export const pipelineProjects: Project[] = [
  {
    slug: "etl-contract-pipeline",
    name: "Contract-First ETL Pipeline",
    tagline:
      "Extract → Validate → Transform → Load with typed contracts and automatic drift alerts.",
    problem: "Silent schema drift breaking dashboards without anyone noticing.",
    approach:
      "Pydantic schemas at every hop, contract diff on each run, and alerting when inbound payloads no longer satisfy the schema.",
    outcome: "Data consumers trust freshness and shape — not just row count.",
    stack: ["Python", "PostgreSQL", "Pandas / Polars", "Pydantic"],
    signals: ["Schema contracts", "Drift alerts"],
    domain: "Data Pipelines",
    year: "2025",
    role: "Data engineering",
  },
  {
    slug: "document-intelligence",
    name: "Document Intelligence Pipeline",
    tagline:
      "OCR + LLM extraction pipeline that turns PDFs into structured, queryable records.",
    problem:
      "Unstructured PDFs (invoices, policies, forms) blocked automation.",
    approach:
      "Chunked OCR, structured-output LLM extraction with JSON schema, confidence scoring, and human-in-the-loop review queue for low-confidence rows.",
    outcome:
      "High-confidence extractions flow straight through; low-confidence ones are surfaced for review — never silently wrong.",
    stack: ["Python", "FastAPI", "OCR", "OpenAI structured outputs", "Postgres"],
    signals: ["Structured extraction", "Confidence gating", "HITL queue"],
    domain: "Data Pipelines · AI",
    year: "2025",
    role: "Pipeline design",
  },
  {
    slug: "scheduler-and-backfills",
    name: "Scheduler & Backfill Framework",
    tagline:
      "Cron + backfill engine with per-job idempotency, SLIs, and replayable windows.",
    problem:
      "Backfills are usually one-off scripts that break production and can't be re-run safely.",
    approach:
      "Each job declares a window, idempotency key, and SLI targets. Backfills are just replays of windows — same code path as scheduled runs.",
    outcome: "Backfills are boring. That's the feature.",
    stack: ["Python", "PostgreSQL", "Cron / workers"],
    signals: ["Idempotent windows", "Unified run path"],
    domain: "Data Pipelines",
    year: "2024",
    role: "Platform",
  },
];

export const additionalProjects: Project[] = [
  {
    slug: "portfolio-platform",
    name: "Portfolio Platform",
    tagline: "This site — Next.js 14 App Router, typed, performance-budgeted.",
    problem: "Static portfolios read as generic. Engineers ship systems.",
    approach:
      "Built as a Next.js 14 App Router project with strict TS, content-as-data, semantic sections, accessible nav, and Lighthouse-minded styling.",
    outcome: "Loads fast, reads like a system, not a CV.",
    stack: ["Next.js 14", "TypeScript", "Tailwind"],
    signals: ["App Router", "Typed content", "A11y"],
    domain: "Frontend",
    year: "2025",
    role: "Full-stack",
  },
  {
    slug: "internal-cli",
    name: "Internal Developer CLI",
    tagline:
      "Python CLI that wraps common ops flows (deploys, seeds, evals) with typed subcommands.",
    problem: "Tribal-knowledge scripts scattered across repos.",
    approach:
      "Single typed CLI with subcommands, dry-run mode, and shared config — one tool, one mental model.",
    outcome: "New engineers productive on day one.",
    stack: ["Python", "Typer / Click"],
    signals: ["Dry-run", "Typed subcommands"],
    domain: "DX",
    year: "2024",
    role: "Tooling",
  },
];

export const engineeringApproach = [
  {
    title: "API Design",
    body: "Contract-first with FastAPI / Flask. Pydantic models at the edges, OpenAPI as the source of truth, consistent error envelopes, versioned routes. A new endpoint should feel like the last one.",
  },
  {
    title: "LLM Integration Patterns",
    body: "Treat the model as a fallible dependency. Structured outputs, JSON-schema validation, retries with jitter, typed tool registries, and golden-set evals gating prompt or model changes.",
  },
  {
    title: "Agent Orchestration",
    body: "Planner / Executor / Critic loops with idempotent steps, typed tool calls, shared memory, and replayable traces. Every step is an event — so runs can be resumed, audited, or debugged offline.",
  },
  {
    title: "Data Pipelines",
    body: "Contract-first ETL with Pydantic, drift detection, quarantine tables for bad rows, and per-job SLIs (freshness, completeness). Backfills are just replays of windowed runs.",
  },
  {
    title: "Reliability & Error Handling",
    body: "Idempotency keys, dead-letter queues, circuit breakers around model and tool calls, structured logs with trace IDs, and graceful 429s before clients fall off a cliff.",
  },
  {
    title: "Observability",
    body: "Structured JSON logs, request-scoped trace IDs across services, per-tenant cost & latency telemetry for LLM calls, and dashboards keyed to user-visible SLOs — not infra vanity metrics.",
  },
];

/**
 * Qualitative capability signals — no numeric counters.
 * Each entry describes a discipline, not a count.
 */
export const capabilities = [
  {
    label: "Agentic AI",
    body: "Planner / executor / critic loops, typed tool calling, replayable runs.",
  },
  {
    label: "Applied LLM Workflows",
    body: "RAG, structured outputs, eval harnesses, prompt + model versioning.",
  },
  {
    label: "Python Backends",
    body: "FastAPI / Flask services with typed contracts, auth, and observability.",
  },
  {
    label: "Data Pipelines",
    body: "Contract-first ingestion with drift detection and per-job SLIs.",
  },
];

export const profile = {
  name: "Mike S Ncube",
  shortName: "Mike",
  location: "Zimbabwe · South Africa",
  email: "mikencube03@gmail.com",
  avatar: "/Mike_Org.jpeg",
  portrait: "/Mike_Org.jpeg",
  headline: "AI Engineer",
  subHeadline:
    "Agentic AI & Applied LLM Workflows · Python Backends (Flask / FastAPI) · Data Pipelines",
  oneLiner:
    "I design and build agentic AI systems, applied LLM workflows, and Python backends (Flask / FastAPI) — with data pipelines wired in end-to-end.",
  availability: "Available for AI engineering roles",
  tags: [
    "AI Engineer",
    "Agentic AI",
    "Applied LLM Workflows",
    "Python Backends",
    "Data Pipelines",
  ],
};

export const navSections = [
  { id: "flagship", label: "Flagship" },
  { id: "agentic", label: "Agentic AI" },
  { id: "backend", label: "Backend" },
  { id: "pipelines", label: "Pipelines" },
  { id: "approach", label: "Approach" },
  { id: "contact", label: "Contact" },
];
