// Category nouns a model answer may use for things its cited blocks name by
// member: "database" beside PostgreSQL, "frontend" beside Next.js and React,
// "monitoring" beside CloudWatch. A category word is supported when a cited
// block names one of its members. Qualifiers that assert a property (encryption,
// caching, rule-based, real-time) are deliberately not categories: they are
// claims, and a block must state them in its own words.

import { stem } from "./stem";
import { TECH_LEXICON } from "./tech-lexicon";
import { squash } from "./thesaurus";

const DATABASES = ["postgresql", "postgres", "sqlite", "mysql", "mariadb", "mongodb",
  "dynamodb", "redis", "pgvector", "supabase", "prisma", "sqlalchemy"];
const VECTOR_STORES = ["pgvector", "pinecone", "weaviate", "qdrant", "milvus", "chromadb",
  "faiss", "embeddings"];
const LANGUAGES = ["python", "typescript", "javascript", "java", "sql", "golang", "rust",
  "kotlin", "c#", "go"];
const FRONTEND = ["next.js", "react", "tailwind", "vue", "angular", "svelte"];
const BACKEND = ["fastapi", "flask", "django", "express", "node.js", "gunicorn"];
const CLOUD = ["aws", "azure", "gcp", "railway", "vercel", "ec2", "s3", "bedrock"];
// Named tools only: a block that mentions logs or alerts does not show monitoring.
const MONITORING = ["cloudwatch", "opentelemetry", "prometheus", "grafana", "sentry",
  "datadog"];
const TESTING = ["pytest", "vitest", "jest", "playwright", "tests", "evals"];
const QUEUES = ["celery", "sqs", "rabbitmq", "kafka", "worker", "workers", "outbox"];
const AUTH = ["jwt", "oauth", "nextauth", "session", "sessions"];
const MODELS = ["gemini", "groq", "claude", "openai", "gpt", "gpt-oss", "llama", "ollama",
  "anthropic", "bedrock"];
// A profile handle is the path of a profile link the block gives.
const ACCOUNTS = ["github.com/", "linkedin.com/"];

const CATEGORY_LIST: ReadonlyArray<readonly [readonly string[], readonly string[]]> = [
  [["database", "databases", "db", "datastore", "data store", "data stores", "data layer"], DATABASES],
  [["storage", "persistence", "data storage", "store", "stores", "stored", "storing"], [...DATABASES, "s3", "blob", "store", "stores", "stored"]],
  [["vector storage", "vector store", "vector stores", "vector database", "vector search",
    "vector db"], VECTOR_STORES],
  [["data"], [...DATABASES, "pii", "records", "documents", "events", "rows", "schemas"]],
  [["language", "languages", "programming language", "programming languages", "programming"], LANGUAGES],
  [["frontend", "front-end", "front end", "ui", "user interface", "client side", "client-side"], FRONTEND],
  [["backend", "back-end", "back end", "server", "server-side", "server side", "api", "apis"], BACKEND],
  [["framework", "frameworks"], [...FRONTEND, ...BACKEND, "langgraph", "langchain", "pydantic"]],
  [["stack", "tech stack", "technology", "technologies", "tool", "tools", "tooling", "toolset",
    "tech"], TECH_LEXICON],
  // A container is not a cloud: Docker alone does not show where something is hosted.
  [["cloud", "cloud platform", "cloud provider", "hosting", "hosted", "host", "hosts"], CLOUD],
  [["monitoring", "monitor", "monitored", "observability", "telemetry", "tracing"], MONITORING],
  [["testing", "test suite", "test suites", "tested"], TESTING],
  [["container", "containers", "containerised", "containerized"], ["docker", "kubernetes"]],
  [["queue", "queues", "background jobs", "background job", "task queue", "job queue"], QUEUES],
  [["authentication", "auth"], AUTH],
  [["username", "handle", "profile", "account"], ACCOUNTS],
  [["model", "models", "llm", "llms", "language model", "ai model"], MODELS],
];

function categoryKey(word: string): string {
  return stem(squash(word));
}

const MEMBERS_BY_KEY: Map<string, readonly string[]> = (() => {
  const map = new Map<string, readonly string[]>();
  for (const [names, members] of CATEGORY_LIST) {
    for (const name of names) map.set(categoryKey(name), members);
  }
  return map;
})();

// The members that would support `word` as a category noun, or none.
export function categoryMembers(word: string): readonly string[] {
  return MEMBERS_BY_KEY.get(categoryKey(word)) ?? [];
}

// Multi-word category names, longest first, so a validator reads each as one unit.
export const CATEGORY_PHRASES: readonly string[] = CATEGORY_LIST
  .flatMap(([names]) => names.filter((name) => name.includes(" ")))
  .sort((a, b) => b.length - a.length);
