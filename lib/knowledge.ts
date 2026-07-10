// Knowledge base for the portfolio RAG assistant.
// Every chunk is sourced from Mike's real, public material.

export type KnowledgeChunk = {
  id: string;
  title: string;
  sourceUrl: string;
  text: string;
};

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'positioning',
    title: 'Who Mike is',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike S Ncube is an AI Engineer focused on full-stack RAG and Python backends in regulated financial workflows — insurance, claims, and compliance-aware products. He works remote-first between Zimbabwe and South Africa. Engineering defaults: every model call is a fallible dependency, every run is auditable, every pipeline is a contract.',
  },
  {
    id: 'stack',
    title: "Mike's tech stack",
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'AI/LLM: RAG with Gemini embeddings, cosine retrieval, similarity gating (min score 0.35), grounded generation with citations. Agentic AI and LangChain are trained coursework — public proof is the live portfolio RAG assistant. Full-stack: Next.js, TypeScript, Python API routes, Flask. Backend: JWT auth, PostgreSQL, Redis, OpenTelemetry, Docker, Railway for production. Data: Airflow, Great Expectations, contract-first ETL (reference repo). Cloud: AWS via labelled labs (ALB, EC2, RDS, VPC, Terraform).',
  },
  {
    id: 'availability',
    title: 'Availability and target roles',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike is available for full-time or contract, remote-first. Target roles: Applied AI Engineer, AI Platform Engineer, Full-stack AI Engineer, Data Engineer (AI systems). Contact: mikencube03@gmail.com, github.com/MikeNcube, linkedin.com/in/mike-ncube-669563a7.',
  },
  {
    id: 'proof-points',
    title: 'Verifiable proof for recruiters',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: '30-second proof: (1) Live RAG demo on this site with citations and honest refusals. (2) Proactive Sentinel — 44 CI tests, v1.0.0, multi-tenant Flask on Railway, public repo. (3) Four public systems: RAG portfolio, SOC platform, insurance intake app, plus data/cloud reference and labs. Production deploys use Railway and Docker; AWS is demonstrated in labelled labs only.',
  },
  {
    id: 'portfolio-rag-assistant',
    title: 'This site RAG assistant (live demo)',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: 'The portfolio RAG assistant is Mike\'s primary public AI proof. Pipeline: Gemini embedding-001 batch-embeds the knowledge base once per server instance; each query is embedded separately; cosine similarity retrieves top-4 chunks; chunks below 0.35 similarity are discarded; Gemini 2.5 Flash generates grounded answers with source citations. Guardrails: 20 requests per IP per 10 minutes, 500 character input cap, server-side grounding prompt (no client system prompt), honest 503 when unconfigured. Code: lib/rag.ts, app/api/chat/route.ts, lib/knowledge.ts.',
  },
  {
    id: 'proactive-sentinel-overview',
    title: 'Proactive Sentinel: multi-tenant SOC platform',
    sourceUrl: 'https://github.com/MikeNcube/proactive-sentinel',
    text: 'Proactive Sentinel is a production Python backend (not an LLM product): multi-tenant SOC for financial services. v1.0.0 on Railway with PostgreSQL 15 and Redis 7. Ingests events, SHA-256 dedup in Redis, MITRE ATT&CK chain correlation, automated IP blocking and audit entries. 44 passing CI tests.',
  },
  {
    id: 'proactive-sentinel-tech',
    title: 'Proactive Sentinel: engineering details',
    sourceUrl: 'https://github.com/MikeNcube/proactive-sentinel',
    text: 'Stack: Python 3.11, Flask, JWT, AES-256-GCM PII encryption, PostgreSQL 15 + SQLAlchemy 2.0 + Alembic, Redis 7 dedup, OpenTelemetry, Railway + Docker + Gunicorn. POPIA: PII masking at ingest, immutable audit log, tenant isolation per request.',
  },
  {
    id: 'digi-app-form',
    title: 'Digi App Form: regulated insurance intake',
    sourceUrl: 'https://github.com/MikeNcube/digi-app-form',
    text: 'Digi App Form: full-stack Flask web app for regulated funeral-assurance intake — multi-step form, server-side validation, policy PDF generation, admin dashboard, file uploads, backups. Status: shipped. Stack: Python, Flask, SQLite, Docker.',
  },
  {
    id: 'zororo-wwf-platform',
    title: 'Zororo Phumulani platform (private client)',
    sourceUrl: 'https://mikencube.github.io/#projects',
    text: 'Private client insurance onboarding platform: 7-step workflow (identity, consent, payments, PDF policy, SMTP, audit logging) on Railway. Code is private — Mike offers architecture walk-through in interview.',
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
  {
    id: 'rds-lab',
    title: 'RDS connectivity lab',
    sourceUrl: 'https://github.com/MikeNcube/cloud-project-board-rds-connectivity-lab',
    text: 'AWS lab: EC2 to RDS PostgreSQL troubleshooting — VPC, security groups, boto3.',
  },
  {
    id: 'zororo-crm-platform',
    title: 'Zororo CRM: call centre lead-management platform (private client)',
    sourceUrl: 'internal project — details on request',
    text: 'Mike is Lead Architect and Primary AI Engineer for a lead-management CRM for a funeral-assurance call centre, designing and leading development using AI-assisted engineering workflows: FastAPI backend, PostgreSQL for lead and agent records. Covers lead intake, assignment, and follow-up tracking for call centre agents. Private codebase — Mike offers an architecture walk-through in interview.',
  },
  {
    id: 'document-intelligence-claims-rag',
    title: 'Document intelligence for claims: RAG-based routing (private client)',
    sourceUrl: 'internal project — details on request',
    text: 'Mike built a document-intelligence pipeline that reads policy documents, classifies them, and routes each to the correct handling path. Low-confidence or ambiguous extractions are routed to a human review workflow before approval, while higher-confidence cases continue according to configured business rules. Same RAG-and-retrieval pattern as this site\'s assistant, applied to structured insurance documents rather than a knowledge base. Private codebase — Mike offers an architecture walk-through in interview.',
  },
  {
    id: 'production-engineering-compliance',
    title: 'Production engineering under regulation',
    sourceUrl: 'internal project — details on request',
    text: 'Mike\'s production work sits inside a regulated financial services provider, so builds default to POPIA-aligned data handling and audit logging on key actions. Production deployment and CI/CD practices are implemented where appropriate, with automated pipelines on supported platforms and manual deployment workflows where still under active development.',
  },
  {
    id: 'certifications',
    title: 'Certifications',
    sourceUrl: 'https://mikencube.github.io/#skills',
    text: 'Core: RAG, Generative AI with LLMs, Agentic AI (DeepLearning.AI). Supporting: LangChain for LLM Applications, AWS Generative AI Introduction, AWS ML Foundations. Agentic AI is coursework — public shipped proof is the RAG demo and production Python backends.',
  },
  {
    id: 'engineering-philosophy',
    title: 'Engineering approach',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Models are fallible dependencies. Runs are auditable. Pipelines are contracts. Every repo is labelled production, reference, or lab.',
  },
  {
    id: 'interview-guide',
    title: 'How to evaluate Mike before interviewing',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: 'Hiring managers can evaluate in ~30 minutes: (1) Try the live RAG demo — check citations and refusals. (2) Read lib/rag.ts and app/api/chat/route.ts for retrieval and guardrails. (3) Skim proactive-sentinel README and CI tests for production backend depth.',
  },
  {
    id: 'this-assistant',
    title: 'About this AI assistant',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: 'This assistant is a RAG pipeline on Mike\'s Next.js portfolio. It cites sources and refuses when the knowledge base does not cover a question. Email: mikencube03@gmail.com.',
  },
];
