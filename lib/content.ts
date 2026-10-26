// All facts sourced from Mike-Ncube-CV-revised.pdf.
// Never invent metrics, users, clients, or dates.

export type ProjectStatus =
  | "Live demo"
  | "Shipped"
  | "Rolling out"
  | "Approved · standby"
  | "Prototype"
  | "Paused"
  | "Reference"
  | "Lab"
  | "Built";

export const WORK_ORDER = [
  "digi-app-form",
  "zororo-crm",
  "zdi-signature-workflow",
  "zororo-ai-os",
  "zororo-claims",
  "ai-social-agent",
  "portfolio-rag-assistant",
  "sitewarden",
  "cube-agent",
  "claims-pipeline",
  "proactive-sentinel",
] as const;

export const PRODUCTION_SLUGS = [
  "digi-app-form",
  "zororo-crm",
  "zdi-signature-workflow",
] as const;

export type WorkSection = "ai-proof" | "platform" | "client";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  workSection: WorkSection;
  role: string;
  problem: string;
  built: string;
  outcome: string;
  stack: string[];
  status: ProjectStatus;
  domain: string;
  year: string;
  repoUrl?: string;
  privateRepo?: boolean;
  demoUrl?: string;
  demoLabel?: string;
  systemOverview?: string;
  engineeringDecisions?: string[];
};

export const flagshipProjects: Project[] = [
  {
    slug: "portfolio-rag-assistant",
    name: "Portfolio RAG Assistant",
    tagline:
      "A retrieval-augmented assistant with grounded answers and clickable source citations. Try it on the home page.",
    workSection: "ai-proof",
    role: "Sole builder — Next.js, API routes, RAG pipeline",
    problem:
      "Most portfolios claim RAG experience. Almost none let a hiring manager verify it live. A working retrieval pipeline that cites sources and refuses out-of-scope questions is the honest proof.",
    built:
      "A RAG pipeline inside this Next.js site: a knowledge base curated from my real repos and CV, embedded with Gemini embeddings, retrieved by cosine similarity (top 6), and answered by Gemini grounded only in the retrieved chunks. Thinking tokens disabled to prevent budget exhaustion on free tier. Input-validated, with a distributed per-IP limit when Redis is configured, and answers refuse gracefully when nothing relevant is found.",
    outcome:
      "A live, inspectable RAG demo. Open devtools, read the network calls, click the citations. Knowledge base and retrieval code are public in this repo.",
    engineeringDecisions: [
      "Every knowledge chunk carries a sourceUrl, and the API returns sources with each answer — citations are part of the contract, not decoration.",
      "A minimum-similarity threshold gates generation: below it the assistant says it does not know rather than letting the model improvise.",
      "The grounding prompt is server-side. The chat input cannot override it.",
      "Thinking tokens are disabled (thinkingBudget:0) on gemini-2.5-flash to prevent thinking from consuming the entire output budget on the free tier.",
      "Knowledge-base embeddings are computed once per server instance and cached; only the query is embedded per request.",
    ],
    stack: ["Next.js", "TypeScript", "Gemini embeddings", "Cosine retrieval", "Resend"],
    status: "Live demo",
    domain: "RAG · Full-stack AI",
    year: "2026",
    repoUrl: "https://github.com/MikeNcube/mike-portfolio",
    demoUrl: "/#assistant",
    demoLabel: "Try it above",
  },
  {
    slug: "sitewarden",
    name: "Sitewarden",
    tagline:
      "Governed AI operations platform (prototype): LangGraph state graph with human approval gates, Postgres checkpoints, risk-tiered tool gateway, and pgvector hybrid retrieval with citations.",
    workSection: "ai-proof",
    role: "Sole builder — prototype, not deployed",
    problem:
      "Autonomous AI agents that write to production systems need structured approval workflows — not post-hoc logging. The challenge is building a state graph where a human can interrupt, review, and approve before any consequential action proceeds.",
    built:
      "FastAPI backend. LangGraph state graph: plan, analyse, self-check, write-report, await-approval, revise. Role-scoped steps so only authorised roles can approve. Human interrupt approval before any write. Postgres checkpoints for durable state across restarts. Risk-tiered tool gateway (read tools always allowed, write tools require approval). MCP-style JSON-RPC endpoint. pgvector hybrid keyword and vector search with citations. 89 tests. Retrieval and trajectory evals. CI with import rules.",
    outcome:
      "89 tests passing. Retrieval and trajectory evals. CI enforces import rules. Prototype — demonstrates governed agent design patterns.",
    systemOverview:
      "The state graph runs: plan (decompose goal) → analyse (gather facts via read tools) → self-check (verify plan completeness) → write-report (draft output) → await-approval (human interrupt: approve or revise) → revise (iterate on human feedback). The risk-tiered gateway classifies each tool call: read-only tools proceed automatically; write tools (file system, API mutations) require approval before execution. Postgres checkpoints mean the graph can resume after a process restart without re-running completed steps.",
    engineeringDecisions: [
      "Human interrupt approval is a first-class graph node, not an afterthought — the graph cannot proceed past await-approval without explicit human input.",
      "Postgres checkpoints make the approval workflow durable: a server restart does not lose pending approvals or completed steps.",
      "Risk-tiered gateway keeps read tools fast (no approval latency) while requiring explicit approval only for write operations.",
      "pgvector hybrid search combines dense vector similarity with BM25 keyword matching, then attaches source citations to every retrieved chunk.",
      "Retrieval evals measure recall at k; trajectory evals verify that the agent chose the right tool sequence for each test scenario.",
    ],
    stack: ["Python", "FastAPI", "LangGraph", "PostgreSQL", "pgvector", "pytest"],
    status: "Prototype",
    domain: "Governed AI · LangGraph",
    year: "2026",
  },
  {
    slug: "cube-agent",
    name: "Cube",
    tagline:
      "Coding agent (prototype): own tool-calling loop, provider-agnostic adapters, approval prompts before writes, sandboxed eval harness.",
    workSection: "ai-proof",
    role: "Sole builder — prototype",
    problem:
      "Coding agents that write files without approval are not safe for production use. The design challenge is a loop that calls tools, surfaces results for review, and requires explicit approval before any write.",
    built:
      "A coding agent with its own tool-calling loop (not relying on a framework's built-in loop). Provider-agnostic adapters mean the model can be swapped without changing business logic. Approval prompts surface every proposed write for human review before execution. A sandboxed eval harness with a trusted verifier checks agent outputs against expected results without running arbitrary model-generated code in the host environment.",
    outcome:
      "Working prototype demonstrating provider-agnostic agent design and sandboxed evaluation. Not deployed.",
    engineeringDecisions: [
      "Provider-agnostic adapters isolate the model API behind a stable interface — changing from Claude to GPT touches one file.",
      "Approval prompts for writes mean the agent cannot silently modify files; every proposed change is reviewed before execution.",
      "Sandboxed eval harness runs agent outputs through a trusted verifier rather than executing model-generated code directly.",
    ],
    stack: ["Python", "Anthropic Claude API", "OpenAI API", "pytest"],
    status: "Prototype",
    domain: "Agentic AI · Prototype",
    year: "2026",
  },
  {
    slug: "zororo-crm",
    name: "Lead-Management CRM",
    tagline:
      "Production CRM at Zororo-Phumulani Funeral Assurance: used by over 40 people across around 10 roles. FastAPI, PostgreSQL, Redis, Celery, Docker.",
    workSection: "platform",
    role: "Sole AI engineer — production system at employer (Zororo-Phumulani)",
    problem:
      "A licensed South African funeral-assurance call centre needed a CRM that enforced deterministic lead grading and strict round-robin routing — not a suggestion, but a business rule that the system guarantees.",
    built:
      "FastAPI backend with PostgreSQL for lead and agent records. Deterministic lead grading (rules-based, not ML). Strict round-robin routing that cannot be bypassed. Role-based access across around 10 roles. Server-side session revocation. An adapter isolating the policy system of record so a live integration change touches one file. Reversible additive migrations. Full test suite. Redis and Celery for async tasks. Docker deployment.",
    outcome:
      "Production system used by over 40 people at Zororo-Phumulani Funeral Assurance. Private codebase — architecture walk-through available in interview.",
    engineeringDecisions: [
      "Deterministic lead grading (rules, not ML) because in a regulated product the grading logic must be auditable and explainable to compliance staff.",
      "The policy system is isolated behind an adapter: a live integration change touches one file, not spread calls across the codebase.",
      "Server-side session revocation allows immediate access termination without waiting for token expiry — required for a multi-role regulated environment.",
      "Reversible additive-only migrations so any schema change can be rolled back without data loss.",
    ],
    stack: ["Python", "FastAPI", "PostgreSQL", "Redis", "Celery", "Docker"],
    status: "Shipped",
    domain: "Production · CRM",
    year: "2022–present",
  },
  {
    slug: "zdi-signature-workflow",
    name: "ZDI — Signature & Approval Workflow",
    tagline:
      "Evidence-grade e-signatures and a requester → manager → Accounts approval workflow, built as the second domain of Zororo Document Intelligence. Append-only, hash-chained signing events.",
    workSection: "platform",
    role: "Lead architect — approved for production rollout at Zororo-Phumulani",
    problem:
      "Internal requisitions ran on paper and email. A signature pasted onto a PDF proves nothing about who approved what, on which version, or in what capacity — and in a regulated insurer, an approval you cannot evidence is an audit finding.",
    built:
      "A reusable Signature Service and requisition workflow on FastAPI, PostgreSQL and Next.js. A manager sends a requester a single-use, expiring secure link; the requester completes the form, attaches a quotation and signs. The request returns to that manager to approve and sign, return with a reason, or reject; only then can Accounts act, sign off, or return it for correction. Every signature is a row in an append-only, hash-chained signing-event table that binds the signer, their role and capacity at signing, explicit intent, the method (drawn, captured or typed), and a SHA-256 of the exact content revision. On final approval a background worker renders an archival PDF with an evidence appendix. Separate Manager, Accounts and IT workspaces plus a Management App share one backend and one routing contract, with capability-based access control and segregation of duties.",
    outcome:
      "Approved for production rollout at Zororo-Phumulani. Rollout starting soon. 525 backend tests on SQLite, Postgres-only suites and both front-end test suites passing. ZDI never pays, never produces a bank file and never marks anything as paid. Private codebase — walk-through available in interview.",
    systemOverview:
      "Requester (secure link, no login) → submit + sign → manager review (approve & sign / return / reject) → Accounts review (approve & sign / return / reject / forward to a colleague) → archive_pending → worker renders PDF, stores it, hashes it → archived. A return issues a correction link; the resubmission becomes a new revision and the route restarts, so an approval of revision 1 never carries over to revision 2. Each step writes the mutable requisition status, an append-only workflow event and an append-only audit event in the same transaction; notifications go through a transactional outbox so a mail outage cannot block an approval. An evidence check recomputes the signing events, event hashes, document hash, attachment and PDF hashes on demand.",
    engineeringDecisions: [
      "A signature is a record, not an image: signer, role and capacity at signing, explicit intent, method, timestamp and a SHA-256 of the canonical content are bound into one append-only, hash-chained event.",
      "Two independent tamper-evidence layers: database triggers reject UPDATE and DELETE on evidence tables, and a global hash chain detects changes made outside the database.",
      "Signers bind a canonical, fixed-precision form of the content, not the PDF bytes — so re-rendering never breaks verification.",
      "When two parallel signature designs grew in separate working copies, they were reconciled in an ADR: one canonical signing-event mechanism, with the stricter evidence checklist and intent rule carried forward.",
      "Workflow state is mutable; evidence is append-only. Corrections create a new revision and new events — history is superseded, never edited.",
      "Routing is configuration, not department if-statements, so later approval workflows are data, not new code.",
      "Segregation of duties uses two mechanisms: a capability table (fails closed on unknown capabilities) and workflow guards for rules a role cannot express, e.g. a requester can never approve their own request.",
      "Honest about limits: the evidence is tamper-evident within the database's controls, not a cryptographically signed PDF; no AI touches approvals or payments.",
    ],
    stack: ["Python", "FastAPI", "PostgreSQL", "Alembic", "Next.js", "TypeScript", "reportlab", "Docker", "pytest", "Vitest"],
    status: "Rolling out",
    domain: "Governed workflow · E-signature evidence",
    year: "2026",
  },
  {
    slug: "zororo-ai-os",
    name: "Zororo AI OS",
    tagline:
      "Governed AI control plane: every event passes Presidio PII detection, an OPA policy check, risk scoring, then ALLOW / MONITOR / APPROVE / BLOCK, with a hash-chained audit log.",
    workSection: "platform",
    role: "Sole builder — early stage, not deployed",
    problem:
      "Claims, policy changes, LLM queries and tool calls each need the same governed path. If any control fails, the event must not proceed.",
    built:
      "A fixed pipeline every event passes: PII detection with Microsoft Presidio, plus custom recognizers for South African ID, Zimbabwe national ID and asylum/refugee permits; an OPA (Rego) policy check; risk scoring from fixed rules plus anomaly statistics; a decision of ALLOW / MONITOR / APPROVE / BLOCK; then a tamper-evident, hash-chained audit log. If any step fails, the event is blocked by default. An MCP gateway uses capability tokens and replay protection.",
    outcome:
      "Built. Early stage, not deployed. README reports 310 passing tests, including pytest and Rego policy tests. LangGraph and pgvector are planned. Private repo.",
    systemOverview:
      "Every event (claims, policy changes, LLM queries, tool calls) enters one pipeline: PII detection → OPA policy check → risk scoring → ALLOW / MONITOR / APPROVE / BLOCK → hash-chained audit log. Fail closed. MCP gateway: capability tokens and replay protection.",
    engineeringDecisions: [
      "One fixed pipeline for every event type, so claims, policy changes, LLM queries and tool calls share the same controls.",
      "PII detection uses Microsoft Presidio plus custom recognizers for South African ID, Zimbabwe national ID and asylum/refugee permits.",
      "OPA (Rego) is the policy check; pytest and Rego policy tests are both in the suite.",
      "Risk scoring combines fixed rules with anomaly statistics, then emits ALLOW, MONITOR, APPROVE or BLOCK.",
      "The audit log is tamper-evident and hash-chained.",
      "If any step fails, the event is blocked by default.",
      "The MCP gateway uses capability tokens and replay protection.",
      "LangGraph and pgvector are planned; they are not in the running system.",
    ],
    stack: ["Python 3.12", "FastAPI", "Presidio", "OPA/Rego", "Pydantic", "Terraform", "pytest"],
    status: "Built",
    domain: "Governed AI · Control plane",
    year: "2026",
    privateRepo: true,
  },
  {
    slug: "zororo-claims",
    name: "Claims operations platform",
    tagline:
      "Role-based platform for funeral-case processing: claims, cash services and courtesy services. Approved, production-ready standby (failover) for the company's live claims system at Zororo-Phumulani.",
    workSection: "platform",
    role: "Approved, production-ready standby (failover) for the company's live claims system at Zororo-Phumulani",
    problem:
      "Funeral-case processing needs role-based claims, cash services and courtesy services, with department hand-offs and a standby if the current claims system fails.",
    built:
      "A role-based platform for funeral-case processing: claims, cash services and courtesy services. A case state machine with hand-offs between departments, plus role- and shift-based routing. PII encrypted at the app layer and masked by default on list views, with an audit log of who read PII. Access is enforced at both the middleware and API layers. A public case-tracking link and compliance exports. POPIA-aware design.",
    outcome:
      "Approved, production-ready standby (failover) for the company's live claims system at Zororo-Phumulani. Private repo.",
    systemOverview:
      "Roles and shifts route into a case state machine with department hand-offs across claims, cash services and courtesy services. PII is encrypted at the app layer, masked by default on list views, and every PII read is audited. Middleware and API layers both enforce access. A public case-tracking link and compliance exports sit beside the staff workspace.",
    engineeringDecisions: [
      "The platform is a failover for the current claims system, not a replacement that is live today.",
      "A case state machine plus role- and shift-based routing handles department hand-offs.",
      "PII is encrypted at the app layer and masked by default on list views; who read PII is written to an audit log.",
      "Access is enforced at both the middleware and API layers.",
      "A public case-tracking link and compliance exports support POPIA-aware operations.",
    ],
    stack: ["Next.js", "TypeScript", "NextAuth", "Prisma", "PostgreSQL", "Docker"],
    status: "Approved · standby",
    domain: "Insurance · Case operations",
    year: "2026",
    privateRepo: true,
  },
  {
    slug: "ai-social-agent",
    name: "Multi-agent content pipeline",
    tagline:
      "Three agents (research, strategy, content) turn signals from GitHub, ArXiv and O'Reilly into platform-ready posts. Local Ollama; nothing is scheduled until a human approves it.",
    workSection: "ai-proof",
    role: "Sole builder — prototype",
    problem:
      "Research signals need to become platform-ready posts without API spend, and without publishing until a human approves.",
    built:
      "Three agents (research, strategy, content) turn signals from GitHub, ArXiv and O'Reilly into platform-ready posts. Runs on local Ollama at zero API cost. Nothing is scheduled until a human approves it in a FastAPI dashboard. Versioned prompt templates; evals are in progress.",
    outcome:
      "Prototype. Local Ollama at zero API cost. Nothing is scheduled until a human approves it. Versioned prompt templates; evals are in progress. Private repo.",
    systemOverview:
      "Signals from GitHub, ArXiv and O'Reilly feed a research agent, then a strategy agent, then a content agent. Output waits in a FastAPI dashboard. A human must approve before anything is scheduled. Local Ollama. Versioned prompt templates.",
    engineeringDecisions: [
      "Three specialised agents (research, strategy, content) rather than one mixed prompt.",
      "Local Ollama keeps API cost at zero.",
      "Nothing is scheduled until a human approves it in the FastAPI dashboard.",
      "Prompt templates are versioned. Evals are in progress.",
    ],
    stack: ["Python", "FastAPI", "Jinja2", "Ollama", "Docker", "n8n"],
    status: "Prototype",
    domain: "Agents · Content pipeline",
    year: "2026",
    privateRepo: true,
  },
  {
    slug: "claims-pipeline",
    name: "Claims Document Extraction",
    tagline:
      "Claude vision extraction through Pydantic schemas, per-field confidence scoring, and a needs-review flag for human verification. Built at Zororo-Phumulani.",
    workSection: "platform",
    role: "Sole builder — production-ready, pending management approval",
    problem:
      "Claims documents arrive as scanned PDFs. Manual data extraction is slow and error-prone; automated extraction without confidence checks is risky in a regulated environment where a wrong field value is a compliance problem.",
    built:
      "Claude vision extracts structured data from claims documents. Output is validated through Pydantic schemas — not free-form JSON. Each field carries a confidence score. Fields below threshold trigger a needs-review flag that routes the document to a human reviewer before any downstream processing. Built and ready for production at Zororo-Phumulani.",
    outcome:
      "Built and ready for production at Zororo-Phumulani Funeral Assurance. Pending management approval. Private codebase.",
    engineeringDecisions: [
      "Pydantic validation at the extraction boundary means any field the model cannot confidently extract fails explicitly rather than silently propagating a wrong value.",
      "Per-field confidence (not a single document-level score) lets the human reviewer see exactly which fields are uncertain rather than re-reviewing the whole document.",
      "Needs-review flag routes low-confidence documents to human review before any downstream processing — the model's uncertainty is part of the output contract.",
    ],
    stack: ["Python", "Anthropic Claude API", "Pydantic", "FastAPI"],
    status: "Built",
    domain: "Document AI · Insurance",
    year: "2026",
  },
  {
    slug: "digi-app-form",
    name: "Digi App Form",
    tagline:
      "Regulated insurance intake: multi-step form, server-side validation, policy PDF generation, and staff admin — for funeral-assurance workflows at Zororo-Phumulani.",
    workSection: "platform",
    role: "Sole builder — shipped at employer (Zororo-Phumulani)",
    problem:
      "Funeral-assurance intake was paper-driven: client details captured by hand, re-keyed, error-prone, and slow to become an issued policy. In a regulated product, every mistake is a compliance and audit problem.",
    built:
      "A multi-step web application with server-side validation before anything is persisted, durable submission storage, automated policy-PDF generation, supporting-document upload handling, an admin dashboard for staff review, and a scheduled backup routine.",
    outcome:
      "Shipped for Zororo-Phumulani funeral-assurance intake — validated intake and automated document generation. Supports the regulated onboarding workflow.",
    engineeringDecisions: [
      "Server-side validation is the gate — nothing reaches the datastore until the record is clean, because in a regulated product a bad record is an audit finding.",
      "Policy PDF generation is automated from the accepted application, removing the manual document-prep step.",
      "Uploads are stored and associated with the correct application, so the audit trail from submission to issued policy is complete.",
    ],
    stack: ["Python", "Flask", "SQLite", "Docker"],
    status: "Shipped",
    domain: "Insurance · Full-stack web",
    year: "2026",
  },
  {
    slug: "proactive-sentinel",
    name: "Proactive Sentinel",
    tagline:
      "Multi-tenant SOC platform: event ingestion, MITRE ATT&CK correlation, automated response, and POPIA-aware data handling. Deployed to Railway for evaluation; currently paused.",
    workSection: "platform",
    role: "Primary contributor — Flask backend platform",
    problem:
      "Financial-services providers need security monitoring that catches multi-stage attacks and business-signal anomalies without a heavyweight enterprise SIEM.",
    built:
      "A multi-tenant Flask backend that ingests events, deduplicates them in Redis by SHA-256 fingerprint, correlates MITRE ATT&CK techniques across events into chain alerts, and dispatches automated responses by severity. POPIA: PII masking at ingest, AES-256-GCM encrypted columns, immutable audit log, per-request tenant isolation.",
    outcome:
      "v1.0.0. Deployed to Railway for evaluation with PostgreSQL 15 and Redis 7; currently paused. 44 passing tests.",
    systemOverview:
      "Events route through a DetectionEngine (Redis dedup + MITRE correlation). After an alert is persisted, an Action Dispatcher fires by severity: critical alerts block the attacker IP in Redis and write an audit entry; lower severities degrade gracefully. Observability is OpenTelemetry plus structured JSON logs.",
    engineeringDecisions: [
      "SHA-256 fingerprint deduplication in Redis suppresses duplicate events at ingest, before they can create alert noise.",
      "MITRE ATT&CK chain correlation across events — recon followed by lateral movement followed by exfiltration escalates to a critical chain alert, which single-event rules would miss.",
      "Dispatcher failures are non-fatal: a Redis outage degrades response, never alert persistence.",
      "POPIA compliance at the data layer: SA and Zimbabwean IDs masked before storage, PII columns encrypted with AES-256-GCM.",
    ],
    stack: ["Python 3.11", "Flask", "PostgreSQL 15", "Redis 7", "SQLAlchemy 2.0", "Alembic", "OpenTelemetry", "Docker", "Railway"],
    status: "Paused",
    domain: "Security · Backend platform",
    year: "2026",
    repoUrl: "https://github.com/MikeNcube/proactive-sentinel",
  },
];

export const labProjects: Project[] = [
  {
    slug: "recommender-data-pipeline",
    name: "End-to-End Recommender Data Pipeline",
    tagline: "Contract-first data pipeline: Airflow, Great Expectations, AWS Kinesis/S3, Terraform.",
    workSection: "platform",
    role: "Sole builder — reference architecture",
    problem: "Retrieval systems are only as good as the data reaching them.",
    built: "ETL/ELT workflows with Airflow DAGs, data-quality gates with Great Expectations, AWS integration, Terraform, and a mock-services mode.",
    outcome: "Reference architecture showing contract-first pipeline design.",
    stack: ["Python", "Airflow", "Great Expectations", "AWS Kinesis / S3", "Terraform", "Pandas"],
    status: "Reference",
    domain: "Data Engineering · ML prep",
    year: "2025",
    repoUrl: "https://github.com/MikeNcube/End-to-End-Recommender-System-Data-Pipeline",
  },
  {
    slug: "aws-resilient-web-tier",
    name: "Resilient Web Tier on AWS",
    tagline: "Well-Architected lab: ALB + Auto Scaling + multi-AZ for a Flask service on EC2.",
    workSection: "platform",
    role: "Sole builder — hands-on lab",
    problem: "Demonstrating that a web tier can absorb instance failure and load spikes without downtime.",
    built: "ALB routing to EC2 instances in an Auto Scaling Group across availability zones, CloudWatch alarms driving scale-out/in.",
    outcome: "Working lab covering reliability, security, and cost trade-offs.",
    stack: ["AWS ALB", "EC2 Auto Scaling", "CloudWatch", "VPC", "IAM", "Flask"],
    status: "Lab",
    domain: "Cloud · AWS (lab)",
    year: "2025",
    repoUrl: "https://github.com/MikeNcube/Resilient-Web-Tier-on-AWS-ALB-Auto-Scaling",
  },
];

export const clientProjects: Project[] = [];

export const engineeringApproach = [
  {
    title: "Models are fallible dependencies",
    body: "Validation, retries, and a fallback path on every LLM call.",
  },
  {
    title: "Every run is auditable",
    body: "Structured logs, trace IDs, audit entries for state changes.",
  },
  {
    title: "Pipelines are contracts",
    body: "Pydantic schemas at boundaries, validation before persistence.",
  },
  {
    title: "Labels are honest",
    body: "Production, prototype, or lab — each repo says what it is.",
  },
];

export type Certification = {
  name: string;
  provider: string;
  tier: "core" | "supporting";
};

export const certifications: Certification[] = [
  { name: "Becoming an AI Practitioner Series", provider: "AWS Training · Sep 2026", tier: "core" },
  { name: "Retrieval-Augmented Generation (RAG)", provider: "DeepLearning.AI", tier: "core" },
  { name: "Generative AI with LLMs", provider: "DeepLearning.AI", tier: "core" },
  { name: "Agentic AI", provider: "DeepLearning.AI", tier: "core" },
];

export const interviewGuide = [
  {
    title: "Try the RAG assistant",
    time: "3 min",
    body: "Ask a question. Check that answers cite sources and refuse out-of-scope questions.",
    href: "/#assistant",
    label: "Open assistant",
  },
  {
    title: "Read the retrieval code",
    time: "10 min",
    body: "lib/rag.ts (embed + cosine top-6), app/api/chat/route.ts (similarity gate, rate limits, grounded prompt).",
    href: "https://github.com/MikeNcube/mike-portfolio/tree/main/lib",
    label: "View source",
  },
  {
    title: "Skim a backend platform",
    time: "15 min",
    body: "Proactive Sentinel README and 44 passing tests: multi-tenant Flask, Redis dedup, MITRE correlation.",
    href: "https://github.com/MikeNcube/proactive-sentinel",
    label: "Open repo",
  },
];

export const workSections = {
  "ai-proof": {
    title: "AI proof",
    description: "Inspectable AI engineering: live demo, governed agent prototype, and coding agent prototype.",
  },
  platform: {
    title: "Production systems",
    description: "Digi App Form, the lead-management CRM, and ZDI at Zororo-Phumulani.",
  },
  client: {
    title: "Client work",
    description: "Private codebase work.",
  },
} as const;

export const profile = {
  name: "Mike S Ncube",
  shortName: "Mike",
  location: "Johannesburg, South Africa",
  locationShort: "South Africa",
  email: "mikencube03@gmail.com",
  github: "https://github.com/MikeNcube",
  linkedin: "https://www.linkedin.com/in/mike-ncube-669563a7/",
  avatar: "/Mike_Org.jpeg",
  portrait: "/Mike_Org.jpeg",
  headline: "Applied AI Engineer",
  subHeadline: "Applied AI Engineer and Systems Architect · Zororo-Phumulani Funeral Assurance · 2022–present",
  oneLiner: "I build AI systems for regulated work.",
  availability: "Available · Johannesburg · Remote",
  role: "Applied AI Engineer",
};

export const navSections = [
  { id: "assistant", label: "Assistant" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export const allProjects: Project[] = [
  ...flagshipProjects,
  ...clientProjects,
  ...labProjects,
];

export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}

export function orderedWorkProjects(): Project[] {
  const bySlug = new Map(flagshipProjects.map((p) => [p.slug, p]));
  const ordered = WORK_ORDER.map((slug) => bySlug.get(slug)).filter(
    (p): p is Project => p !== undefined,
  );
  return [...ordered, ...clientProjects, ...labProjects];
}

export function getProjectNeighbours(slug: string): {
  prev: Project;
  next: Project;
} {
  const ordered = orderedWorkProjects();
  const i = ordered.findIndex((p) => p.slug === slug);
  const safe = i < 0 ? 0 : i;
  const prev = ordered[(safe - 1 + ordered.length) % ordered.length];
  const next = ordered[(safe + 1) % ordered.length];
  return { prev, next };
}
