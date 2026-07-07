// Knowledge base for the portfolio RAG assistant.
// Every chunk is sourced from Mike's real, public material: his GitHub profile
// README, project repository READMEs, and the copy he ships on his portfolio.
// Nothing here is invented; each chunk links to its verifiable source.

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
    text: 'Mike S Ncube is an AI Engineer focused on Agentic AI, RAG, and LLM backends in Python. He builds AI systems for environments where mistakes are expensive: insurance, claims, and regulated financial workflows. His background is regulated funeral-assurance and financial-services engineering: multi-step digital application flows, claims-workflow automation, and compliance-aware backends. That shaped how he builds AI: every model call is treated as a fallible dependency, every run is auditable, and every pipeline is a contract. He is based between Zimbabwe and South Africa and works remote-first.',
  },
  {
    id: 'stack',
    title: "Mike's tech stack",
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'AI/LLM: agentic workflows (planner, executor, critic), RAG, structured outputs, eval harnesses, LangChain and LangGraph, OpenAI and Anthropic APIs, Gemini. Backend: Python, FastAPI, Flask, Pydantic, REST and OpenAPI-first design. Data: contract-first ETL, drift detection, PostgreSQL, pgvector, Pandas, Polars. Cloud and infra: AWS (S3, Lambda, SQS, RDS, EC2, ALB, Auto Scaling), Docker, Redis, Terraform, Railway.',
  },
  {
    id: 'availability',
    title: 'Availability and target roles',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike is actively looking for roles as an Applied or Agentic AI Engineer, AI Platform Engineer, or Data Engineer working on AI systems, ideally on a team putting AI into high-stakes, regulated, or operationally serious products. He works remote-first from Zimbabwe and South Africa. Contact him by email at mikencube03@gmail.com, on GitHub at github.com/MikeNcube, or on LinkedIn at linkedin.com/in/mike-ncube-669563a7.',
  },
  {
    id: 'proactive-sentinel-overview',
    title: 'Proactive Sentinel: multi-tenant SOC platform (shipped)',
    sourceUrl: 'https://github.com/MikeNcube/proactive-sentinel',
    text: 'Proactive Sentinel is a multi-tenant Security Operations Centre (SOC) platform Mike built for financial services providers. Status: v1.0.0, production-ready, deployed on Railway with PostgreSQL 15 and Redis 7. It ingests events from agents, log shippers, and internal services, runs them through a detection and correlation engine, and surfaces alerts on a real-time dashboard. It automatically blocks attacker IPs, writes audit entries, and routes business-signal anomalies to UX observers. MITRE ATT&CK techniques are correlated across events to detect multi-stage attack chains: recon, then lateral movement, then exfiltration triggers a critical chain alert. CI test suite: 44 passing tests.',
  },
  {
    id: 'proactive-sentinel-tech',
    title: 'Proactive Sentinel: engineering details',
    sourceUrl: 'https://github.com/MikeNcube/proactive-sentinel',
    text: 'Proactive Sentinel tech stack: Python 3.11, Flask 2.3, marshmallow, Flask-Limiter for the API; JWT HS256 with bcrypt and AES-256-GCM column encryption for auth and PII; PostgreSQL 15 in production with SQLAlchemy 2.0 and Alembic migrations, SQLite for tests; Redis 7 with SHA-256 fingerprint deduplication; OpenTelemetry (OTLP) and structured JSON logging for observability; deployed on Railway with Docker Compose and Gunicorn. POPIA compliance is designed in: PII masking at ingest (South African 13-digit IDs, Zimbabwean national IDs, passports), an immutable audit log of every state change, tenant isolation with per-request row-level security context, and AES-256-GCM encrypted PII columns at rest.',
  },
  {
    id: 'digi-app-form',
    title: 'Digi App Form: regulated insurance intake system (shipped)',
    sourceUrl: 'https://github.com/MikeNcube/digi-app-form',
    text: 'Digi App Form is a web-based digital application system Mike built for capturing, validating, and processing funeral-assurance policy submissions in a regulated insurance environment. The problem: intake was manual and paper-driven, error-prone, and slow to turn into an issued policy, where every mistake is a compliance and audit problem. What it does: a multi-step digital application form with server-side validation, durable submission storage, automated policy PDF generation, an admin dashboard for staff to review and manage submissions, file upload handling for supporting documents, and a backup routine. Stack: Python, Flask, SQLite, Docker. Status: shipped.',
  },
  {
    id: 'zororo-wwf-platform',
    title: 'Zororo Phumulani digital application platform',
    sourceUrl: 'https://mikencube.github.io/#projects',
    text: "Mike's portfolio describes the Zororo Phumulani Digital Application System (WWF platform): a fully digital, compliant insurance application platform onboarding clients across 26 countries, enforcing 18-plus age validation, FIC-compliant ID upload, and POPIA/FAIS consent capture without manual intervention. He built a 7-step workflow engine with dependency enforcement: identity verification, consent capture, payment integration, automated PDF policy generation, multi-recipient SMTP dispatch, and audit logging, deployed on Railway with zero-downtime CI/CD.",
  },
  {
    id: 'recommender-pipeline',
    title: 'End-to-end recommender data pipeline (reference architecture)',
    sourceUrl: 'https://github.com/MikeNcube/End-to-End-Recommender-System-Data-Pipeline',
    text: 'The End-to-End Recommender System Data Pipeline is a reference-architecture repository showing a contract-first data engineering pipeline feeding a recommender, with validation at each hop. It covers ETL/ELT workflow automation, data quality with Great Expectations, workflow orchestration with Apache Airflow DAGs, AWS integration (Kinesis, S3), infrastructure as code with Terraform, and a local mock-services mode so the pipeline can be developed and tested without AWS credentials.',
  },
  {
    id: 'aws-web-tier',
    title: 'Resilient web tier on AWS (learning lab)',
    sourceUrl: 'https://github.com/MikeNcube/Resilient-Web-Tier-on-AWS-ALB-Auto-Scaling',
    text: 'Resilient Web Tier on AWS is a Well-Architected Framework lab Mike built demonstrating a resilient web application tier: an Application Load Balancer distributing traffic to a Flask service on EC2, an Auto Scaling Group for elasticity and fault tolerance, multi-AZ deployment for high availability, and CloudWatch monitoring CPU and requests per target to trigger scale-out and scale-in. S3, IAM, and VPC provide storage, security, and networking. It is labelled as a lab, not production.',
  },
  {
    id: 'rds-lab',
    title: 'AWS RDS connectivity troubleshooting lab',
    sourceUrl: 'https://github.com/MikeNcube/cloud-project-board-rds-connectivity-lab',
    text: 'The RDS Connectivity Lab demonstrates hands-on troubleshooting of connectivity between an EC2 instance and an Amazon RDS PostgreSQL database: VPC configuration and subnet routing, security group and NACL setup, IAM roles and permissions for EC2-to-S3 access, and automation with Python (boto3) and SQL.',
  },
  {
    id: 'certifications',
    title: 'Certifications and training',
    sourceUrl: 'https://mikencube.github.io/#skills',
    text: 'Certifications and training listed on the portfolio: Generative AI with LLMs (DeepLearning.AI), Retrieval-Augmented Generation (DeepLearning.AI), Agentic AI (DeepLearning.AI), LangChain for LLM Applications (DeepLearning.AI), AWS Generative AI Introduction, AWS Machine Learning Foundations, a Data Engineering Bootcamp, and the Udacity Generative AI Introduction.',
  },
  {
    id: 'engineering-philosophy',
    title: 'How Mike approaches AI engineering',
    sourceUrl: 'https://github.com/MikeNcube',
    text: 'Mike builds AI for high-stakes domains, so his engineering defaults are conservative: every model call is a fallible dependency with retries and fallbacks, every run is auditable, and every pipeline is a contract. He labels each public repository with its scope, production, reference architecture, or learning lab, so reviewers know exactly what they are looking at. He favours structured outputs over free-form generation, server-side validation at system boundaries, and observability (structured logging, OpenTelemetry) from day one.',
  },
  {
    id: 'this-assistant',
    title: 'About this AI assistant',
    sourceUrl: 'https://github.com/MikeNcube/mike-portfolio',
    text: 'This chat assistant is itself one of the systems Mike built: a retrieval-augmented generation (RAG) pipeline running inside his Next.js portfolio. Visitor questions are embedded with the Gemini embedding model, matched by cosine similarity against a curated knowledge base built from his real project documentation, and the top-matching chunks are passed as grounded context to Gemini for the final answer. Answers cite their sources, and when the knowledge base does not cover a question, the assistant says so instead of guessing and suggests emailing mikencube03@gmail.com. The retrieval code and knowledge base are public in the mike-portfolio repository.',
  },
];
