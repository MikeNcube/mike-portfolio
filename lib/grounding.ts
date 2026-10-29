// Deterministic grounding gate and model-output validator.
// A candidate answers a question only if content terms are in the answer/KB
// (or related stems). Unknown tech gets an "isn't listed" note. Other unmatched
// terms fail the candidate.

import { tokenize } from "./bm25";
import { CATEGORY_PHRASES, categoryMembers } from "./claim-categories";
import { GENERIC_WORD_LIST } from "./generic-words";
import { namedProjects } from "./intent";
import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { splitIntoSentences } from "./normalise-answer";
import { isWhQuestion } from "./question-form";
import { stem } from "./stem";
import { TECH_LEXICON_SET } from "./tech-lexicon";
import { squash, synonymsOf, thesaurusWords, THESAURUS_PHRASES } from "./thesaurus";

const NAME_TOKENS = new Set(["mike", "ncube"]);

const MODIFIERS = new Set([
  "favourite", "favorite", "favourites", "favorites",
  "main", "best", "current", "strongest", "proudest", "flagship", "headline",
  "open", "still", "really", "please", "also", "quick", "brief", "summary",
  "tell", "give", "describe", "introduce", "explain", "share", "show",
  "looking", "want", "wants", "hoping", "seeking", "after", "next", "big", "part",
  "compare", "compared", "versus", "vs",
  "know", "knows", "knew", "used", "using", "use", "uses",
  "built", "building", "done", "hold", "holds", "held",
  "work", "works", "working", "worked", "experience", "experienced",
  "take", "taking", "consider", "considering", "keep", "keeps",
  "approach", "approaches", "handle", "handles", "handling",
  "people", "person", "someone", "anyone", "anything", "something",
  "available", "availability", "hire", "hiring", "hireable",
  "good", "fit", "different", "standout", "new", "our",
  "senior", "junior", "mid", "staff",
  "value", "bring", "benefit",
  "start",
  "manager",
  "month", "live", "currently",
  "any", "one", "first", "usage", "go", "shipped", "cv",
  "represents", "here", "visitors",
  "working model",
  "tool", "tools",
  "detail", "details", "more", "specifically", "specific", "exactly", "briefly",
  "particular", "certain", "actual", "typical", "usual",
  "rate", "notice", "relocate", "relocation", "timezone", "zone",
  "ai", "llm", "tech", "most", "much", "many", "does", "mike",
  "part", "region", "area", "province", "place",
  "kind", "type", "sort", "reason", "reasons",
  "overview", "summary", "nutshell", "headline",
  "before", "writing", "files", "file", "writes",
  "where", "when", "why", "whose", "whom",
  "keep", "reliable", "reliability", "quality",
  "running", "paused", "serving",
  "remote", "remotely",
  "strong", "impressive", "proudest",
  "reasons",
  "written",
  "located", "locate",
  "days", "today", "nowadays", "moment", "presently", "lately", "present",
  "reside", "resides", "residing",
  "living", "lives",
  "official", "actually", "listed", "prefer", "include", "primary",
  "option", "accept", "mentioned", "formally", "advertise",
  "recruiter", "expect", "fluent", "coding", "develop", "program",
  "tooling", "integrated", "thorough", "published", "evidence", "industry",
  "craft", "engagements", "reports", "direct",
  "his", "paragraph", "introduction", "provide",
  "powers", "implemented", "ensure", "practices", "talking",
  "focused", "attend", "formally",
  "engineer", "engineers",
]);

export const RELATED_TERMS: Record<string, string[]> = {
  sql: ["sql", "postgresql", "postgres", "sqlite", "sqlalchemy"],
  postgres: ["postgres", "postgresql"],
  postgresql: ["postgresql", "postgres"],
  database: ["database", "postgresql", "postgres", "pgvector", "sqlite"],
  databases: ["database", "postgresql", "postgres", "pgvector", "sqlite"],
  "vector database": ["vector database", "pgvector", "postgresql", "postgres"],
  "vector databases": ["vector databases", "pgvector", "postgresql", "postgres"],
  golang: ["golang", "go"],
  security: ["security", "compliance", "popia", "secure"],
  compliance: ["compliance", "popia"],
  hybrid: ["hybrid", "remote", "remote-first"],
  jwt: ["jwt"],
  react: ["react"],
  redis: ["redis"],
  flask: ["flask"],
  kafka: ["kafka"],
  programming: ["programming", "python", "typescript", "language", "languages"],
  language: ["language", "languages", "python", "typescript", "programming", "fastapi"],
  languages: ["languages", "language", "python", "typescript", "programming", "fastapi"],
  orchestration: ["orchestration", "langgraph", "langchain"],
  libraries: ["libraries", "library", "langgraph", "langchain"],
  library: ["library", "libraries", "langgraph", "langchain"],
  agents: ["agents", "agent", "langgraph"],
  writing: ["writing", "writes", "write", "files"],
  files: ["files", "file", "writes", "write"],
  chatbot: ["chatbot", "assistant", "gemini", "groq", "rag"],
  "chat assistant": ["chat assistant", "assistant", "chatbot", "gemini"],
  "this assistant": ["this assistant", "assistant", "chatbot", "gemini"],
  reliable: ["reliable", "reliability", "tests", "testing", "validation"],
  quality: ["quality", "tests", "testing"],
  frameworks: ["frameworks", "framework", "fastapi", "flask", "langgraph", "langchain"],
  framework: ["framework", "frameworks", "fastapi", "flask", "langgraph", "langchain"],
  "web framework": ["web framework", "fastapi", "flask", "next.js"],
  city: ["johannesburg", "south africa"],
  metro: ["johannesburg", "south africa"],
  urban: ["johannesburg", "south africa"],
  stationed: ["johannesburg", "south africa"],
  geography: ["johannesburg", "south africa"],
  overlap: ["johannesburg", "south africa"],
  header: ["johannesburg", "title", "applied"],
  operate: ["johannesburg", "south africa"],
  operates: ["johannesburg", "south africa"],
  country: ["johannesburg", "south africa"],
  based: ["johannesburg", "south africa"],
  heading: ["heading", "title", "applied", "architect"],
  styled: ["styled", "title", "applied", "architect"],
  designated: ["designated", "title", "applied", "architect"],
  "org chart": ["org chart", "title", "applied", "architect"],
  "linkedin headline": ["linkedin headline", "title", "applied", "architect"],
  "email signature": ["email signature", "title", "applied", "architect"],
  clocked: ["clocked", "zororo", "phumulani", "employer"],
  payroll: ["payroll", "zororo", "phumulani", "employer"],
  shop: ["shop", "zororo", "phumulani", "employer"],
  attached: ["attached", "zororo", "phumulani", "employer"],
  business: ["zororo", "phumulani", "employer", "funeral"],
  desk: ["desk", "remote-first", "remote"],
  distributed: ["distributed", "remote-first", "remote"],
  "office-first": ["office-first", "remote-first"],
  "working model": ["remote-first"],
  "on-site": ["on-site", "remote-first", "remote"],
  permanent: ["permanent", "full-time", "contract"],
  "employment mode": ["employment mode", "full-time", "contract"],
  apis: ["apis", "python", "fastapi", "flask"],
  backends: ["backends", "fastapi", "flask", "python"],
  unit: ["unit", "four-person", "team"],
  small: ["small", "four-person", "team"],
  opening: ["opening", "generative", "applied", "target"],
  credential: ["credential", "degree", "formal", "certifications"],
  academic: ["academic", "degree", "formal"],
  certificate: ["certificate", "certifications", "named"],
  blurb: ["blurb", "applied", "architect", "johannesburg"],
  elevator: ["elevator", "applied", "architect"],
  positioning: ["positioning", "applied", "architect"],
  mailbox: ["mailbox", "email", "gmail"],
  recruiters: ["recruiters", "email", "gmail"],
  reaching: ["reaching", "email", "gmail"],
  demo: ["demo", "digi", "form", "shipped"],
  "in production": ["in production", "shipped", "digi", "crm"],
  title: ["applied", "architect"],
  role: ["applied", "architect", "generative", "engineer"],
  roles: ["applied", "architect", "generative", "engineer"],
  job: ["applied", "architect", "degree", "formal"],
  jobs: ["applied", "generative"],
  position: ["applied", "architect"],
  positions: ["applied", "generative"],
  company: ["company", "zororo", "phumulani", "employer"],
  org: ["org", "zororo", "phumulani"],
  organisation: ["organisation", "zororo", "phumulani"],
  organization: ["organization", "zororo", "phumulani"],
  employer: ["employer", "zororo", "phumulani"],
  employs: ["employs", "zororo", "phumulani"],
  employed: ["employed", "zororo", "phumulani"],
  firm: ["firm", "zororo", "phumulani"],
  years: ["years", "2022", "2024"],
  year: ["year", "2022", "2024"],
  team: ["team", "four-person"],
  department: ["department", "four-person", "team"],
  contract: ["contract", "full-time"],
  tool: ["tool", "python", "fastapi"],
  tools: ["tools", "python", "fastapi"],
  skill: ["skill", "python", "fastapi"],
  skills: ["skills", "python", "fastapi", "typescript"],
  resume: ["applied", "architect"],
  cv: ["applied", "architect"],
  highlight: ["applied", "architect"],
  highlights: ["applied", "architect"],
  profile: ["profile", "applied", "architect", "johannesburg"],
  bio: ["bio", "applied", "architect"],
  candidate: ["candidate", "applied", "architect"],
  candidates: ["candidates", "applied", "architect"],
  chat: ["chat", "assistant", "gemini"],
  assistant: ["assistant", "gemini", "groq", "rag"],
  agent: ["agent", "langgraph"],
  systems: ["systems", "digi", "crm", "shipped"],
  deployed: ["deployed", "not yet live", "rolling"],
  deploy: ["deploy", "not yet live", "rolling"],
  deployment: ["deployment", "paused", "railway"],
  hosted: ["hosted", "not yet live"],
  hosting: ["hosting", "not yet live"],
  education: ["education", "degree", "formal", "certifications"],
  degree: ["degree", "formal", "certifications"],
  studied: ["studied", "degree", "formal"],
  study: ["study", "degree", "formal"],
  software: ["software", "frontend", "python"],
  engineer: ["engineer", "applied", "architect"],
  engineering: ["engineering", "applied", "python"],
  background: ["background", "applied", "architect"],
  leadership: ["leadership", "four-person", "tech lead"],
  coverage: ["coverage", "tests", "testing"],
  code: ["code", "python", "tests"],
  professional: ["professional", "title", "applied", "architect"],
  professionally: ["professionally", "johannesburg", "based"],
  hang: ["hang", "johannesburg", "based"],
  hat: ["hat", "johannesburg", "based"],
  tenure: ["tenure", "2018", "2022", "2024"],
  career: ["career", "2018", "2022", "2024"],
  backend: ["backend", "python", "fastapi"],
  frontend: ["frontend", "typescript", "react"],
  stack: ["stack", "python", "fastapi", "typescript"],
  group: ["group", "four-person", "team"],
  engineers: ["engineers", "four-person", "team"],
  genai: ["genai", "generative", "applied"],
  targeting: ["targeting", "generative", "applied"],
  hired: ["hired", "generative", "applied"],
  target: ["target", "generative", "applied"],
  function: ["function", "generative", "applied"],
  contractor: ["contractor", "contract", "full-time"],
  shipped: ["shipped", "digi", "crm"],
  project: ["project", "digi", "crm"],
  projects: ["projects", "digi", "crm"],
  intake: ["intake", "digi", "form"],
  bachelor: ["bachelor", "degree", "formal"],
  panel: ["panel", "applied", "architect"],
  sourcer: ["sourcer", "applied", "architect"],
  cert: ["cert", "certifications", "named"],
  certifications: ["certifications", "named", "degree"],
  portfolio: ["portfolio", "gemini", "assistant"],
  embeds: ["embeds", "gemini", "embedding"],
  knowledge: ["knowledge", "gemini", "rag"],
  wired: ["wired", "gemini", "assistant"],
  "model answers": ["gemini", "embedding", "assistant"],
  graph: ["graph", "langgraph"],
  graphs: ["graphs", "langgraph"],
  orchestrate: ["orchestrate", "langgraph"],
  prototypes: ["prototypes", "langgraph", "sitewarden"],
  steps: ["steps", "langgraph"],
  "agent-graph": ["agent-graph", "langgraph"],
  "serving traffic": ["serving traffic", "paused"],
  "run state": ["run state", "paused"],
  reporting: ["reporting", "four-person", "team"],
  giant: ["giant", "four-person", "team"],
  proof: ["proof", "digi", "form"],
  artefact: ["artefact", "digi", "form"],
  delivered: ["delivered", "digi", "form"],
  form: ["form", "digi"],
  ship: ["ship", "digi", "crm"],
  application: ["application", "digi", "form"],
  linkedin: ["linkedin", "linkedin.com"],
  breath: ["breath", "applied", "architect"],
  system: ["system", "digi", "crm", "shipped"],
  bugs: ["tests", "testing", "validation"],
  defects: ["validation", "retries", "fallback", "auditable"],
  moonlight: ["contract", "full-time"],
  contracts: ["contract", "full-time"],
  supervised: ["four-person", "team"],
  developers: ["four-person", "team"],
  interview: ["digi"],
  gigs: ["contract", "full-time"],
  "side gigs": ["contract", "full-time"],
  stand: ["digi", "applied", "architect"],
  proud: ["digi", "form", "shipped"],
  build: ["digi", "form", "shipped"],
  builds: ["digi", "form", "shipped"],
  learn: ["degree", "formal"],
  "job hunting": ["generative", "target", "applied"],
  hunting: ["generative", "target", "applied"],
  market: ["generative", "target", "available"],
  "staff-plus": ["generative", "available", "contract"],
  ic: ["generative", "available", "target"],
  "reporting line": ["reporting line", "four-person", "team"],
  freelance: ["freelance", "contract"],
  consulting: ["consulting", "consult", "contract"],
  consult: ["consult", "consulting", "contract"],
  university: ["university", "degree", "education"],
  college: ["college", "degree", "education"],
  school: ["school", "degree", "education", "courses"],
  qualification: ["qualification", "degree", "certifications"],
  qualifications: ["qualifications", "degree", "certifications"],
  "computer science": ["computer science", "degree", "education"],
  "state machine": ["state machine"],
  manage: ["four-person", "team"],
  "people manager": ["four-person", "team"],
  alone: ["four-person", "team"],
  others: ["four-person", "team"],
  teammates: ["four-person", "team"],
  builder: ["four-person", "team"],
  "e-signature": ["e-signature", "e-signatures", "signature", "zdi"],
  "e-signatures": ["e-signatures", "e-signature", "signature", "zdi"],
  "approval workflows": ["approval workflow", "approval workflows", "zdi"],
  "self-taught": ["self-taught", "degree", "education", "courses"],
  taught: ["taught", "degree", "education", "courses"],
};

export const KNOWN_TECH_TERMS = [
  "kubernetes", "rust", "golang", "java", "azure", "gcp", "google cloud",
  "snowflake", "kafka", "lambda", "graphql", "linux", "spark", "mongodb",
  "mysql", "dynamodb", "oracle", "cassandra", "elasticsearch", "helm",
  "ansible", "jenkins", "kotlin", "swift", "ruby", "php", "scala",
  "haskell", "elixir",
];

const MULTIWORD_SUBJECTS = [
  "mitre att&ck", "att&ck", "next.js", "node.js", "open telemetry",
  "machine learning", "deep learning", "data engineering", "prompt engineering",
  "computer vision", "natural language processing", "nlp", "data science",
  "ci/cd", "mlops", "github actions", "grounding prompt", "approval workflow",
  "cape town", "south africa", "world cup", "computer science",
  "proactive sentinel", "chat assistant", "this assistant",
  "state machine", "e-signature", "e-signatures", "approval workflow",
  "approval workflows", "self-taught", "web framework", "linkedin headline",
  "email signature", "org chart", "employment mode", "office-first",
  "on-site", "serving traffic", "run state", "in production",
  "reporting line", "remote-first", "people manager", "state machine",
  "side gigs", "staff-plus", "job hunting", "model answers",
  "working model",
];

function stemVariants(word: string): string[] {
  const w = word.toLowerCase();
  const out = new Set([w]);
  if (w === "favourite" || w === "favorite") out.add("favorit");
  if (w.length <= 3) return [...out];
  if (w.endsWith("ies") && w.length > 4) out.add(`${w.slice(0, -3)}y`);
  if (w.endsWith("ing") && w.length > 5) {
    const stem = w.slice(0, -3);
    out.add(stem);
    // Avoid "living" → "live" homographs (production-live vs reside).
    if (stem.length >= 4) out.add(`${stem}e`);
    out.add(`${stem}s`);
    out.add(`${stem}es`);
  }
  if (w.endsWith("ed") && w.length > 4) {
    out.add(w.slice(0, -2));
    out.add(w.slice(0, -1));
  }
  if (w.endsWith("es") && w.length > 4) out.add(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && w.length > 3) {
    out.add(w.slice(0, -1));
  }
  return [...out];
}

export function hasWholeWord(hay: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(hay);
}

export function termMatchNeedles(term: string): string[] {
  const related = RELATED_TERMS[term.toLowerCase()];
  if (related) return related;
  if (term.includes(".") || term.includes("&") || term.includes(" ")) return [term];
  return stemVariants(term);
}

export function passageHasTerm(hay: string, term: string): boolean {
  return termMatchNeedles(term).some((needle) => {
    if (needle.includes(".") || needle.includes("&") || needle.includes(" ")) {
      return hay.toLowerCase().includes(needle.toLowerCase());
    }
    return hasWholeWord(hay, needle);
  });
}

function buildKbBlob(): string {
  return KNOWLEDGE_CHUNKS.map((c) => `${c.title}\n${c.text}\n${(c.keywords ?? []).join(" ")}`).join("\n");
}

const KB_BLOB = buildKbBlob();

export function kbHasTerm(term: string): boolean {
  return passageHasTerm(KB_BLOB, term);
}

const LISTED_TECH_TOKENS = new Set([
  "jwt", "redis", "react", "flask", "kafka", "postgres", "postgresql",
  "sql", "docker", "fastapi", "python", "typescript", "celery", "pgvector",
  "presidio", "terraform", "opa", "ollama", "langchain", "langgraph",
  "n8n", "opentelemetry", "agent", "agents",
]);

function looksLikeTech(term: string): boolean {
  const lower = term.toLowerCase();
  // Bare "go" is the English verb in recruiter copy; golang is the tech token.
  if (lower === "go") return false;
  if (KNOWN_TECH_TERMS.includes(lower)) return true;
  if (LISTED_TECH_TOKENS.has(lower)) return true;
  if (/[.#+]/.test(term)) return true;
  if (/\d/.test(term) && /[a-z]/i.test(term)) return true;
  return false;
}

export function contentTerms(question: string): string[] {
  const lower = question.toLowerCase();
  const phrases = MULTIWORD_SUBJECTS.filter((p) => lower.includes(p));
  const covered = new Set<string>();
  for (const phrase of phrases) {
    for (const token of tokenize(phrase)) covered.add(token);
  }
  const singles = tokenize(question).filter(
    (t) => !NAME_TOKENS.has(t) && !MODIFIERS.has(t) && !covered.has(t),
  );
  return [...new Set([...phrases, ...singles])];
}

export type GroundingResult = {
  ok: boolean;
  knownTerms: string[];
  unknownTech: string[];
  unmatchedNonTech: string[];
};

const QUESTION_STARTERS = new Set([
  "What", "Where", "Which", "Who", "Why", "How", "Does", "Did", "Do",
  "Has", "Have", "Had", "Is", "Are", "Was", "Were", "Can", "Could",
  "Would", "Will", "Should", "Tell", "Give", "Please", "Also", "Briefly",
  "Open", "Walk", "Name", "Explain", "Introduce", "Share", "Show",
  "Any", "One", "Who's",
]);

function capitalisedProperNouns(question: string): Set<string> {
  const out = new Set<string>();
  const tokens = question.match(/\b[A-Z][A-Za-z]{1,}\b/g) ?? [];
  for (const token of tokens) {
    if (QUESTION_STARTERS.has(token)) continue;
    if (token === "Mike" || token === "Ncube") continue;
    if (token === "CV" || token === "IT" || token === "SA" || token === "OS" || token === "AI") continue;
    out.add(token.toLowerCase());
  }
  return out;
}

// Words that name one source in its title ("recommender" for the recommender data
// pipeline): the subject of that source, however the visitor capitalises it.
const TITLE_SUBJECTS: ReadonlySet<string> = (() => {
  const chunksWith = (word: string) =>
    KNOWLEDGE_CHUNKS.filter((c) => passageHasTerm(`${c.title} ${c.text}`, word)).length;
  const words = new Set(KNOWLEDGE_CHUNKS.flatMap((c) => tokenize(c.title)));
  return new Set([...words].filter((w) => w.length >= 5 && chunksWith(w) === 1));
})();

export function isTitleSubject(term: string): boolean {
  return TITLE_SUBJECTS.has(term.toLowerCase());
}

function isDistinctiveUnmatched(term: string, proper: Set<string>): boolean {
  if (term.includes(" ")) return true;
  if (MULTIWORD_SUBJECTS.includes(term.toLowerCase())) return true;
  if (RELATED_TERMS[term.toLowerCase()]) return true;
  if (looksLikeTech(term)) return true;
  if (TITLE_SUBJECTS.has(term.toLowerCase())) return true;
  // In-domain capitalised entities (Sentinel, ZDI) must appear in the candidate.
  // Visitor names and off-domain proper nouns are not asked-for content.
  return proper.has(term.toLowerCase()) && kbHasTerm(term);
}

export function distinctiveContentTerms(question: string): string[] {
  const proper = capitalisedProperNouns(question);
  return contentTerms(question).filter((term) => isDistinctiveUnmatched(term, proper));
}

export function expandQuery(query: string): string {
  const extras: string[] = [];
  for (const term of contentTerms(query)) {
    const related = RELATED_TERMS[term.toLowerCase()];
    if (related) extras.push(...related.slice(0, 4));
  }
  const lower = query.toLowerCase();
  for (const phrase of Object.keys(RELATED_TERMS)) {
    if (phrase.includes(" ") && lower.includes(phrase)) {
      extras.push(...RELATED_TERMS[phrase].slice(0, 4));
    }
  }
  if (extras.length === 0) return query;
  return `${query} ${[...new Set(extras)].join(" ")}`;
}

export function evaluateGrounding(question: string, answer: string): GroundingResult {
  const terms = contentTerms(question);
  const proper = capitalisedProperNouns(question);
  const knownTerms: string[] = [];
  const unknownTech: string[] = [];
  const unmatchedNonTech: string[] = [];
  for (const term of terms) {
    if (termMatchNeedles(term).some((needle) => passageHasTerm(answer, needle))) {
      knownTerms.push(term);
      continue;
    }
    if (term === "go" && proper.has("go") && !kbHasTerm("go") && !kbHasTerm("golang")) {
      unknownTech.push(term);
      continue;
    }
    if (looksLikeTech(term) && !kbHasTerm(term)) {
      unknownTech.push(term);
      continue;
    }
    if (isDistinctiveUnmatched(term, proper)) unmatchedNonTech.push(term);
  }
  const genericOnly = unmatchedNonTech.length === 0 && unknownTech.length === 0;
  return {
    ok: unmatchedNonTech.length === 0
      && (knownTerms.length > 0 || (genericOnly && unknownTech.length === 0)),
    knownTerms,
    unknownTech,
    unmatchedNonTech,
  };
}

export function prettySubject(term: string): string {
  // Keep the visitor's own casing ("EKS", "PyTorch") when they gave one.
  if (/[A-Z]/.test(term)) return term;
  const lower = term.toLowerCase();
  if (lower === "nlp") return "NLP";
  if (lower === "mlops") return "MLOps";
  if (lower === "ci/cd") return "CI/CD";
  if (lower === "gcp") return "GCP";
  if (lower === "golang") return "Go";
  if (lower === "jwt") return "JWT";
  return lower.replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

export function unknownTechNote(unknown: string[]): string {
  if (unknown.length === 0) return "";
  // "golang" and "go" both print as "Go"; name each technology once.
  const names = [...new Map(unknown.map((term) => [prettySubject(term).toLowerCase(), prettySubject(term)])).values()];
  const joined = names.length === 1
    ? names[0]
    : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  const verb = names.length === 1 ? "isn't" : "aren't";
  return `${joined} ${verb} listed in Mike's portfolio.`;
}

export function listedTechInQuestion(question: string): string[] {
  const extra: string[] = [];
  const lower = question.toLowerCase();
  if (/\bgolang\b/.test(lower) || /\b(?:knows?|used?|using|built with)\s+go\b/.test(lower)
    || /\band\s+go\b/.test(lower) || /\bgo\s+and\b/.test(lower)) {
    extra.push("go");
  }
  return [...new Set([
    ...KNOWN_TECH_TERMS.filter((term) => {
      if (term === "go") return extra.includes("go");
      if (term.includes(" ") || term.includes(".") || term.includes("/")) return lower.includes(term);
      return hasWholeWord(question, term);
    }),
    ...extra,
  ])];
}

// Words that frame a sentence without asserting anything about Mike's work.
// Everything else in a cited sentence (qualifiers, purposes, tools, statuses,
// numbers, negations) is a claim and must appear in a block the answer cites.
const CLAIM_FRAME_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "so", "as", "at", "by", "for", "from",
  "in", "into", "of", "on", "onto", "to", "with", "within", "via", "per", "than",
  "then", "that", "this", "these", "those", "which", "who", "whom", "whose", "what",
  "where", "when", "how", "while", "if", "is", "are", "was", "were", "be", "been",
  "being", "am", "has", "have", "had", "having", "do", "does", "did", "can", "could",
  "will", "would", "should", "may", "might", "must", "i", "you", "your", "he", "him",
  "his", "himself", "it", "its", "they", "them", "their", "there", "here", "both",
  "each", "also", "such", "same", "yes", "mike", "ncube", "use", "uses", "used",
  "using", "include", "includes", "included", "including", "build", "builds", "built",
  "work", "works", "worked", "working", "called", "named", "project", "projects",
  "system", "systems", "list", "lists", "listed", "mention", "mentions", "mentioned",
  "describe", "describes", "described", "note", "notes", "noted", "state", "states",
  "stated", "according", "source", "sources", "context", "email", "contact", "reach",
  // Generic verbs of making and enabling, like build/built above.
  "design", "designs", "designed", "designing", "let", "lets", "letting", "underlying",
  // Generic verbs of doing and handling. The claim is in their objects ("handles
  // retries"), which still need support.
  "treat", "treats", "treated", "treating", "handle", "handles", "handled", "handling",
  "make", "makes", "made", "making", "give", "gives", "gave", "given", "giving", "get",
  "gets", "got", "gotten", "getting", "take", "takes", "took", "taken", "taking", "run",
  "runs", "ran", "running", "rely", "relies", "relied", "relying", "apply", "applies",
  "applied", "applying", "follow", "follows", "followed", "following", "keep", "keeps",
  "kept", "keeping", "put", "puts", "provide", "provides", "provided", "providing",
  "help", "helps", "helped", "helping", "add", "adds", "added", "adding", "serve",
  "serves", "served", "serving", "support", "supports", "supported", "supporting",
  "come", "comes", "came", "coming",
  // Prepositions of route and scope; the places and tools they introduce are the claims.
  "through", "across", "throughout", "about", "among", "around", "upon", "toward",
  "towards",
  // Competence words frame a listed skill ("experienced in Python"); the skill is the claim.
  "experience", "experienced", "familiar", "proficient", "skilled", "know", "knows",
  // Connectives.
  "because", "since", "therefore", "thus", "hence", "whenever", "once", "every",
]);

// Irregular verb forms whose stem differs from the base form a block uses
// ("taken" for "takes"). Money verbs are left out: "paid" must be stated, not inferred.
const IRREGULAR_BASE: Record<string, string> = {
  took: "take", taken: "take", ran: "run", wrote: "write", written: "write",
  chose: "choose", chosen: "choose", sent: "send", held: "hold", fell: "fall",
  began: "begin", begun: "begin", caught: "catch", found: "find", led: "lead", met: "meet",
  shown: "show", grown: "grow", drawn: "draw", done: "do", gone: "go", seen: "see",
  rode: "ride", told: "tell", thought: "think",
};

// General request words a visitor's wh-question may lend an answer ("send", "offer").
const REQUEST_WORDS: Set<string> = new Set(
  GENERIC_WORD_LIST.flatMap((w) => [w, stem(w), squash(w)]),
);

const NEGATION_WORDS = new Set(["not", "no", "never", "none", "without", "neither", "nor"]);

export type CitedChunk = { id?: string; text: string };

type ChunkIndex = {
  id?: string;
  projects: string[];
  lower: string;
  squashed: string;
  words: Set<string>;
  stems: Set<string>;
};

function indexChunk(chunk: CitedChunk): ChunkIndex {
  const lower = chunk.text.toLowerCase();
  // A block belongs to the project its title (first line) names, as in the prompt's PROJECT labels.
  const title = chunk.text.split("\n")[0] ?? "";
  const projects = namedProjects(title).map((p) => p.id);
  const words = new Set<string>();
  const stems = new Set<string>();
  for (const raw of lower.match(/[a-z0-9][a-z0-9.+#&_/-]*/g) ?? []) {
    const word = raw.replace(/[.\-/]+$/, "");
    // Link pieces count too: "github.com/MikeNcube" names GitHub.
    const linkPieces = word.includes("/") ? word.split(/[-/.]/) : [];
    for (const piece of [word, squash(word), ...word.split(/[-/]/), ...linkPieces]) {
      if (!piece) continue;
      words.add(piece);
      stems.add(stem(piece));
    }
  }
  return { id: chunk.id, projects, lower, squashed: squash(lower), words, stems };
}

function belongsTo(chunk: ChunkIndex, project: { id: string; sourceIds: string[] }): boolean {
  return (chunk.id !== undefined && project.sourceIds.includes(chunk.id)) || chunk.projects.includes(project.id);
}

function chunkSupports(chunk: ChunkIndex, word: string): boolean {
  if (/^\d+(?:\.\d+)?$/.test(word)) {
    const escaped = word.replace(/\./g, "\\.");
    return new RegExp(`(^|[^0-9.])${escaped}($|[^0-9]|\\.(?![0-9]))`).test(chunk.lower);
  }
  // Compounds ("rule-based") and phrases must appear whole, with or without the
  // hyphen or space ("front-end", "front end", "frontend"); their parts do not support them.
  if (word.includes("-") || word.includes(" ")) {
    return chunk.lower.includes(word) || chunk.lower.includes(word.replace(/-/g, " "))
      || chunk.squashed.includes(squash(word));
  }
  if (/[.@+#&_]/.test(word)) return chunk.lower.includes(word);
  const base = IRREGULAR_BASE[word];
  return chunk.words.has(word) || chunk.stems.has(stem(word))
    || Boolean(base && (chunk.words.has(base) || chunk.stems.has(stem(base))));
}

// A category noun ("database", "frontend") is supported by a block naming a member.
function categorySupported(word: string, pool: ChunkIndex[]): boolean {
  const members = categoryMembers(word);
  return members.length > 0 && members.some((member) => pool.some((c) => chunkSupports(c, member)));
}

const CLAIM_PHRASES: readonly string[] = [...new Set([...THESAURUS_PHRASES, ...CATEGORY_PHRASES])]
  .sort((a, b) => b.length - a.length);

// A word, or one of its listed synonyms, appears in the chunk.
function chunkSupportsOrSynonym(chunk: ChunkIndex, word: string): boolean {
  return chunkSupports(chunk, word) || synonymsOf(word).some((syn) => chunkSupports(chunk, syn));
}

// Thesaurus and category phrases ("continuous integration", "vector store") are
// one claim each; the rest are words.
function claimUnits(sentence: string): string[] {
  let rest = sentence.replace(/\[\d+\]/g, " ");
  const units: string[] = [];
  for (const phrase of CLAIM_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (re.test(rest)) {
      units.push(phrase);
      rest = rest.replace(re, " ");
    }
  }
  return [...units, ...claimWords(rest)];
}

function claimWords(sentence: string): string[] {
  const raws = sentence.replace(/\[\d+\]/g, " ").match(/[A-Za-z0-9@][A-Za-z0-9@.+#&'’_/-]*/g) ?? [];
  const out: string[] = [];
  for (const raw of raws) {
    let word = raw.toLowerCase().replace(/['’]s$/, "").replace(/[.'’\-/]+$/, "");
    if (/n['’]t$/.test(word)) word = "not";
    if (!word) continue;
    // Slash lists ("caching/deduplication") assert each part; URLs and emails stay whole.
    const parts = /:\/\/|@/.test(word) ? [word] : word.split("/").filter(Boolean);
    for (const part of parts) {
      if (!CLAIM_FRAME_WORDS.has(part)) out.push(part);
    }
  }
  return out;
}

// Keys a question contributes: each word, its stem, its squashed form, and its synonyms.
function questionKeys(question: string): Set<string> {
  const keys = new Set<string>();
  for (const unit of claimUnits(question)) {
    for (const form of [unit, ...synonymsOf(unit)]) {
      keys.add(form);
      keys.add(squash(form));
      keys.add(stem(squash(form)));
    }
  }
  return keys;
}

// A wh-question's own words describe what is wanted ("where do I send an offer"),
// so an answer may repeat them when they are general request words, or when a
// cited block states what they cover ("frontend" beside TypeScript and React).
// A topic word the cited blocks say nothing about ("PII masking" in a block with
// no PII) is a presupposition, not support. A yes/no question's words are the
// claim under test, and project sentences need sources, so neither gets this.
function questionAllows(word: string, keys: Set<string>, pool: ChunkIndex[]): boolean {
  if (keys.size === 0) return false;
  if (NEGATION_WORDS.has(word) || /\d/.test(word) || /[-/]/.test(word)) return false;
  if (TECH_LEXICON_SET.has(word)) return false;
  const forms = [word, squash(word), stem(squash(word))];
  if (!forms.some((form) => keys.has(form))) return false;
  if (forms.some((form) => REQUEST_WORDS.has(form))) return true;
  const related = (RELATED_TERMS[word] ?? []).filter((needle) => needle !== word);
  return related.some((needle) => pool.some((c) => chunkSupports(c, needle)));
}

export type UnsupportedClaim = { sentence: string; words: string[] };

export type ValidationOptions = { question?: string };

// Every cited sentence must be supported word by word by blocks the answer cites.
// A sentence that names a project may only lean on that project's blocks or on
// general blocks, and a technology linked to a named project must be stated in that
// project's own block, so a tool listed elsewhere cannot be credited to it.
export function findUnsupportedClaims(
  text: string,
  chunks: Array<string | CitedChunk>,
  options: ValidationOptions = {},
): UnsupportedClaim[] {
  const indexed = chunks.map((c) => indexChunk(typeof c === "string" ? { text: c } : c));
  const sentences = splitIntoSentences(text).map((p) => p.trim()).filter(Boolean);
  const answerCites = new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
  const answerCited = [...answerCites].map((n) => indexed[n - 1]).filter((c): c is ChunkIndex => Boolean(c));
  const keys = options.question && isWhQuestion(options.question) ? questionKeys(options.question) : new Set<string>();
  const problems: UnsupportedClaim[] = [];
  for (const sentence of sentences) {
    const cites = [...sentence.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    if (cites.length === 0) continue;
    const cited = cites.map((n) => indexed[n - 1]).filter((c): c is ChunkIndex => Boolean(c));
    const projects = namedProjects(sentence);
    // Another project's block cannot vouch for a sentence about this one, even when cited.
    const pool = projects.length === 0
      ? answerCited
      : answerCited.filter((c) => c.projects.length === 0 || projects.some((p) => belongsTo(c, p)));
    // A category noun is looser than a word, so only the sentence's own blocks may vouch for it.
    const ownCited = cited.filter((c) => pool.includes(c));
    const missing = new Set<string>();
    if (cited.length === 0) missing.add(`[${cites.join("][")}]`);
    for (const word of claimUnits(sentence)) {
      const supported = pool.some((c) => chunkSupportsOrSynonym(c, word))
        || categorySupported(word, ownCited)
        || (projects.length === 0 && questionAllows(word, keys, pool));
      if (!supported) {
        missing.add(word);
        continue;
      }
      if (!TECH_LEXICON_SET.has(word)) continue;
      for (const project of projects) {
        const own = pool.filter((c) => belongsTo(c, project));
        if (!own.some((c) => chunkSupports(c, word))) missing.add(`${word}@${project.id}`);
      }
    }
    if (missing.size > 0) problems.push({ sentence, words: [...missing] });
  }
  return problems;
}

// Returns the cited sentences, or "" when any cited sentence carries a claim its
// blocks do not support. Uncited sentences are dropped. An empty result sends the
// caller to the static or refusal path instead of showing a partly invented answer.
export function validateModelSentences(
  text: string,
  chunks: Array<string | CitedChunk>,
  options: ValidationOptions = {},
): string {
  if (findUnsupportedClaims(text, chunks, options).length > 0) return "";
  return splitIntoSentences(text)
    .map((p) => p.trim())
    .filter((p) => /\[\d+\]/.test(p))
    .join(" ");
}
