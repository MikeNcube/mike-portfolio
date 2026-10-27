// Deterministic grounding gate and model-output validator.
// A candidate answers a question only if content terms are in the answer/KB
// (or related stems). Unknown tech gets an "isn't listed" note. Other unmatched
// terms fail the candidate.

import { tokenize } from "./bm25";
import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { splitIntoSentences } from "./normalise-answer";

const NAME_TOKENS = new Set(["mike", "ncube"]);

const MODIFIERS = new Set([
  "favourite", "favorite", "favourites", "favorites",
  "main", "best", "current", "strongest", "proudest", "flagship", "headline",
  "open", "still", "really", "please", "also", "quick", "brief", "summary",
  "tell", "give", "describe", "introduce", "explain", "share", "show",
  "looking", "want", "wants", "hoping", "after", "next", "big", "part",
  "know", "knows", "knew", "used", "using", "use", "uses",
  "built", "build", "building", "done", "hold", "holds", "held",
  "work", "works", "working", "worked", "experience", "experienced",
  "take", "taking", "consider", "considering", "keep", "keeps",
  "approach", "approaches", "handle", "handles", "handling",
  "people", "person", "someone", "anyone", "anything", "something",
  "available", "availability", "hire", "hiring", "hireable",
  "good", "fit", "different", "standout", "new", "our", "company",
  "org", "organisation", "organization", "value", "bring", "benefit",
  "title", "role", "roles", "job", "jobs", "position",
  "tool", "tools", "skill", "skills", "year", "years",
  "team", "remote", "remotely", "city", "contract", "start",
  "manage", "manager", "month", "live", "based", "currently",
  "detail", "details", "more", "specifically", "exactly", "briefly",
  "rate", "notice", "relocate", "relocation", "timezone", "zone",
  "ai", "llm", "tech", "most", "much", "many", "does", "mike",
  "part", "region", "area", "province", "country", "metro", "place",
  "location", "home", "kind", "type", "sort", "reason", "reasons",
  "highlight", "highlights", "resume", "cv", "profile", "bio",
  "overview", "summary", "nutshell", "department", "headline",
  "orchestration", "library", "libraries", "agent", "agents",
  "before", "writing", "files", "file", "writes",
  "where", "when", "why", "whose", "whom",
  "keep", "code", "reliable", "reliability", "quality",
  "chatbot", "chat", "assistant", "running", "paused", "serving",
  "stationed", "operate", "operates", "geography", "urban",
  "strong", "candidate", "candidates", "impressive", "proudest",
  "interview", "reasons",
  "systems", "framework", "frameworks",
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
  go: ["golang", "go"],
  security: ["security", "compliance", "popia", "secure"],
  compliance: ["compliance", "popia"],
  hybrid: ["hybrid", "remote", "remote-first"],
  jwt: ["jwt"],
  react: ["react"],
  redis: ["redis"],
  flask: ["flask"],
  kafka: ["kafka"],
  programming: ["programming", "python", "typescript", "language", "languages"],
  language: ["language", "languages", "python", "typescript", "programming"],
  languages: ["languages", "language", "python", "typescript", "programming"],
  orchestration: ["orchestration", "langgraph", "langchain"],
  libraries: ["libraries", "library", "langgraph", "langchain"],
  library: ["library", "libraries", "langgraph", "langchain"],
  agents: ["agents", "agent", "langgraph"],
  writing: ["writing", "writes", "write", "files"],
  files: ["files", "file", "writes", "write"],
  chatbot: ["chatbot", "assistant", "gemini", "groq", "rag"],
  reliable: ["reliable", "reliability", "tests", "testing", "validation"],
  quality: ["quality", "tests", "testing"],
  frameworks: ["frameworks", "framework", "langgraph", "langchain"],
  framework: ["framework", "frameworks", "langgraph", "langchain"],
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
  "cape town", "south africa", "world cup",
  "proactive sentinel", "chat assistant", "this assistant",
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
    out.add(`${stem}e`);
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

function looksLikeTech(term: string): boolean {
  const lower = term.toLowerCase();
  if (KNOWN_TECH_TERMS.includes(lower)) return true;
  if (RELATED_TERMS[lower]) return true;
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

function isDistinctiveUnmatched(term: string): boolean {
  if (term.includes(" ")) return true;
  if (looksLikeTech(term)) return true;
  return term.length > 5;
}

export function evaluateGrounding(question: string, answer: string): GroundingResult {
  const terms = contentTerms(question);
  const knownTerms: string[] = [];
  const unknownTech: string[] = [];
  const unmatchedNonTech: string[] = [];
  for (const term of terms) {
    if (termMatchNeedles(term).some((needle) => passageHasTerm(answer, needle))) {
      knownTerms.push(term);
      continue;
    }
    if (looksLikeTech(term) && !kbHasTerm(term)) {
      unknownTech.push(term);
      continue;
    }
    if (isDistinctiveUnmatched(term)) unmatchedNonTech.push(term);
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
  const names = unknown.map(prettySubject);
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

const CLAIM_TOKEN_RE = /\b[A-Z][\w.+-]*|\b\d+(?:\.\d+)?\b/g;

export function validateModelSentences(
  text: string,
  chunkTexts: string[],
): string {
  const parts = splitIntoSentences(text).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const sentence of parts) {
    const cites = [...sentence.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    if (cites.length === 0) continue;
    const cited = cites
      .map((n) => chunkTexts[n - 1] ?? "")
      .join("\n");
    if (!cited.trim()) continue;
    const tokens = sentence.replace(/\[\d+\]/g, "").match(CLAIM_TOKEN_RE) ?? [];
    let ok = true;
    for (const token of tokens) {
      if (/^(I|A|The|This|That|He|His|Mike|Ncube)$/.test(token)) continue;
      if (!hasWholeWord(cited, token) && !cited.toLowerCase().includes(token.toLowerCase())) {
        ok = false;
        break;
      }
    }
    if (ok) kept.push(sentence);
  }
  return kept.join(" ");
}

