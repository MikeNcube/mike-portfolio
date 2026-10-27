// Deterministic grounding gate and model-output validator.
// A candidate answers a question only if content terms are in the answer/KB
// (or related stems). Unknown tech gets an "isn't listed" note. Other unmatched
// terms fail the candidate.

import { tokenize } from "./bm25";
import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { splitIntoSentences } from "./normalise-answer";

const NAME_TOKENS = new Set(["mike", "ncube"]);

// True function / question-framing words. Meaning-bearing nouns (manager, remote,
// experience, rate, notice, hire, paid, people) must remain content terms.
const MODIFIERS = new Set([
  "favourite", "favorite", "favourites", "favorites",
  "please", "also", "really", "quite", "briefly", "specifically", "exactly",
  "actually", "official", "currently", "still", "today", "nowadays", "lately",
  "presently", "already",
  "tell", "give", "describe", "introduce", "explain", "share", "show", "name",
  "walk",
  "looking", "want", "wants", "hoping", "seeking", "next",
  "know", "knows", "knew", "used", "using", "use", "uses",
  "built", "build", "builds", "building", "made", "created", "developed",
  "need", "needs", "needed", "done", "doing",
  "any", "some", "something", "someone", "anyone", "anything",
  "certain", "particular", "typical", "usual", "specific",
  "more", "most", "much", "many", "main", "best", "quick", "brief",
  "compare", "compared", "versus", "vs",
  "open", "go", "his", "our", "new", "good",
  "where", "when", "why", "whose", "whom",
  "summary", "overview", "nutshell", "detail", "details",
  "listed", "mentioned", "include", "prefer",
  "list", "lists",
  "up",
  "printed", "print",
  "one", "first", "kind", "type", "sort",
  "only", "even",
  "recruiter", "recruiters", "recruiting",
  "part", "running", "run", "runs",
  "hold", "holds", "held",
  "handle", "handles", "handling", "handled",
  "instruction", "instructions", "setup",
  "hi", "hey", "hello", "thanks", "thank",
  "big", "small", "tiny", "large", "giant",
  "written", "writes", "write", "writing",
  "out",
  "call", "calls", "called",
  "home",
  "recently", "recent",
  "within",
  "whereabouts",
  "bring", "brings", "bringing",
  "sure", "stay", "stays", "remain", "remains", "remaining",
  "prevent", "prevents", "keep", "keeps", "stop", "stops", "nothing",
  "don",
  "three", "two",
  "land", "landing", "suits", "suit",
  "moment", "ever",
  "taking", "takes", "take",
  "stand", "stands", "outstanding",
  "like", "likes", "liked",
  "now", "right",
  "extra",
  "targeting", "target", "targets",
  "here",
  "without",
  "behind",
  "shows", "show", "showing",
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
  kubernetes: ["kubernetes", "k8s"],
  k8s: ["k8s", "kubernetes"],
  security: ["security", "compliance", "popia", "secure"],
  compliance: ["compliance", "popia"],
  hybrid: ["hybrid", "remote", "remote-first", "remotely"],
  remote: ["remote", "remote-first", "remotely"],
  remotely: ["remotely", "remote", "remote-first"],
  "remote-first": ["remote-first", "remote", "remotely"],
  "on-site": ["on-site", "office-first"],
  "office-first": ["office-first", "on-site"],
  jwt: ["jwt"],
  react: ["react"],
  redis: ["redis"],
  flask: ["flask"],
  kafka: ["kafka"],
  programming: ["programming", "language", "languages"],
  language: ["language", "languages", "programming"],
  languages: ["languages", "language", "programming"],
  orchestration: ["orchestration", "langgraph", "langchain"],
  libraries: ["libraries", "library"],
  library: ["library", "libraries"],
  chatbot: ["chatbot", "assistant"],
  "chat assistant": ["chat assistant", "assistant", "chatbot"],
  "this assistant": ["this assistant", "assistant", "chatbot"],
  reliable: ["reliable", "reliability", "tests", "testing", "validation"],
  quality: ["quality", "tests", "testing"],
  testing: ["testing", "tests", "test", "tested"],
  tests: ["tests", "testing", "test", "tested"],
  tested: ["tested", "test", "tests", "testing"],
  test: ["test", "tests", "testing", "tested"],
  frameworks: ["frameworks", "framework"],
  framework: ["framework", "frameworks"],
  "web framework": ["web framework", "fastapi", "flask", "next.js"],
  country: ["country", "based"],
  area: ["area", "based", "city"],
  region: ["region", "based"],
  province: ["province", "based"],
  location: ["location", "based"],
  located: ["located", "based"],
  city: ["city", "based", "lives", "living"],
  based: ["based", "lives", "living"],
  living: ["living", "lives", "based"],
  lives: ["lives", "living", "based"],
  live: ["live", "lives", "living"],
  reside: ["reside", "resides", "lives", "living", "based"],
  resides: ["resides", "reside", "lives", "living", "based"],
  sa: ["sa", "south africa"],
  "south africa": ["south africa", "sa", "south african"],
  "south african": ["south african", "south africa"],
  title: ["title", "role", "roles", "job", "position"],
  role: ["role", "roles", "title", "job", "position"],
  roles: ["roles", "role", "title", "job", "position"],
  job: ["job", "title", "role", "roles", "position"],
  position: ["position", "title", "role", "roles", "job"],
  employer: ["employer", "company", "firm", "organisation", "organization"],
  company: ["company", "employer", "firm"],
  organisation: ["organisation", "organization", "company", "employer", "org"],
  organization: ["organization", "organisation", "company", "employer", "org"],
  org: ["org", "organisation", "organization", "company", "employer"],
  firm: ["firm", "company", "employer"],
  employ: ["employ", "employs", "employed", "employer"],
  employs: ["employs", "employ", "employed", "employer"],
  employed: ["employed", "employ", "employs", "employer"],
  contract: ["contract", "full-time"],
  "full-time": ["full-time", "contract"],
  contractor: ["contractor", "contract"],
  freelance: ["freelance", "contract"],
  "side gigs": ["side gigs", "contract", "freelance"],
  moonlight: ["moonlight", "contract", "freelance"],
  hunting: ["hunting", "job hunting", "hire"],
  seat: ["seat", "role", "position", "job"],
  "job family": ["job family", "role", "roles", "job"],
  hire: ["hire", "hiring", "interview"],
  hiring: ["hiring", "hire", "interview"],
  interview: ["interview", "hire", "hiring"],
  manager: ["manager"],
  manage: ["manage", "managed", "manages", "supervise", "supervised"],
  supervise: ["supervise", "supervised", "manage", "managed"],
  supervised: ["supervised", "supervise", "manage", "managed"],
  "tech lead": ["tech lead", "team lead"],
  "people manager": ["people manager"],
  skills: ["skills", "skill", "stack"],
  skill: ["skill", "skills", "stack"],
  experience: ["experience", "experienced"],
  "in production": ["in production", "production", "live", "shipped"],
  production: ["production", "live", "shipped"],
  prod: ["prod", "production"],
  shipping: ["shipping", "shipped", "production"],
  defects: ["defects", "bugs"],
  deployed: ["deployed", "deploy", "deployment", "hosted", "shipped"],
  deploy: ["deploy", "deployed", "deployment", "hosted", "shipped"],
  deployment: ["deployment", "deployed", "deploy", "hosted"],
  hosted: ["hosted", "deployed", "deploy"],
  people: ["people", "person"],
  person: ["person", "people"],
  developer: ["developer", "developers"],
  developers: ["developers", "developer"],
  work: ["work", "works", "working"],
  works: ["works", "work", "working"],
  projects: ["projects", "project"],
  project: ["project", "projects"],
  systems: ["systems", "system", "shipped"],
  system: ["system", "systems"],
  education: ["education", "degree", "formal"],
  degree: ["degree", "formal", "education"],
  studied: ["studied", "degree", "formal"],
  study: ["study", "degree", "formal"],
  learn: ["learn", "learned", "studied", "degree", "education"],
  learned: ["learned", "learn", "studied", "degree", "education"],
  university: ["university", "degree", "education"],
  college: ["college", "degree", "education"],
  certifications: ["certifications", "degree"],
  "self-taught": ["self-taught", "degree", "education"],
  years: ["years", "year"],
  year: ["year", "years"],
  reason: ["reason", "reasons"],
  reasons: ["reasons", "reason"],
  backend: ["backend"],
  frontend: ["frontend"],
  stack: ["stack"],
  persistence: ["persistence", "database", "postgresql", "postgres"],
  stores: ["stores", "database", "postgresql", "postgres"],
  "e-signature": ["e-signature", "e-signatures", "signature"],
  "e-signatures": ["e-signatures", "e-signature", "signature"],
  "approval workflows": ["approval workflow", "approval workflows"],
  "state machine": ["state machine"],
};

export const KNOWN_TECH_TERMS = [
  "kubernetes", "k8s", "eks", "rust", "golang", "java", "azure", "gcp", "google cloud",
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
  "cape town", "south africa", "south african", "world cup", "computer science",
  "proactive sentinel", "chat assistant", "this assistant",
  "state machine", "e-signature", "e-signatures", "approval workflow",
  "approval workflows", "self-taught", "web framework", "linkedin headline",
  "email signature", "org chart", "employment mode", "office-first",
  "hiring manager",
  "on-site", "serving traffic", "run state", "in production",
  "reporting line", "remote-first", "people manager", "state machine",
  "side gigs", "staff-plus", "job hunting", "model answers",
  "working model", "tech lead", "write-time", "mid-level",
  "job family", "ic role",
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
    const stem = w.slice(0, -2);
    out.add(stem);
    out.add(w.slice(0, -1));
    out.add(`${stem}s`);
  }
  if (w.endsWith("es") && w.length > 4) out.add(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && w.length > 3) {
    out.add(w.slice(0, -1));
  }
  return [...out];
}

export function hasWholeWord(hay: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (word.length <= 5) {
    // Short tokens must not match inside hyphenated compounds
    // ("role" in "role-based", "based" in "shift-based").
    return new RegExp(`(?<![A-Za-z0-9-])${escaped}(?![A-Za-z0-9-])`, "i").test(hay);
  }
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

export function looksLikeTech(term: string): boolean {
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

function visitorIntroNames(question: string): Set<string> {
  const out = new Set<string>();
  const re = /\b(?:i(?:'m| am)|my name is)\s+([A-Z][a-z]+)/gi;
  let match: RegExpExecArray | null = re.exec(question);
  while (match) {
    out.add(match[1].toLowerCase());
    match = re.exec(question);
  }
  return out;
}

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

function isDistinctiveUnmatched(term: string, proper: Set<string>): boolean {
  if (term.includes(" ")) return true;
  if (MULTIWORD_SUBJECTS.includes(term.toLowerCase())) return true;
  if (RELATED_TERMS[term.toLowerCase()]) return true;
  if (looksLikeTech(term)) return true;
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

function relatedCluster(term: string): Set<string> {
  const lower = term.toLowerCase();
  return new Set([lower, ...(RELATED_TERMS[lower] ?? [])]);
}

function relatedToAsked(term: string, asked: string[]): boolean {
  const lower = term.toLowerCase();
  if (asked.includes(lower)) return true;
  if (asked.some((a) => passageHasTerm(a, term) || passageHasTerm(term, a))) return true;
  const cluster = relatedCluster(lower);
  for (const a of asked) {
    if (cluster.has(a)) return true;
    const askedCluster = relatedCluster(a);
    for (const needle of cluster) {
      if (askedCluster.has(needle)) return true;
    }
  }
  return false;
}

function isStrongCannedLemma(term: string): boolean {
  const lower = term.toLowerCase();
  if (looksLikeTech(lower)) return true;
  if (/\b(?:lead|manager|approver|architecture|github|linkedin)\b/.test(lower)) return true;
  return false;
}

// True when a canned question does not introduce extra strong lemmas the visitor did not ask.
// Asked terms are still required in the canned ANSWER by evaluateGrounding.
export function cannedFitsQuestion(question: string, cannedQuestion: string): boolean {
  const asked = contentTerms(question).map((t) => t.toLowerCase());
  for (const term of contentTerms(cannedQuestion)) {
    if (!isStrongCannedLemma(term)) continue;
    if (!relatedToAsked(term, asked)) return false;
  }
  return true;
}

export function evaluateGrounding(question: string, answer: string): GroundingResult {
  const terms = contentTerms(question);
  const proper = capitalisedProperNouns(question);
  const visitorNames = visitorIntroNames(question);
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
    // Introduced visitor names ("Hi, I'm Dan") are not asked-for content.
    // Off-domain proper nouns (Bitcoin, FIFA) still fail the candidate.
    if (visitorNames.has(term.toLowerCase())) {
      continue;
    }
    unmatchedNonTech.push(term);
  }
  const genericOnly = unmatchedNonTech.length === 0 && unknownTech.length === 0;
  const GENERIC_CARRIERS = new Set([
    "experience", "experienced", "years", "year", "work", "works", "working",
    "skills", "skill", "stack", "background", "career",
    "production", "systems", "system", "deployed", "deploy", "deployment",
    "pipelines", "pipeline", "programming", "language", "languages",
    "stores", "store", "products", "product",
  ]);
  const distinctiveKnown = knownTerms.some((t) => !GENERIC_CARRIERS.has(t.toLowerCase()));
  const ok = unmatchedNonTech.length === 0 && (
    unknownTech.length === 0
      ? (knownTerms.length > 0 || genericOnly)
      : distinctiveKnown
  );
  return {
    ok,
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
const CLAIM_SKIP = /^(I|A|An|The|This|That|He|His|Him|Mike|Ncube|Sources|Source|Status|Stack|PROJECT|Email|Current|Accounts|IT)$/;

const NUMBER_WORDS = [
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty",
  "seventy", "eighty", "ninety", "hundred", "thousand",
];

const ROLE_CLAIM_RE =
  /\b(?:tech[ -]?lead|team[ -]?lead|engineering lead|led|leading|manages|managed|manager)\b/gi;

const TEAM_SIZE_RE =
  /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty)\s+(?:people|person|engineers?|members?|staff)\b/gi;

function sentenceHasUncitedClaim(sentence: string, cited: string): boolean {
  const hay = sentence.replace(/\[\d+\]/g, "");
  const tokens = hay.match(CLAIM_TOKEN_RE) ?? [];
  for (const token of tokens) {
    if (CLAIM_SKIP.test(token)) continue;
    if (!hasWholeWord(cited, token) && !cited.toLowerCase().includes(token.toLowerCase())) {
      return true;
    }
  }
  const lower = hay.toLowerCase();
  for (const word of NUMBER_WORDS) {
    if (!hasWholeWord(lower, word)) continue;
    if (!hasWholeWord(cited, word) && !cited.toLowerCase().includes(word)) return true;
  }
  for (const term of [...KNOWN_TECH_TERMS, ...LISTED_TECH_TOKENS]) {
    if (term === "go" || term === "agent" || term === "agents") continue;
    if (!hasWholeWord(lower, term) && !lower.includes(term)) continue;
    if (!hasWholeWord(cited, term) && !cited.toLowerCase().includes(term)) return true;
  }
  const roles = hay.match(ROLE_CLAIM_RE) ?? [];
  for (const role of roles) {
    if (!hasWholeWord(cited, role) && !cited.toLowerCase().includes(role.toLowerCase())) {
      return true;
    }
  }
  const sizes = hay.match(TEAM_SIZE_RE) ?? [];
  for (const size of sizes) {
    if (!cited.toLowerCase().includes(size.toLowerCase())) {
      const digits = size.match(/\d+/);
      if (!digits || !hasWholeWord(cited, digits[0])) return true;
    }
  }
  return false;
}

export function validateModelSentences(
  text: string,
  chunkTexts: string[],
  question?: string,
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
    if (sentenceHasUncitedClaim(sentence, cited)) continue;
    kept.push(sentence);
  }
  const joined = kept.join(" ");
  if (!joined) return "";
  if (question && !evaluateGrounding(question, joined).ok) return "";
  return joined;
}

