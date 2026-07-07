export type ProjectStatus = "Production" | "Shipped" | "Live demo" | "Reference" | "Lab";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  problem: string;
  built: string;
  outcome: string;
  stack: string[];
  status: ProjectStatus;
  domain: string;
  year: string;
  /** External repo URL. Absent → private client work, stated honestly. */
  repoUrl?: string;
  /** In-page anchor or external live URL. */
  demoUrl?: string;
  demoLabel?: string;
  /** Longer-form overview for the case-study page. Falls back to `built`. */
  systemOverview?: string;
  /** Bullet points showing engineering thought on the detail page. */
  engineeringDecisions?: string[];
};

/**
 * Every project below traces to verifiable material: a public GitHub
 * repository, this site itself, or Mike's own published portfolio copy
 * (private client work is labelled as exactly that). No invented systems.
 */
export const flagshipProjects: Project[] = [
  {
    slug: "proactive-sentinel",
    name: "Proactive Sentinel — Multi-Tenant SOC Platform",
    tagline:
      "Security Operations Centre backend for financial-services providers: event ingestion, MITRE ATT&CK correlation, automated response.",
    problem:
      "Financial-services providers need security monitoring that catches multi-stage attacks (recon → lateral movement → exfiltration) and business-signal anomalies — without a heavyweight enterprise SIEM or a pre-registered token for every event source.",
    built:
      "A multi-tenant Flask backend that ingests events from agents and log shippers, deduplicates them in Redis by SHA-256 fingerprint, correlates MITRE ATT&CK techniques across events into chain alerts, and dispatches automated responses by severity — IP blocking, audit entries, alert routing. POPIA compliance is designed in: PII masking at ingest, AES-256-GCM encrypted columns, immutable audit log, per-request tenant isolation.",
    outcome:
      "v1.0.0, production-ready and deployed on Railway with PostgreSQL 15 and Redis 7. CI suite of 44 passing tests. Dispatcher failures are non-fatal by design — a Redis outage cannot drop alerts.",
    systemOverview:
      "Events route through a DetectionEngine (Redis dedup + MITRE correlation) or a UXObserver for business signals (claims latency, WhatsApp frustration, web errors). After an alert is persisted, an Action Dispatcher fires by severity: critical alerts flag, block the attacker IP in Redis with a 24h TTL, and write an audit entry; lower severities degrade gracefully. All API access is JWT-authenticated and rate-limited; observability is OpenTelemetry plus structured JSON logs.",
    engineeringDecisions: [
      "SHA-256 fingerprint deduplication in Redis so duplicate events are suppressed at ingest, before they can create alert noise.",
      "MITRE ATT&CK chain correlation across events — recon followed by lateral movement followed by exfiltration escalates to a critical chain alert, which single-event rules would miss.",
      "Automated response is severity-tiered (flag / block / report), and dispatcher failures are non-fatal: a Redis outage degrades response, never alert persistence.",
      "POPIA compliance at the data layer: SA and Zimbabwean IDs masked before storage, PII columns encrypted with AES-256-GCM, every state change written to an immutable audit log.",
      "Tenant isolation enforced per request — ingest rejects tenant IDs that do not match the authenticated JWT.",
    ],
    stack: ["Python 3.11", "Flask", "PostgreSQL 15", "Redis 7", "SQLAlchemy 2.0", "Alembic", "OpenTelemetry", "Docker", "Railway"],
    status: "Production",
    domain: "Security · Backend",
    year: "2026",
    repoUrl: "https://github.com/MikeNcube/proactive-sentinel",
  },
  {
    slug: "digi-app-form",
    name: "Digi App Form — Regulated Insurance Intake",
    tagline:
      "Digital application system that captures, validates, and processes funeral-assurance policy submissions — and issues the policy documents.",
    problem:
      "Funeral-assurance intake was manual and paper-driven: client details captured by hand, re-keyed, error-prone, and slow to become an issued policy. In a regulated product, every mistake is a compliance and audit problem.",
    built:
      "A multi-step web application flow with server-side validation before anything is persisted, durable submission storage, automated policy-PDF generation, supporting-document upload handling, an admin dashboard for staff review, and a scheduled backup routine for the datastore.",
    outcome:
      "Shipped and in use for a regulated funeral-assurance workflow: clean data captured once, validated server-side, and turned into an issued policy document without manual re-keying.",
    engineeringDecisions: [
      "Server-side validation is the gate — nothing reaches the datastore until the record is clean, because in a regulated product a bad record is an audit finding.",
      "Policy PDF generation is automated from the accepted application, removing the manual document-prep step entirely.",
      "Uploads are stored and associated with the correct application, so the audit trail from submission to issued policy is complete.",
      "A separate admin dashboard keeps staff workflows isolated from the applicant-facing flow.",
    ],
    stack: ["Python", "Flask", "SQLite", "Docker"],
    status: "Shipped",
    domain: "Insurance · Backend",
    year: "2026",
    repoUrl: "https://github.com/MikeNcube/digi-app-form",
  },
  {
    slug: "portfolio-rag-assistant",
    name: "This Site's RAG Assistant",
    tagline:
      "A retrieval-augmented chat you can use right now: grounded answers about my work, with clickable source citations.",
    problem:
      "Every portfolio claims RAG experience. Almost none let a hiring manager verify it. The honest proof is a working retrieval pipeline they can interrogate — one that cites its sources and refuses to bluff.",
    built:
      "A RAG pipeline inside this Next.js site: a knowledge base curated from my real GitHub READMEs and portfolio copy, embedded with Gemini embeddings, retrieved by cosine similarity, and answered by Gemini grounded only in the retrieved chunks. Every answer returns its source documents; out-of-scope questions get an honest refusal with a contact route. Rate-limited, input-validated, and it fails honestly (503 → email) when unconfigured.",
    outcome:
      "A live, inspectable RAG demo — open devtools, read the network calls, click the citations. The knowledge base and retrieval code are public in this site's repository.",
    engineeringDecisions: [
      "Every knowledge chunk carries a sourceUrl, and the API returns sources with each answer — citations are part of the contract, not decoration.",
      "A minimum-similarity threshold gates generation: below it the assistant says it doesn't know rather than letting the model improvise.",
      "The client sends only an audience hint, never a system prompt — the grounding prompt is server-side, closing the prompt-injection hole.",
      "Knowledge-base embeddings are computed once per server instance and cached; only the query is embedded per request.",
      "No API key → a 503 with an honest message directing visitors to email. Nothing on this site pretends to work.",
    ],
    stack: ["Next.js", "TypeScript", "Gemini embeddings", "Cosine retrieval", "Resend"],
    status: "Live demo",
    domain: "RAG · LLM Systems",
    year: "2026",
    repoUrl: "https://github.com/MikeNcube/mike-portfolio",
    demoUrl: "/#assistant",
    demoLabel: "Try it above",
  },
];

export const clientProjects: Project[] = [
  {
    slug: "zororo-digital-applications",
    name: "Zororo Phumulani — Digital Application Platform",
    tagline:
      "Compliant insurance onboarding across 26 countries: identity verification, consent capture, payments, and automated policy issue.",
    problem:
      "A funeral-assurance provider needed fully digital, compliant onboarding across 26 countries — enforcing 18+ age validation, FIC-compliant ID upload, and POPIA/FAIS consent capture — without manual intervention.",
    built:
      "A 7-step workflow engine with dependency enforcement: identity verification → consent capture → payment integration → automated PDF policy generation → multi-recipient SMTP dispatch → audit logging. Deployed on Railway with zero-downtime CI/CD.",
    outcome:
      "In production for clients across 26 countries. This is private client work — the code isn't public, so treat the summary as my account of the system; the public repos above are the verifiable evidence of how I build.",
    stack: ["Python", "Workflow engine", "PDF generation", "SMTP", "Payments", "Railway"],
    status: "Production",
    domain: "Insurance · Client work",
    year: "2025–2026",
  },
];

export const labProjects: Project[] = [
  {
    slug: "recommender-data-pipeline",
    name: "End-to-End Recommender Data Pipeline",
    tagline:
      "Contract-first data pipeline feeding a recommender, with validation at each hop.",
    problem:
      "Recommenders are only as good as the data reaching them — pipelines without validation ship silent drift downstream.",
    built:
      "ETL/ELT workflows orchestrated with Airflow DAGs, data-quality gates with Great Expectations, AWS integration (Kinesis, S3), Terraform for infrastructure, and a mock-services mode so the pipeline develops and tests without AWS credentials.",
    outcome:
      "A reference architecture showing contract-first pipeline design — labelled as reference, not production.",
    stack: ["Python", "Airflow", "Great Expectations", "AWS Kinesis / S3", "Terraform", "Pandas"],
    status: "Reference",
    domain: "Data Engineering",
    year: "2025",
    repoUrl: "https://github.com/MikeNcube/End-to-End-Recommender-System-Data-Pipeline",
  },
  {
    slug: "aws-resilient-web-tier",
    name: "Resilient Web Tier on AWS",
    tagline:
      "Well-Architected lab: ALB + Auto Scaling + multi-AZ for a Flask service on EC2.",
    problem:
      "Demonstrating that a web tier can absorb instance failure and load spikes without downtime — the reliability half of the Well-Architected Framework.",
    built:
      "An Application Load Balancer routing to EC2 instances in an Auto Scaling Group across availability zones, CloudWatch alarms on CPU and requests-per-target driving scale-out/in, with S3, IAM, and VPC providing storage, security, and networking.",
    outcome:
      "A working lab covering reliability, security, and cost trade-offs — labelled as a lab, not production.",
    stack: ["AWS ALB", "EC2 Auto Scaling", "CloudWatch", "VPC", "IAM", "Flask"],
    status: "Lab",
    domain: "Cloud · AWS",
    year: "2025",
    repoUrl: "https://github.com/MikeNcube/Resilient-Web-Tier-on-AWS-ALB-Auto-Scaling",
  },
  {
    slug: "rds-connectivity-lab",
    name: "RDS Connectivity Troubleshooting Lab",
    tagline:
      "Hands-on AWS networking: diagnosing EC2 → RDS PostgreSQL connectivity end to end.",
    problem:
      "Database connectivity failures in AWS are almost always networking — and diagnosing them requires working through VPCs, subnets, security groups, and IAM systematically.",
    built:
      "A documented troubleshooting lab across VPC configuration and subnet routing, security-group and NACL setup, IAM roles for EC2-to-S3 access, and automation with boto3 and SQL.",
    outcome:
      "A reproducible diagnostic walkthrough — labelled as a lab.",
    stack: ["AWS RDS", "EC2", "VPC", "IAM", "Python (boto3)", "SQL"],
    status: "Lab",
    domain: "Cloud · AWS",
    year: "2025",
    repoUrl: "https://github.com/MikeNcube/cloud-project-board-rds-connectivity-lab",
  },
];

export const engineeringApproach = [
  {
    title: "Models are fallible dependencies",
    body: "Every LLM call gets validation, retries, and a fallback path. Structured outputs over free-form generation; JSON-schema checks before anything downstream consumes a response.",
  },
  {
    title: "Every run is auditable",
    body: "Structured JSON logs, trace IDs, and audit entries for state changes. If a regulated client asks what happened, the answer is in the log, not in someone's memory.",
  },
  {
    title: "Every pipeline is a contract",
    body: "Pydantic schemas at system boundaries, validation before persistence, drift caught at ingest. Data consumers should trust shape and freshness, not just row counts.",
  },
  {
    title: "Honest labels on everything",
    body: "Each public repo is labelled production, reference, or lab — so a reviewer knows exactly what they're looking at. This site follows the same rule.",
  },
];

export const capabilities = [
  {
    label: "Agentic AI",
    body: "Planner / executor / critic loops, typed tool calling, auditable runs.",
  },
  {
    label: "RAG & LLM workflows",
    body: "Retrieval pipelines, structured outputs, grounded generation — one is live on this page.",
  },
  {
    label: "Python backends",
    body: "FastAPI / Flask services with typed contracts, auth, and observability.",
  },
  {
    label: "Data pipelines",
    body: "Contract-first ingestion with validation gates and drift detection.",
  },
];

export const profile = {
  name: "Mike S Ncube",
  shortName: "Mike",
  location: "Zimbabwe · South Africa · Remote-first",
  email: "mikencube03@gmail.com",
  github: "https://github.com/MikeNcube",
  linkedin: "https://www.linkedin.com/in/mike-ncube-669563a7/",
  avatar: "/Mike_Org.jpeg",
  portrait: "/Mike_Org.jpeg",
  headline: "AI Engineer",
  subHeadline: "Production RAG & agentic LLM systems · Python backends · AWS",
  oneLiner:
    "I build AI systems for environments where mistakes are expensive — insurance, claims, and regulated financial workflows.",
  availability: "Available for AI engineering roles",
  tags: ["RAG", "Agentic AI", "Python", "FastAPI", "AWS"],
};

export const navSections = [
  { id: "work", label: "Work" },
  { id: "assistant", label: "AI Assistant" },
  { id: "labs", label: "Labs" },
  { id: "approach", label: "Approach" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/** Every project, flattened, in stable display order. */
export const allProjects: Project[] = [
  ...flagshipProjects,
  ...clientProjects,
  ...labProjects,
];

export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}

export function getProjectNeighbours(slug: string): {
  prev: Project;
  next: Project;
} {
  const i = allProjects.findIndex((p) => p.slug === slug);
  const safe = i < 0 ? 0 : i;
  const prev =
    allProjects[(safe - 1 + allProjects.length) % allProjects.length];
  const next = allProjects[(safe + 1) % allProjects.length];
  return { prev, next };
}
