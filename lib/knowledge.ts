// Knowledge base for the portfolio RAG assistant.
// All facts sourced from Mike's CV (Mike-Ncube-CV-revised) and public repos.
// Never invent metrics, users, clients, or dates.

export type KnowledgeChunk = {
  id: string;
  title: string;
  sourceUrl: string;
  text: string;
  keywords?: string[];
};

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'positioning',
    title: 'Who Mike is',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike S Ncube is an Applied AI Engineer and Systems Architect based in Johannesburg, South Africa. He works at Zororo-Phumulani Funeral Assurance (FSP 48558), where he has been the sole AI engineer in a four-person IT team since 2022, building the organisation\'s AI capability from zero. Six-plus years in software, about three focused on generative AI. Remote-first. Contact: mikencube03@gmail.com.',
  },
  {
    id: 'employer',
    title: 'Zororo-Phumulani — employer and work context',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike\'s employer is Zororo-Phumulani Funeral Assurance (FSP 48558), a licensed South African financial services provider. Title: Applied AI Engineer and Systems Architect, 2022 to present. Sole AI engineer in a four-person IT team. Built the lead-management CRM, claims extraction pipeline, and Digi App Form while there. POPIA-aware design throughout. Works directly with non-technical staff, compliance, and executive stakeholders.',
  },
  {
    id: 'stack',
    title: "Mike's tech stack",
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'AI/LLM: RAG with Gemini embeddings, cosine retrieval, similarity gating, grounded generation with citations. LangGraph (prototype: state graphs with human approval gates). Anthropic Claude API, OpenAI API. Full-stack: Next.js, TypeScript, React. Backend: Python, FastAPI, Flask, JWT auth, server-side session revocation. Data: PostgreSQL, pgvector hybrid search, Redis, Celery, SQLAlchemy, Alembic. Cloud: AWS (S3, EC2, IAM, CloudWatch, Bedrock). Infra: Docker, GitHub Actions, pytest, Railway.',
  },
  {
    id: 'availability',
    title: 'Availability and target roles',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike is available for full-time or contract, remote-first from South Africa. Target roles: Applied AI Engineer, Generative AI Engineer, AI Solutions Engineer, Software Engineer (AI Systems), AI Automation Engineer. Contact: mikencube03@gmail.com, github.com/MikeNcube, linkedin.com/in/mike-ncube-669563a7.',
  },
  {
    id: 'portfolio-rag-assistant',
    title: 'Portfolio RAG assistant (live demo)',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: "The portfolio RAG assistant is Mike's primary public AI proof. Pipeline: Gemini embedding-001 batch-embeds the knowledge base once per server instance. Each query is embedded separately. Cosine similarity retrieves top-6 chunks. Chunks below 0.35 similarity are discarded. If embeddings fail, BM25 keyword search over the same chunks is used. Gemini 2.5 Flash generates grounded answers with thinking tokens disabled (thinkingBudget:0); if Gemini errors or is rate-limited, Groq openai/gpt-oss-120b is used (fallback openai/gpt-oss-20b) with the same prompt and citations; if both fail, a static CV answer for the closest suggested question is served. Distributed per-IP limit (20 req/10min) via Upstash Redis when configured; otherwise a per-instance cap. Grounding prompt is server-side only. Source code: lib/rag.ts, lib/answer.ts, app/api/chat/route.ts, lib/knowledge.ts.",
  },
  {
    id: 'zororo-crm',
    title: 'Lead-management CRM (production, Zororo-Phumulani)',
    sourceUrl: 'https://github.com/MikeNcube',
    keywords: [
      'production systems',
      'shipped',
      'CRM',
      'Zororo',
      'Zororo-Phumulani',
      '40 users',
      '10 roles',
      'lead-management',
    ],
    text: "Shipped production system at Zororo-Phumulani Funeral Assurance: lead-management CRM used by over 40 people across around 10 roles. Deterministic lead grading, strict round-robin routing rules, role-based access, server-side session revocation, and an adapter isolating the policy system of record so a live integration change touches one file. FastAPI, PostgreSQL, Redis, Celery, Docker, reversible additive migrations, full test suite. Private codebase — architecture walk-through available in interview.",
  },
  {
    id: 'claims-pipeline',
    title: 'Claims document extraction pipeline (Zororo-Phumulani)',
    sourceUrl: 'https://github.com/MikeNcube',
    keywords: [
      'production systems',
      'shipped',
      'claims extraction',
      'Zororo',
      'Zororo-Phumulani',
    ],
    text: 'Claims document extraction pipeline built at Zororo-Phumulani — a production-ready system pending management approval. Claude vision extraction validated through Pydantic schemas, with per-field confidence scoring and a needs-review flag for human verification. Private codebase.',
  },
  {
    id: 'digi-app-form',
    title: 'Digi App Form — regulated insurance intake (Zororo-Phumulani)',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Digi App Form: full-stack Flask web application for regulated funeral-assurance intake at Zororo-Phumulani. Multi-step intake form, server-side validation before anything is persisted, automated policy-PDF generation, supporting-document upload handling, staff admin dashboard, and a scheduled backup routine. Stack: Python, Flask, SQLite, Docker. Status: shipped.',
  },
  {
    id: 'sitewarden',
    title: 'Sitewarden — governed AI operations platform (prototype)',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Sitewarden is a governed AI operations platform prototype. FastAPI backend. LangGraph state graph with plan, analyse, self-check, write-report, await-approval, and revise steps. Role-scoped steps, human interrupt approval before consequential actions, Postgres checkpoints. Risk-tiered tool gateway, MCP-style JSON-RPC endpoint. pgvector hybrid keyword and vector search with citations. 89 tests, retrieval and trajectory evals, CI with import rules. Prototype, not deployed.',
  },
  {
    id: 'cube-agent',
    title: 'Cube — coding agent (prototype)',
    sourceUrl: 'https://github.com/MikeNcube',
    keywords: [
      'Cube',
      'coding agent',
      'tool-calling loop',
      'provider-agnostic',
      'sandboxed eval',
    ],
    text: "Cube is a coding agent prototype. Own tool-calling loop, provider-agnostic adapters (swap model without changing business logic), approval prompts before writes, and a sandboxed eval harness with a trusted verifier to check agent outputs. Prototype, not deployed.",
  },
  {
    id: 'proactive-sentinel-overview',
    title: 'Proactive Sentinel — multi-tenant SOC platform',
    sourceUrl: 'https://github.com/MikeNcube/proactive-sentinel',
    text: 'Proactive Sentinel is a Python backend (not an LLM product): multi-tenant SOC for financial services. v1.0.0, deployed to Railway for evaluation with PostgreSQL 15 and Redis 7; currently paused. Ingests events, SHA-256 dedup in Redis, MITRE ATT&CK chain correlation, automated IP blocking and audit entries. 44 passing tests.',
  },
  {
    id: 'proactive-sentinel-tech',
    title: 'Proactive Sentinel — engineering details',
    sourceUrl: 'https://github.com/MikeNcube/proactive-sentinel',
    text: 'Stack: Python 3.11, Flask, JWT, AES-256-GCM PII encryption, PostgreSQL 15 + SQLAlchemy 2.0 + Alembic, Redis 7 dedup, OpenTelemetry, Railway + Docker + Gunicorn. POPIA: PII masking at ingest, immutable audit log, tenant isolation per request.',
  },
  {
    id: 'certifications',
    title: 'Training and certifications',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'AWS Training and Certification, AWS Skills Center, Becoming an AI Practitioner Series, Sep 2026: Introduction to AI; Introduction to Generative AI; Prompts and Working with Foundation Models. DeepLearning.AI: Retrieval-Augmented Generation (RAG), Generative AI with LLMs, Agentic AI, Introduction to Data Engineering, LangChain for LLM Application Development. No formal degree — capability evidenced by shipped systems and public GitHub portfolio.',
  },
  {
    id: 'engineering-approach',
    title: 'Engineering approach and philosophy',
    sourceUrl: 'https://github.com/MikeNcube',
    text: "Mike's engineering defaults: models are fallible dependencies (every LLM call gets validation, retries, and a fallback); every run is auditable (structured JSON logs, trace IDs, audit entries for state changes); pipelines are contracts (Pydantic schemas at system boundaries, validation before persistence); labels are honest (each repo is labelled production, prototype, or lab). Background in regulated financial services shaped a default-to-compliance approach.",
  },
  {
    id: 'interview-guide',
    title: 'How to evaluate Mike',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: 'Hiring managers can evaluate in about 30 minutes: (1) Try the live RAG assistant on his portfolio site — check that answers cite sources and refuse out-of-scope questions. (2) Read lib/rag.ts and app/api/chat/route.ts for retrieval and guardrails. (3) Skim the Proactive Sentinel README and 44 passing tests for backend platform depth. Mike is available for technical interviews and architecture walk-throughs of private-codebase work.',
  },
  {
    id: 'this-assistant',
    title: 'About this AI assistant',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: "This assistant is a RAG pipeline on Mike's Next.js portfolio. It answers questions grounded in a curated knowledge base, cites its sources, and refuses questions outside that scope. The grounding prompt is server-side, so the assistant cannot be instructed to ignore it via the chat input. Email: mikencube03@gmail.com.",
  },
  {
    id: 'recommender-pipeline',
    title: 'Recommender data pipeline (reference)',
    sourceUrl: 'https://github.com/MikeNcube/End-to-End-Recommender-System-Data-Pipeline',
    text: 'Reference architecture: Airflow DAGs, Great Expectations, AWS Kinesis/S3, Terraform, mock local mode. Labelled reference, not production.',
  },
  {
    id: 'aws-web-tier',
    title: 'Resilient web tier on AWS (lab)',
    sourceUrl: 'https://github.com/MikeNcube/Resilient-Web-Tier-on-AWS-ALB-Auto-Scaling',
    text: 'AWS lab: ALB, EC2 Auto Scaling, multi-AZ Flask, CloudWatch. Labelled lab, not production.',
  },
];
