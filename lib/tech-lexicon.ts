// General software-technology vocabulary, independent of Mike's knowledge base.
// Used only to tell "a technology the visitor named" apart from an ordinary
// word. Whether Mike has used it is decided against the knowledge base, never here.

export const TECH_LEXICON: readonly string[] = [
  // Languages
  "python", "typescript", "javascript", "java", "kotlin", "scala", "golang",
  "rust", "ruby", "php", "perl", "swift", "objective-c", "c#", "c++", "dart",
  "elixir", "erlang", "haskell", "clojure", "lua", "julia", "matlab", "fortran",
  "cobol", "bash", "powershell", "sql", "graphql", "solidity", "zig", "ocaml", "f#",
  // Web and app frameworks
  "react", "next.js", "nextjs", "vue", "vue.js", "nuxt", "angular", "svelte",
  "sveltekit", "gatsby", "jquery", "tailwind",
  "bootstrap", "redux", "node.js", "nodejs", "nestjs",
  "nest.js", "deno", "fastapi", "flask", "django", "pyramid", "starlette",
  "spring boot", "rails", "ruby on rails", "laravel", "symfony",
  ".net", "asp.net", "blazor", "flutter",
  "react native", "xamarin", "ionic", "electron", "jinja2", "pydantic",
  "sqlalchemy", "alembic", "prisma", "nextauth", "gunicorn", "uvicorn",
  "celery", "htmx",
  // Data stores and messaging
  "postgresql", "postgres", "mysql", "mariadb", "sqlite", "oracle", "sql server",
  "mssql", "mongodb", "dynamodb", "cassandra", "couchdb", "couchbase", "redis",
  "memcached", "elasticsearch", "opensearch", "neo4j", "influxdb", "timescaledb",
  "clickhouse", "snowflake", "bigquery", "redshift", "databricks", "supabase",
  "firebase", "firestore", "pgvector", "pinecone", "weaviate", "qdrant",
  "milvus", "chromadb", "faiss", "kafka", "rabbitmq", "activemq",
  "nats", "pulsar", "kinesis", "sqs", "sns", "airflow", "dagster", "prefect",
  "dbt", "spark", "hadoop", "flink", "pandas", "numpy", "polars",
  // AI and ML
  "pytorch", "tensorflow", "keras", "jax", "scikit-learn", "sklearn", "xgboost",
  "lightgbm", "hugging face", "huggingface", "transformers", "spacy", "nltk",
  "opencv", "langchain", "langgraph", "llamaindex", "llama", "haystack",
  "autogen", "crewai", "semantic kernel", "dspy", "openai", "gpt", "chatgpt",
  "anthropic", "claude", "gemini", "mistral", "cohere", "groq", "ollama",
  "vllm", "bedrock", "sagemaker", "vertex ai", "azure openai", "mlflow",
  "kubeflow", "weights and biases", "wandb", "presidio", "rag", "bm25",
  "nlp", "natural language processing", "machine learning", "deep learning",
  "computer vision", "data science", "data engineering", "prompt engineering",
  "mlops", "ci/cd", "devops",
  // Cloud, infra and ops
  "aws", "azure", "gcp", "google cloud", "s3", "ec2", "iam", "cloudwatch",
  "lambda", "ecs", "eks", "fargate", "cloudformation", "cdk", "heroku",
  "vercel", "netlify", "railway", "fly.io", "digitalocean",
  "cloudflare", "docker", "kubernetes", "k8s", "helm", "terraform", "pulumi",
  "ansible", "vagrant", "nginx", "apache", "linux", "ubuntu",
  "jenkins", "github actions", "gitlab", "gitlab ci", "circleci", "travis",
  "argo", "argocd", "prometheus", "grafana", "datadog", "new relic", "splunk",
  "sentry", "opentelemetry", "jaeger", "kibana", "logstash", "opa",
  "rego", "istio", "n8n", "zapier",
  // Security, auth and APIs
  "jwt", "oauth", "oauth2", "openid", "saml", "keycloak", "auth0", "okta",
  "grpc", "websocket", "websockets", "soap", "openapi", "swagger",
  "postman", "stripe", "twilio",
  // Testing and tooling
  "pytest", "jest", "vitest", "mocha", "cypress", "playwright", "selenium",
  "junit", "storybook", "webpack", "vite", "babel", "eslint", "git", "github",
  "bitbucket", "jira", "confluence", "figma", "tableau", "power bi",
  "powerbi", "looker", "salesforce", "sap", "servicenow", "hubspot",
  "shopify", "wordpress", "drupal", "unreal",
];

export const TECH_LEXICON_SET: ReadonlySet<string> = new Set(TECH_LEXICON);
