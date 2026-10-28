// Coverage gate and concept routing for the deterministic answer path.
//
// Every content word in a question must be accounted for before anything is
// answered: it is a general function word, a profile concept synonym, a named
// project or technology, or a word that appears in Mike's knowledge base.
// One unexplained word means the question is about something the portfolio
// does not cover, so the assistant refuses instead of answering a neighbour.
//
// Word lists are thesaurus-style per concept. They must not be copied from
// test or holdout questions; tests/concepts.test.ts enforces that.

import { moneyIsMikes } from "./compensation";
import { asksForMikesNumber } from "./contact-intent";
import { RELATED_TERMS } from "./grounding";
import { namedProjects } from "./intent";
import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { STATIC_ANSWERS } from "./static-answers";
import { stem } from "./stem";
import { TECH_LEXICON, TECH_VENDORS } from "./tech-lexicon";
import { thesaurusWords } from "./thesaurus";
import { GENERIC_WORD_LIST } from "./generic-words";

export { stem };

export type QuestionToken = { raw: string; norm: string; stem: string };

export function questionTokens(question: string): QuestionToken[] {
  return question
    .replace(/[‘’`]/g, "'")
    .replace(/'s\b/gi, "")
    .replace(/'/g, "")
    .split(/[^A-Za-z0-9.+#&/-]+/)
    .map((t) => t.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    .filter(Boolean)
    .map((raw) => ({ raw, norm: raw.toLowerCase(), stem: stem(raw) }));
}


function stemSet(words: readonly string[]): Set<string> {
  return new Set(words.map(stem));
}

const GENERIC_STEMS = stemSet(GENERIC_WORD_LIST);

type Lexicon = {
  singles: Map<string, string[]>;
  phrases: Array<{ stems: string[]; ids: string[] }>;
  // "why ... hire": words that must appear in this order, with anything between.
  gapped: Array<{ stems: string[]; ids: string[] }>;
};

function addTerm(lexicon: Lexicon, term: string, id: string): void {
  if (term.includes("...")) {
    const stems = term.split("...").map((part) => stem(part.trim()));
    lexicon.gapped.push({ stems, ids: [id] });
    return;
  }
  const stems = questionTokens(term).map((t) => t.stem);
  if (stems.length === 0) return;
  if (stems.length === 1) {
    const ids = lexicon.singles.get(stems[0]) ?? [];
    if (!ids.includes(id)) ids.push(id);
    lexicon.singles.set(stems[0], ids);
    return;
  }
  const existing = lexicon.phrases.find((p) => p.stems.join(" ") === stems.join(" "));
  if (existing) {
    if (!existing.ids.includes(id)) existing.ids.push(id);
    return;
  }
  lexicon.phrases.push({ stems, ids: [id] });
}

function buildLexicon(groups: Array<{ id: string; terms: readonly string[] }>): Lexicon {
  const lexicon: Lexicon = { singles: new Map(), phrases: [], gapped: [] };
  for (const group of groups) {
    for (const term of group.terms) addTerm(lexicon, term, group.id);
  }
  lexicon.phrases.sort((a, b) => b.stems.length - a.stems.length);
  return lexicon;
}

const PHONE_NUMBER_TERMS = ["phone number", "phone numbers", "contact number", "contact numbers",
  "cell number", "cell numbers", "cellphone number", "mobile number", "mobile numbers",
  "telephone number", "telephone numbers"];

// Topics the knowledge base cannot answer. A hit refuses with the email fallback.
export const REFUSE_TOPICS: Array<{ id: string; terms: readonly string[] }> = [
  {
    id: "compensation",
    terms: [
      "salary", "salaries", "pay", "paid", "payslip", "paycheck", "paycheque", "wage",
      "wages", "earn", "earns", "earnings", "income", "compensation", "remuneration",
      "remunerate", "remunerated",
      "package", "ctc", "bonus", "bonuses", "equity", "stock options", "raise",
      "take home", "take-home", "day rate", "daily rate", "hourly rate", "rate card",
      "mike rate", "his rate", "rate per", "mike charge", "he charge", "charge per",
      "mike cost", "he cost", "cost to company", "cost to hire", "benefits package",
      "pension", "medical aid", "retainer", "fee", "fees", "invoice", "invoicing",
      "billing", "billable", "negotiable",
    ],
  },
  {
    id: "notice",
    terms: ["notice", "notice period", "resign", "resignation", "garden leave", "leave",
      "leaving", "quit", "quitting", "counter-offer", "counteroffer"],
  },
  {
    id: "references",
    terms: ["references", "referees", "referee", "reference check", "reference checks",
      "background check", "criminal record", "credit check"],
  },
  {
    id: "relocation",
    terms: ["relocate", "relocating", "relocation", "move", "moving", "travel",
      "travelling", "traveling", "emigrate", "emigrating"],
  },
  {
    id: "work-authorisation",
    terms: ["visa", "visas", "permit", "permits", "work permit", "sponsorship", "sponsor",
      "citizen", "citizenship", "passport", "immigration", "right to work", "green card"],
  },
  {
    id: "start-date",
    terms: ["start date", "starting date", "join date", "joining date", "earliest start",
      "start immediately", "start tomorrow", "start asap"],
  },
  {
    id: "age",
    terms: ["age", "aged", "how old", "born", "birthday", "birth", "date of birth", "dob",
      "young", "younger", "older", "retire", "retirement"],
  },
  {
    id: "family",
    terms: ["wife", "husband", "spouse", "girlfriend", "boyfriend", "married", "marriage",
      "marital", "divorced", "mike single", "he single", "kids", "kid", "children", "child", "son",
      "daughter", "parent", "parents", "parenting", "mother", "father", "mom", "mum",
      "dad", "sibling", "siblings", "brother", "sister", "family", "relationship",
      "dating", "wedding", "maiden", "baby", "pregnant", "friend", "friends", "pet",
      "pets", "dog", "dogs", "cat", "cats"],
  },
  {
    id: "beliefs",
    terms: ["religion", "religious", "church", "mosque", "temple", "synagogue", "pray",
      "prayer", "god", "faith", "christian", "muslim", "jewish", "hindu", "atheist",
      "spiritual", "star sign", "zodiac", "horoscope", "astrology", "ghost", "ghosts",
      "superstitious"],
  },
  {
    id: "identity",
    terms: ["nationality", "ethnicity", "ethnic", "race", "tribe", "gender", "sexuality",
      "orientation", "id number", "identity number", "tax number", "social security",
      "ssn", "password", "pin", "credit score", "credit card", "bank account",
      "bank details", "home address", "physical address", "street address",
      // Phone numbers and the phone as a device. Mike's own number is a contact
      // request: analyseQuestion reads it with MIKES_NUMBER_LEXICON before these.
      ...PHONE_NUMBER_TERMS, "phone", "phones", "cellphone", "cell", "smartphone", "iphone",
      "android", "whatsapp", "telephone"],
  },
  {
    id: "spoken-language",
    terms: ["speak", "speaks", "speaking", "spoken", "mother tongue", "native language",
      "home language", "first language", "accent", "english", "french", "zulu", "xhosa",
      "afrikaans", "mandarin", "chinese", "spanish", "german", "portuguese", "shona",
      "ndebele", "sotho", "tswana", "swahili", "arabic", "hindi", "japanese", "italian",
      "dutch", "russian", "bilingual", "multilingual"],
  },
  {
    id: "health",
    terms: ["health", "healthy", "sick", "illness", "disease", "disability", "disabled",
      "allergy", "allergic", "blood", "diet", "vegan", "vegetarian", "weight", "height",
      "tall", "gym", "fitness", "workout", "exercise", "sleep", "smoke", "smoking",
      "drink", "drinking", "alcohol", "coffee", "tea", "meditate", "meditation", "yoga"],
  },
  {
    id: "leisure",
    terms: ["hobby", "hobbies", "pastime", "free time", "spare time", "weekend",
      "weekends", "vacation", "holiday", "holidays", "movie", "movies", "film", "films",
      "music", "band", "song", "songs", "album", "book", "books", "novel", "novels",
      "podcast", "podcasts", "tv", "television", "netflix", "game", "games", "gaming",
      "chess", "guitar", "piano", "sing", "singing", "dance", "dancing", "cook",
      "cooking", "bake", "baking", "gardening", "fishing", "hiking", "camping",
      "photography", "painting", "fan", "celebrity", "celebrities", "food", "restaurant",
      "restaurants", "pizza", "pasta"],
  },
  {
    id: "sport",
    terms: ["sport", "sports", "football", "soccer", "cricket", "rugby", "tennis", "golf",
      "basketball", "baseball", "nba", "nfl", "mlb", "f1", "formula one", "olympics",
      "world cup", "marathon", "marathons", "club"],
  },
  {
    id: "world",
    terms: ["politics", "political", "party", "vote", "voting", "voted", "election",
      "elections", "president", "government", "minister", "parliament", "news",
      "current events", "trivia", "capital", "population", "weather", "forecast",
      "temperature", "stock market", "stocks", "crypto", "bitcoin", "inflation",
      "economy", "war", "calculate", "equation", "math", "maths", "arithmetic",
      "multiply", "divided by", "square root"],
  },
  {
    id: "personal-finance",
    terms: ["rent", "mortgage", "house", "apartment", "car", "cars", "invest",
      "investment", "investing", "investor", "savings", "budget", "debt", "loan",
      "lottery", "gamble", "gambling", "bet", "betting", "net worth", "wealth", "rich"],
  },
  {
    // Visual look of a system or site. The knowledge base describes behaviour, never appearance.
    id: "appearance",
    terms: ["colour", "colours", "color", "colors", "coloured", "colored", "colour scheme",
      "color scheme", "palette", "logo", "logos", "font", "fonts", "typeface", "typography",
      "look and feel", "dark mode", "light mode"],
  },
  {
    // People Mike answers to. The knowledge base names no one but Mike.
    id: "reporting-line",
    terms: ["boss", "bosses", "mike manager", "his manager", "mike line manager",
      "his line manager", "mike supervisor", "his supervisor", "mike superior",
      "his superior", "mike report to", "he report to", "mike answer to", "he answer to",
      "manage mike", "supervise mike"],
  },
  {
    // Probes for implementation internals rather than Mike's work.
    id: "internals",
    terms: ["system prompt", "system prompts", "file path", "file paths", "source path",
      "environment variable", "environment variables", "env var", "env vars", "api key",
      "api keys", "secret key", "access token", "hidden instructions", "your instructions",
      "your prompt", "prompt file"],
  },
  {
    id: "assistant-task",
    terms: ["poem", "joke", "jokes", "recipe", "essay", "homework", "translate",
      "translation", "write me", "write a function", "function that", "write code",
      "my code", "my app", "my bug", "debug my", "fix my", "query that", "script that"],
  },
];

export type ProfileConcept = {
  id: string;
  canonical: string;
  evidence: RegExp;
  terms: readonly string[];
  // A dominant concept names one exact thing (a link, a defence). When asked,
  // the answer must serve it even if another matched concept is also covered.
  dominant?: boolean;
};

// Order is the tie-break: more specific concepts first.
export const PROFILE_CONCEPTS: ProfileConcept[] = [
  {
    id: "linkedin",
    canonical: "What is Mike's LinkedIn?",
    evidence: /linkedin\.com/i,
    terms: ["linkedin", "connect", "connect with", "network", "networking"],
  },
  {
    id: "github",
    canonical: "Show me Mike's GitHub",
    evidence: /github\.com\/MikeNcube/i,
    terms: ["github", "repo", "repos", "repository", "repositories", "source code",
      "open source", "open-source", "code samples", "browse", "public code"],
  },
  {
    id: "injection",
    canonical: "How does Mike defend against prompt injection in his RAG systems?",
    evidence: /word-boundary|refused before retrieval|retrieval gate/i,
    terms: ["jailbreak", "jailbreaks", "jailbreaking", "prompt injection", "injection",
      "injections", "guardrail", "guardrails", "prompt attack", "prompt attacks",
      "adversarial", "manipulate", "manipulation"],
    dominant: true,
  },
  {
    id: "contact",
    canonical: "How can I contact Mike?",
    evidence: /mikencube03@gmail\.com/i,
    terms: ["contact", "contacted", "reach", "reachable", "email", "e-mail", "emails",
      "mail", "mailbox", "inbox", "get in touch", "touch", "message", "dm", "write to",
      "outreach", "correspondence", "book a call", "book a meeting", "schedule a call",
      "set up a call", "arrange a call", "get hold of", "get ahold of", "reach out",
      "talk to", "talk with", "speak to", "speak with", "hear from", "touch base",
      "leave a message", "leave a note", "drop a line", "drop a message", "send a message",
      "send a note",
      // "book" as a verb schedules time; these phrases are matched before the leisure word.
      "to book", "book a", "book an", "book one", "book some", "book time", "book in",
      // Calling him. "phone" alone is a personal device, and a number is his only
      // when the question says so (see MIKES_NUMBER_LEXICON).
      "phone mike", "phone him", "call mike", "call him", "ring mike", "ring him",
      "by phone", "on the phone", "over the phone", "phone call", "a call with"],
  },
  {
    // Working from wherever Mike is. Combined with another place it is still remote
    // work. Dominant: a roles or availability answer that omits the arrangement
    // does not answer a remote question.
    id: "remote",
    canonical: "Does Mike work remotely?",
    evidence: /remote-first/i,
    terms: ["remote", "remotely", "remote-first", "wfh", "work from home",
      "working from home", "distributed", "telecommute", "telework", "from home"],
    dominant: true,
  },
  {
    // Arrangements that put Mike in a physical workplace. Combined with another
    // place they ask about relocation, which the portfolio does not cover.
    id: "workplace",
    canonical: "Does Mike work remotely?",
    evidence: /remote-first/i,
    terms: ["hybrid", "onsite", "on-site", "in-office", "office", "in person",
      "in-person", "desk", "work arrangement", "working arrangement"],
  },
  {
    id: "location",
    canonical: "Where is Mike based?",
    evidence: /Johannesburg/,
    terms: ["based", "base", "located", "location", "locate", "mike live", "he live",
      "reside", "resides", "residence", "resident", "city", "cities", "town", "metro",
      "metropolitan", "urban", "area", "region", "province", "country", "situated",
      "stationed", "whereabouts", "geography", "geographic", "geographically",
      "johannesburg", "joburg", "jozi", "gauteng", "south africa", "sa", "where from"],
  },
  {
    // Places other than Mike's base. Alone they ask where he is; combined with a
    // work arrangement they ask about relocation, which the portfolio does not cover.
    id: "elsewhere",
    canonical: "Where is Mike based?",
    evidence: /Johannesburg/,
    terms: ["cape town", "durban", "pretoria", "tshwane", "sandton", "midrand",
      "centurion", "soweto", "gqeberha", "port elizabeth", "east london",
      "bloemfontein", "polokwane", "mbombela", "nelspruit", "kimberley", "stellenbosch",
      "western cape", "eastern cape", "kwazulu-natal", "kzn", "london", "new york",
      "berlin", "amsterdam", "dubai", "nairobi", "lagos", "harare", "bulawayo",
      "europe", "uk", "usa", "america", "canada", "australia", "germany",
      "netherlands", "ireland", "zimbabwe", "kenya", "nigeria", "abroad", "overseas",
      "international", "internationally"],
  },
  {
    id: "employer",
    canonical: "Where does Mike work?",
    evidence: /Zororo-Phumulani/,
    terms: ["employer", "employers", "employ", "employs", "employed", "company",
      "companies", "firm", "organisation", "organization", "org", "business",
      "workplace", "payroll", "insurer", "funeral", "assurance", "zororo", "phumulani",
      "zororo-phumulani", "work for", "works for", "working for", "day job",
      "affiliated", "affiliation", "who pays"],
  },
  {
    id: "title",
    canonical: "What is Mike's current job title?",
    evidence: /Applied AI Engineer/,
    terms: ["title", "titles", "job title", "designation", "designated", "rank",
      "headline", "styled", "current role", "current position", "position", "job",
      "occupation", "profession", "what he does", "for a living"],
  },
  {
    id: "years",
    canonical: "How many years of experience does Mike have?",
    evidence: /six-plus/i,
    terms: ["years", "year", "tenure", "seniority", "how long", "long has", "career length",
      "decade", "senior"],
  },
  {
    id: "education",
    canonical: "What is Mike's education?",
    evidence: /degree/i,
    terms: ["education", "educated", "degree", "degrees", "university", "universities",
      "college", "school", "schooling", "study", "studied", "studies", "qualification",
      "qualifications", "qualified", "academic", "academics", "diploma", "bachelor",
      "bachelors", "masters", "phd", "graduate", "graduated", "self-taught", "matric",
      "computer science", "alma mater"],
  },
  {
    id: "certifications",
    canonical: "What certifications does Mike hold?",
    evidence: /certification|course/i,
    terms: ["certification", "certifications", "certified", "certificate",
      "certificates", "cert", "certs", "course", "courses", "training", "trained",
      "accreditation", "accredited", "credential", "credentials", "learning",
      "upskilling", "coursera", "professional development", "continuing education",
      "self-study", "exam", "exams", "examination", "examinations", "qualification",
      "qualifications", "sat ... exam", "sit ... exam", "passed ... exam", "pass ... exam"],
  },
  {
    id: "contract",
    canonical: "Would Mike consider a contract role?",
    evidence: /full-time or contract/i,
    terms: ["contract", "contracts", "contractor", "contracting", "freelance",
      "freelancer", "freelancing", "consulting", "consultant", "consult", "part-time",
      "part time", "full-time", "full time", "permanent", "perm", "fixed-term",
      "employment type", "employment mode", "gig", "gigs", "temp", "temporary",
      "moonlight", "moonlighting", "engagement", "engagements", "fte",
      "nights and weekends"],
  },
  {
    id: "availability",
    canonical: "Is Mike available for hire?",
    evidence: /available/i,
    terms: ["available", "availability", "open to work", "open to offers", "hire",
      "hireable", "hiring", "on the market", "job market", "on the books"],
  },
  {
    id: "roles",
    canonical: "What roles is Mike looking for?",
    evidence: /Generative AI Engineer|Target roles/i,
    terms: ["role", "roles", "looking for", "look for", "seeking", "seek", "hoping",
      "hope", "aiming", "aim", "target", "targets", "targeting", "next role",
      "next job", "next position", "job search", "job hunting", "job-hunting",
      "hunting", "opening", "openings", "opportunity", "opportunities", "want", "wants",
      "wanted", "interested in", "pursuing", "seat", "job family"],
  },
  {
    id: "leadership",
    canonical: "Did Mike lead a team?",
    evidence: /four-person|tech lead|sole AI engineer/i,
    terms: ["lead", "leads", "led", "leader", "leadership", "manage", "manages",
      "managed", "manager", "management", "managing", "supervise", "supervised",
      "supervisor", "mentor", "mentored", "mentoring", "direct reports", "reports",
      "people manager", "tech lead", "report to"],
  },
  {
    id: "team",
    canonical: "What is Mike's team size?",
    evidence: /four-person/i,
    terms: ["team", "teams", "team size", "colleagues", "coworkers", "co-workers",
      "teammates", "department", "it team", "it department", "unit", "headcount",
      "peers", "devs", "staff", "squad", "crew", "group"],
  },
  {
    id: "why-hire",
    canonical: "Why should we hire Mike?",
    evidence: /shipped live production|production systems/i,
    terms: ["why ... hire", "why ... pick", "why ... choose", "why ... interview",
      "why ... consider", "makes ... hire", "makes ... different", "makes ... stand",
      "sets ... apart", "stand ... apart",
      "good hire", "great hire", "strong hire", "right hire", "worth hiring",
      "why hire", "should we hire", "should i hire", "reasons to hire",
      "reason to hire", "case for", "pitch", "sell", "stand out", "standout",
      "stands out", "unique", "different", "differentiator", "value", "strong candidate",
      "good fit", "fit", "worth", "convince", "advantage", "interview"],
  },
  {
    id: "strongest",
    canonical: "What is Mike's strongest project?",
    evidence: /Digi App Form|strongest/i,
    // Bare "best" is left out: "the best way to" asks for a method, not a project.
    terms: ["strongest", "best project", "best projects", "best work", "best build",
      "best builds", "best system", "best systems", "best thing", "best piece", "proudest",
      "proud", "flagship", "impressive", "showcase", "favourite project", "favorite project",
      "signature project", "standout project", "greatest", "demo"],
  },
  {
    id: "shipped",
    canonical: "What production systems has Mike shipped?",
    evidence: /Digi App Form|CRM/,
    terms: ["shipped", "ship", "ships", "production", "prod", "in production",
      "live systems", "go live", "went live", "delivered", "deliver", "launched",
      "launch", "released", "release", "deployed", "real users", "users", "customers"],
  },
  {
    id: "testing",
    canonical: "What testing has Mike done?",
    evidence: /\btests?\b|validation/i,
    terms: ["test", "tests", "testing", "tested", "quality", "qa", "coverage", "reliable",
      "reliability", "bugs", "bug", "defects", "unit tests", "evals", "eval",
      "verification", "break", "breaks", "robust", "robustness"],
  },
  {
    // Personal and sensitive data. Dominant: a project list or SOC overview that
    // mentions PII in passing does not say how personal data is handled.
    id: "privacy",
    canonical: "How does Mike handle personal data?",
    evidence: /\bPII\b/,
    terms: ["pii", "personal data", "personal information", "personal info",
      "personal details", "private details", "sensitive details", "identifying details",
      "personally identifiable",
      "personally identifiable information", "private data", "private information",
      "sensitive data", "sensitive information", "special personal information",
      "data protection", "data privacy", "privacy", "popia", "customer data", "client data",
      "user data", "member data", "policyholder data", "data subject", "data subjects",
      "mask", "masks", "masked", "masking", "redact", "redacts", "redacted", "redaction",
      "anonymise", "anonymize", "anonymised", "anonymized", "anonymisation",
      "anonymization", "pseudonymise", "pseudonymize", "encrypt", "encrypts", "encrypted",
      "encryption"],
    dominant: true,
  },
  {
    // Whether model answers can be trusted. Dominant: a list of shipped systems or
    // models does not say how invented answers are prevented.
    id: "grounding",
    canonical: "How does Mike keep LLM answers grounded?",
    evidence: /\bgrounded\b|fallible|\bcit(?:es|ed|ations?)\b|discards chunks/i,
    terms: ["hallucinate", "hallucinates", "hallucinated", "hallucination",
      "hallucinations", "confabulate", "confabulation", "make things up", "makes things up",
      "made up", "made-up", "make up", "makes up", "invent", "invents", "invented", "inventing",
      "fabricate", "fabricates", "fabricated", "fabrication", "accurate", "accuracy",
      "inaccurate", "inaccuracy", "factual", "factually", "truthful", "grounded", "grounding",
      "ungrounded", "trustworthy", "trust the answers", "misinformation", "false answers",
      "false information", "honesty", "error rate", "error rates",
      // "honest" alone is shadowed by the generic "honestly"; these keep it.
      "keep ... honest", "keeps ... honest", "output ... honest", "answer ... honest",
      // Checking that a model's or agent's output is right.
      "verify ... output", "check ... output", "validate ... output", "output ... correct",
      "output ... right", "output ... accurate"],
    dominant: true,
  },
  {
    // How systems are secured: access control, encryption, segregation of duties.
    // Dominant: a list of shipped systems does not say how they are protected.
    id: "security",
    canonical: "How does Mike secure his systems?",
    evidence: /role-based access|access is enforced|capability check|\bJWT\b|tenant isolation|session revocation/i,
    terms: ["security", "secure", "secured", "securing", "secures", "access control",
      "access controls", "authentication", "authorisation", "authorization", "permissions",
      "rbac", "role-based access", "hardening", "harden", "hardened", "vulnerability",
      "vulnerabilities", "attack", "attacks", "attacker", "attackers", "threat", "threats",
      "security measures", "security controls", "unauthorised", "unauthorized",
      "unauthorised access", "unauthorized access", "breach", "breaches", "intrusion",
      "intruders"],
    dominant: true,
  },
  {
    // Money moving through a system Mike built ("does it pay suppliers"). Mike's own
    // pay is a refusal topic; analyseQuestion keeps the two apart.
    id: "payments",
    canonical: "Do Mike's systems make payments?",
    evidence: /never pays|bank file|marks anything as paid|cash services/i,
    terms: ["pay", "pays", "paying", "paid", "payment", "payments", "payout", "payouts",
      "pay out", "pays out", "invoice", "invoices", "invoicing", "billing", "supplier",
      "suppliers", "vendor payments", "bank file", "bank files", "disburse", "disburses",
      "disbursement", "disbursements", "remittance", "settlement", "settlements", "money",
      "vendor", "vendors", "funds", "eft"],
    dominant: true,
  },
  {
    // How failures are handled. Dominant: an answer about the models or tools
    // involved does not answer what happens when they fail.
    id: "failure-handling",
    canonical: "How does Mike approach engineering?",
    // Not "failover": that names the claims platform's status, not how failures are handled.
    evidence: /fallible|fall(?:s|ing)? ?back|retries|takes over/i,
    terms: ["failure", "failures", "fallback", "fallbacks", "fall back", "falls back",
      "retry", "retries", "retrying", "outage", "outages", "downtime", "error handling",
      "resilience", "resilient", "fault tolerance", "fault-tolerant", "graceful degradation",
      "degrade gracefully", "goes down", "go down", "went down", "gone down", "is down",
      "are down", "be down", "was down", "unavailable", "unreachable", "offline", "timeout",
      "timeouts", "times out", "timed out", "time out", "rate-limited",
      // A rate limit is a failure only when a model or provider imposes it; the
      // assistant's own per-IP limit is a feature, not an outage.
      "model ... rate ... limit", "rate ... limit ... model", "llm ... rate ... limit",
      "rate ... limit ... llm", "provider ... rate ... limit", "rate ... limit ... provider",
      "throttled", "throttling", "crash", "crashes",
      "crashed", "errors out", "error out", "bad output", "bad outputs", "wrong output",
      "invalid output", "malformed output", "bad answer", "bad answers", "bad response",
      "bad responses", "wrong answer", "wrong answers", "garbage", "gibberish",
      "if ... fail", "when ... fail", "if ... down", "when ... down"],
    dominant: true,
  },
  {
    // The labelling scheme for repo maturity. Dominant: a link to the repos does
    // not say how they are labelled.
    id: "labels",
    canonical: "How does Mike label his repos?",
    // The scheme itself, or one repo's label ("is labelled lab").
    evidence: /labelled production, prototype, or lab|\blabell?ed (?:production|prototype|lab)\b/i,
    terms: ["labels", "labelled", "labeled", "labelling", "labeling", "tag", "tags",
      "tagged", "tagging", "badge", "badges", "maturity", "maturity label",
      "maturity labels", "maturity level", "maturity levels", "repo labels",
      "project labels", "status labels", "prototype ... lab", "lab ... prototype",
      "production ... lab", "lab ... production", "repo ... prototype",
      "prototype ... repo", "project ... prototype", "prototype ... project"],
    dominant: true,
  },
  {
    id: "ci",
    canonical: "What CI does Mike use?",
    evidence: /GitHub Actions/,
    terms: ["ci", "ci/cd", "cicd", "continuous integration", "continuous delivery",
      "continuous deployment", "build pipeline", "build pipelines", "deployment pipeline",
      "deployment pipelines"],
  },
  {
    id: "engineering",
    canonical: "How does Mike approach engineering?",
    evidence: /engineering defaults|validation|auditable/i,
    terms: ["approach", "philosophy", "principles", "principle", "practices",
      "methodology", "mindset", "values", "engineering style", "style", "defaults",
      "habits", "work style", "standards", "engineering", "craft"],
  },
  {
    id: "languages",
    canonical: "What programming languages does Mike use?",
    evidence: /Python|TypeScript/,
    terms: ["language", "languages", "programming", "programming language",
      "coding language", "code in", "codes in", "write in", "writes in", "written in",
      "coding", "code"],
  },
  {
    id: "databases",
    canonical: "What databases does Mike use?",
    evidence: /PostgreSQL|Postgres|SQLite|database/,
    terms: ["database", "databases", "data store", "data stores", "datastore", "db",
      "dbs", "sql", "relational", "vector store", "vector database", "vector search",
      "semantic search", "hybrid search", "vector", "vectors"],
  },
  {
    // Ahead of ai-tools so "which model writes the replies" is about this chat.
    id: "assistant",
    canonical: "How does this assistant work?",
    evidence: /RAG|Gemini/,
    terms: ["assistant", "chatbot", "chat bot", "bot", "chat", "this assistant",
      "this chat", "the chat", "answering", "this site", "this website", "portfolio site",
      "the replies", "the answers", "the responses", "your replies", "your answers",
      "your responses", "these replies", "these answers", "its replies", "its answers",
      // The prompt is a part of the assistant; "grounding" here names it, not a topic.
      "grounding prompt", "system prompt"],
  },
  {
    // How the assistant finds its sources: embeddings, similarity and the cutoff.
    id: "retrieval",
    canonical: "How does the RAG pipeline work technically?",
    evidence: /0\.35|cosine|BM25|embedding-001/,
    // Bare "threshold" or "cutoff" ("threshold for pain") needs a retrieval word beside it.
    terms: ["retrieval", "retrieve", "retrieves", "retrieved", "retriever", "similarity",
      "cosine", "top-k", "top k", "chunk", "chunks", "chunking", "embedding", "embeddings",
      "embed", "embeds", "bm25", "keyword search", "relevance score", "relevance threshold",
      "relevance cutoff"],
  },
  {
    id: "ai-tools",
    canonical: "What AI tools does Mike use?",
    evidence: /Gemini|LangGraph|Claude|OpenAI|Bedrock|Groq/,
    terms: ["ai tools", "ai tool", "llm", "llms", "genai", "generative ai", "model",
      "models", "model providers", "ai stack", "ai frameworks", "agent frameworks",
      "agent framework", "orchestration", "agents", "agent", "agentic"],
  },
  {
    id: "skills",
    canonical: "What are Mike's main skills?",
    evidence: /Python|FastAPI|stack/,
    terms: ["skill", "skills", "skillset", "stack", "tech stack", "technologies",
      "technology", "tech", "toolkit", "toolset", "tools", "tooling", "strengths",
      "competencies", "competency", "capabilities", "framework", "frameworks",
      "libraries", "library", "backend", "frontend", "full-stack", "full stack"],
  },
  {
    id: "built",
    canonical: "What has Mike built at Zororo-Phumulani?",
    evidence: /Digi App Form|CRM|ZDI/,
    terms: ["built", "build", "builds", "project", "projects", "portfolio",
      "work samples", "created", "made", "developed", "systems", "products", "apps",
      "applications"],
  },
  {
    id: "experience",
    canonical: "Tell me about Mike's experience",
    evidence: /Applied AI Engineer|six-plus|Zororo-Phumulani/i,
    terms: ["experience", "career", "background", "history", "track record",
      "work history", "journey", "professional", "professionally"],
  },
  {
    id: "who",
    canonical: "Who is Mike Ncube?",
    evidence: /Applied AI Engineer/,
    // "learn about" means finding out, not training, so it is matched here first.
    terms: ["introduce", "introduction", "bio", "biography", "blurb", "elevator",
      "positioning", "one-liner", "one liner", "nutshell", "snapshot", "profile",
      "highlights", "learn about", "learn more", "find out about", "find out more"],
  },
];

const CONCEPT_BY_ID = new Map(PROFILE_CONCEPTS.map((c) => [c.id, c]));
const CONCEPT_ORDER = new Map(PROFILE_CONCEPTS.map((c, i) => [c.id, i]));

const REFUSE_LEXICON = buildLexicon(REFUSE_TOPICS);
// Read first when the question asks for Mike's own number, so the number is a contact detail.
const MIKES_NUMBER_LEXICON = buildLexicon([{ id: "contact",
  terms: [...PHONE_NUMBER_TERMS, "number", "numbers"] }]);
const CONCEPT_LEXICON = buildLexicon(PROFILE_CONCEPTS);
const TECH_PHRASES = buildLexicon([{ id: "tech", terms: TECH_LEXICON.filter((t) => t.includes(" ")) }]);
const TECH_SINGLES = new Set(TECH_LEXICON.filter((t) => !t.includes(" ")));

// `stems` explains question words (KB text plus related terms and synonyms).
// `factText` is only what the KB states, so a technology counts as listed only
// when Mike's content names it, never because a synonym table mentions it.
function buildKbVocabulary(): { stems: Set<string>; factText: string } {
  const facts: string[] = [];
  for (const chunk of KNOWLEDGE_CHUNKS) {
    facts.push(chunk.title, chunk.text, ...(chunk.keywords ?? []));
  }
  for (const item of STATIC_ANSWERS) facts.push(item.answer);
  const vocabulary = [...facts];
  for (const [key, needles] of Object.entries(RELATED_TERMS)) vocabulary.push(key, ...needles);
  vocabulary.push(...thesaurusWords());
  const stems = new Set<string>();
  for (const token of questionTokens(vocabulary.join("\n"))) {
    stems.add(token.stem);
    stems.add(token.norm);
    for (const piece of token.norm.split(/[-/]/)) {
      if (piece) stems.add(stem(piece));
    }
  }
  return { stems, factText: facts.join("\n").toLowerCase() };
}

const KB_VOCAB = buildKbVocabulary();

// How many knowledge chunks contain each stem. Words in many chunks ("AI") say
// nothing about which answer a question needs.
const DISTINCTIVE_MAX_CHUNKS = 3;
const KB_CHUNK_FREQUENCY = (() => {
  const freq = new Map<string, number>();
  for (const chunk of KNOWLEDGE_CHUNKS) {
    const seen = new Set(questionTokens(`${chunk.title} ${chunk.text}`).map((t) => t.stem));
    for (const s of seen) freq.set(s, (freq.get(s) ?? 0) + 1);
  }
  return freq;
})();

export function isDistinctiveKbTerm(term: string): boolean {
  const count = KB_CHUNK_FREQUENCY.get(stem(term)) ?? 0;
  return count > 0 && count <= DISTINCTIVE_MAX_CHUNKS;
}

// General function or request word that carries no topic of its own.
export function isGenericWord(word: string): boolean {
  const token = questionTokens(word)[0];
  if (!token) return true;
  return GENERIC_STEMS.has(token.stem) || GENERIC_STEMS.has(token.norm);
}

export function conceptById(id: string): ProfileConcept | undefined {
  return CONCEPT_BY_ID.get(id);
}

const DERIVATIONAL_SUFFIXES = [
  "ability", "ibility", "ation", "ition", "tion", "sion", "ment", "ness", "ity",
  "ance", "ence", "able", "ible", "ful", "ise", "ize", "ist", "ism", "ive", "er",
  "ers", "or", "ors", "al",
];

// Matches inflected and derived forms (approver, auditability) against the KB.
function kbKnows(token: QuestionToken): boolean {
  if (KB_VOCAB.stems.has(token.norm)) return true;
  // Short stems collide across unrelated words (cape -> cap), so they need an exact match.
  if (token.stem.length >= 4 && KB_VOCAB.stems.has(token.stem)) return true;
  if (/[^a-z]/.test(token.norm)) return false;
  for (const suffix of DERIVATIONAL_SUFFIXES) {
    if (!token.norm.endsWith(suffix)) continue;
    const base = token.norm.slice(0, -suffix.length);
    if (base.length < 4) continue;
    if (KB_VOCAB.stems.has(stem(base)) || KB_VOCAB.stems.has(stem(`${base}e`))) return true;
  }
  return false;
}

function techInKb(term: string): boolean {
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(KB_VOCAB.factText);
}

export type QuestionAnalysis = {
  refuseTopic: string | null;
  concepts: string[];
  projects: string[];
  knownTech: string[];
  unknownTech: string[];
  unexplained: string[];
  // Unexplained words that look like names (capitalised mid-sentence or all caps).
  unexplainedNames: string[];
  // Knowledge-base words outside any concept, e.g. "SOC" in "Has Mike built a SOC?".
  kbTerms: string[];
};

type Slot = "generic" | "refuse" | "concept" | "tech" | "kb" | "unexplained";

function matchPhrases(
  tokens: QuestionToken[],
  used: boolean[],
  lexicon: Lexicon,
  onHit: (ids: string[], start: number, end: number) => void,
): void {
  for (const phrase of lexicon.phrases) {
    const n = phrase.stems.length;
    for (let i = 0; i + n <= tokens.length; i++) {
      if (used.slice(i, i + n).some(Boolean)) continue;
      if (phrase.stems.every((s, k) => tokens[i + k].stem === s)) {
        for (let k = i; k < i + n; k++) used[k] = true;
        onHit(phrase.ids, i, i + n);
      }
    }
  }
  for (const phrase of lexicon.gapped) {
    const positions: number[] = [];
    let from = 0;
    for (const s of phrase.stems) {
      const at = tokens.findIndex((t, i) => i >= from && !used[i] && t.stem === s);
      if (at < 0) break;
      positions.push(at);
      from = at + 1;
    }
    if (positions.length !== phrase.stems.length) continue;
    for (const at of positions) used[at] = true;
    onHit(phrase.ids, positions[0], positions[positions.length - 1] + 1);
  }
}

// Asking whether Mike holds a credential: certified, an exam, a certificate.
const CREDENTIAL_ASK_RE = /\bcertif\w*|\bcerts?\b|\bexams?\b|\bcredentials?\b|\baccredit\w*|\bqualifications?\b/i;

export function isCredentialAsk(question: string): boolean {
  return CREDENTIAL_ASK_RE.test(question);
}

// Pay words that name money moving through a system as readily as Mike's own pay.
const SYSTEM_MONEY_STEMS = stemSet(["pay", "pays", "paid", "paying", "invoice", "invoices",
  "invoicing", "billing", "fee", "fees", "earn", "earned", "earns"]);

// "family" names a system's clients (funeral cover is per family) as readily as Mike's own.
const FAMILY_STEMS = stemSet(["family", "families"]);
const MIKES_FAMILY_RE = /\b(?:mike['’]?s|his|he|him)\b[^?.!]{0,20}\bfamil|\bfamil\w*\b[^?.!]{0,20}\b(?:mike|him)\b/i;

// "Apache Kafka", "Microsoft Azure": a vendor name directly before a technology
// names one product. A vendor the KB lists itself ("AWS Lambda") stays separate,
// so the listed half is still credited.
function vendorProductSpans(tokens: QuestionToken[], used: boolean[]): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  for (let i = 0; i + 1 < tokens.length; i++) {
    if (used[i] || used[i + 1]) continue;
    const vendor = tokens[i].norm;
    const product = tokens[i + 1].norm;
    if (!TECH_VENDORS.has(vendor) || techInKb(vendor) || product === vendor) continue;
    if (!TECH_SINGLES.has(product)) continue;
    spans.push([i, i + 2]);
    i += 1;
  }
  return spans;
}

// Words before "go" that make it the Go language ("code in Go", "knows Go") when
// nothing verb-like follows, and words after it that do so on their own ("Go developer").
const GO_LANGUAGE_BEFORE = new Set(["in", "with", "write", "writes", "writing", "wrote", "code",
  "codes", "coding", "program", "programs", "programming", "know", "knows", "learn", "learned",
  "learnt", "learning", "use", "uses", "used", "using", "and", "or", "experience", "proficient",
  "familiar", "fluent", "skilled"]);
const GO_LANGUAGE_AFTER = new Set(["lang", "language", "programming", "developer", "developers",
  "engineer", "engineers", "code", "services", "microservices", "backend", "backends"]);
// "go to", "go about", "go remote": "go" as a verb.
const GO_VERB_AFTER = new Set(["to", "about", "through", "ahead", "live", "back", "on", "over",
  "into", "for", "out", "beyond", "up", "down", "remote", "with", "abroad", "elsewhere",
  "there", "here", "home", "in", "by", "from", "onsite", "hybrid"]);
// "to go", "can he go", "Mike go": "go" as a verb.
const GO_VERB_BEFORE = new Set(["to", "i", "we", "you", "he", "she", "they", "mike", "let", "lets",
  "can", "could", "will", "would", "should", "did", "does", "do", "must", "might", "may", "not"]);

function goLanguageIndex(tokens: QuestionToken[], used: boolean[]): number {
  const capitalised = tokens.filter((t) => /^[A-Z]/.test(t.raw)).length;
  const titleCase = capitalised > tokens.length * 0.6;
  for (let i = 0; i < tokens.length; i++) {
    if (used[i] || tokens[i].norm !== "go") continue;
    const prev = tokens[i - 1]?.norm;
    const next = tokens[i + 1]?.norm;
    if ((next && GO_VERB_AFTER.has(next)) || (prev && GO_VERB_BEFORE.has(prev))) continue;
    const named = !titleCase && i > 0 && tokens[i].raw === "Go";
    const framedBefore = Boolean(prev && GO_LANGUAGE_BEFORE.has(prev))
      && (!next || next === "and" || next === "or" || GO_LANGUAGE_AFTER.has(next));
    const framedAfter = Boolean(next && GO_LANGUAGE_AFTER.has(next));
    if (named || framedBefore || framedAfter) return i;
  }
  return -1;
}

export function analyseQuestion(question: string): QuestionAnalysis {
  const tokens = questionTokens(question);
  const used = tokens.map(() => false);
  const refuse: string[] = [];
  const conceptHits = new Map<string, number>();
  const knownTech: string[] = [];
  const unknownTech: string[] = [];
  const unexplained: string[] = [];
  const unexplainedNames: string[] = [];
  const kbTerms: string[] = [];

  const hitConcepts = (ids: string[]) => {
    for (const id of ids) conceptHits.set(id, (conceptHits.get(id) ?? 0) + 1);
  };
  const hitTech = (raw: string, norm: string) => {
    (techInKb(norm) ? knownTech : unknownTech).push(raw);
  };

  if (asksForMikesNumber(question)) {
    matchPhrases(tokens, used, MIKES_NUMBER_LEXICON, (ids) => hitConcepts(ids));
    tokens.forEach((token, i) => {
      if (!used[i] && MIKES_NUMBER_LEXICON.singles.has(token.stem)) {
        used[i] = true;
        hitConcepts(["contact"]);
      }
    });
  }
  matchPhrases(tokens, used, REFUSE_LEXICON, (ids) => refuse.push(...ids));
  matchPhrases(tokens, used, CONCEPT_LEXICON, (ids) => hitConcepts(ids));
  matchPhrases(tokens, used, TECH_PHRASES, (_ids, start, end) => {
    const raw = tokens.slice(start, end).map((t) => t.raw).join(" ");
    hitTech(raw, raw.toLowerCase());
  });
  for (const [start, end] of vendorProductSpans(tokens, used)) {
    for (let k = start; k < end; k++) used[k] = true;
    const product = tokens[end - 1];
    // A listed product goes by the name the KB uses ("Bedrock"); an unlisted one
    // keeps the visitor's full name for the "isn't listed" note ("Apache Kafka").
    const full = tokens.slice(start, end).map((t) => t.raw).join(" ");
    hitTech(techInKb(product.norm) ? product.raw : full, product.norm);
  }
  const go = goLanguageIndex(tokens, used);
  if (go >= 0) {
    used[go] = true;
    // Checked against the KB as "golang": "go" as an ordinary verb appears in the KB text.
    hitTech("Go", "golang");
  }
  // Money words about a named system ("does ZDI pay suppliers") are not Mike's pay,
  // and "earn" or "pass" a certificate is a credential, not income.
  const moneyAboutMike = moneyIsMikes(question) && !isCredentialAsk(question);
  // "a family's funeral benefit" on the claims platform is a client's family, not Mike's.
  const familyAboutMike = namedProjects(question).length === 0 || MIKES_FAMILY_RE.test(question);
  const scopedOut = (stemmed: string) =>
    (!moneyAboutMike && SYSTEM_MONEY_STEMS.has(stemmed)) || (!familyAboutMike && FAMILY_STEMS.has(stemmed));

  // Pieces of a compound ("third-party", "fan-out") only explain the compound;
  // they must not trigger a refusal topic on their own.
  const classify = (token: QuestionToken, isPiece = false): Slot => {
    if (GENERIC_STEMS.has(token.stem) || GENERIC_STEMS.has(token.norm)) return "generic";
    if (/^\d/.test(token.norm)) return kbKnows(token) ? "kb" : "unexplained";
    const refuseIds = REFUSE_LEXICON.singles.get(token.stem);
    if (refuseIds && !scopedOut(token.stem)) {
      if (isPiece) return "kb";
      refuse.push(...refuseIds);
      return "refuse";
    }
    const conceptIds = CONCEPT_LEXICON.singles.get(token.stem);
    if (conceptIds) {
      hitConcepts(conceptIds);
      return "concept";
    }
    if (TECH_SINGLES.has(token.norm)) {
      hitTech(token.raw, token.norm);
      return "tech";
    }
    if (kbKnows(token)) {
      kbTerms.push(token.raw);
      return "kb";
    }
    return "unexplained";
  };

  tokens.forEach((token, i) => {
    if (used[i]) return;
    if (classify(token) !== "unexplained") return;
    // Split the raw form so a named piece keeps the visitor's casing ("EKS").
    const pieces = token.raw.split(/[-/]/).filter(Boolean);
    if (pieces.length > 1) {
      const pieceSlots = pieces.map((piece) => classify(questionTokens(piece)[0] ?? token, true));
      if (!pieceSlots.includes("unexplained")) return;
    }
    unexplained.push(token.raw);
    const looksLikeName = (i > 0 && /[A-Z]/.test(token.raw)) || /^[A-Z0-9]{2,}$/.test(token.raw);
    if (looksLikeName) unexplainedNames.push(token.raw);
  });

  const concepts = [...conceptHits.entries()]
    .sort((a, b) => b[1] - a[1] || (CONCEPT_ORDER.get(a[0]) ?? 0) - (CONCEPT_ORDER.get(b[0]) ?? 0))
    .map(([id]) => id);

  return {
    refuseTopic: refuse[0] ?? null,
    concepts,
    projects: namedProjects(question).map((p) => p.id),
    knownTech: [...new Set(knownTech)],
    unknownTech: [...new Set(unknownTech)],
    unexplained,
    unexplainedNames,
    kbTerms,
  };
}

const PLACE_CONCEPTS = new Set(["elsewhere", "location"]);

// Another place plus a work concept asks about working there (relocation), unless
// the work is fully remote and nothing puts Mike in a physical workplace.
function asksAboutWorkingThere(concepts: string[]): boolean {
  const work = concepts.filter((id) => !PLACE_CONCEPTS.has(id));
  if (work.length === 0) return false;
  return !(work.includes("remote") && !work.includes("workplace"));
}

// Reason to refuse before retrieval, or null when the question is in scope.
// One ordinary unexplained word is tolerated when the question is anchored on a
// concept, project or listed technology ("Can we engage Mike as a contractor?"),
// and two when a dominant concept anchors it: its answer is fixed copy, so the
// extra wording ("of insured members") cannot pull in a different topic.
// Unexplained names never are: they name something the portfolio does not cover.
export function coverageRefusalReason(analysis: QuestionAnalysis): string | null {
  if (analysis.refuseTopic) return `topic:${analysis.refuseTopic}`;
  if (analysis.concepts.includes("elsewhere") && asksAboutWorkingThere(analysis.concepts)) {
    return "topic:relocation";
  }
  // Only unlisted technology: say which, rather than a generic refusal for other words.
  if (
    analysis.unknownTech.length > 0
    && analysis.knownTech.length === 0
    && analysis.projects.length === 0
  ) {
    return `unknown-tech:${analysis.unknownTech.join(",")}`;
  }
  const anchored = analysis.concepts.length > 0
    || analysis.projects.length > 0
    || analysis.knownTech.length > 0;
  const dominant = analysis.concepts.some((id) => CONCEPT_BY_ID.get(id)?.dominant);
  const tolerated = !anchored || analysis.unexplainedNames.length > 0 ? 0 : dominant ? 2 : 1;
  if (analysis.unexplained.length > tolerated) return `unexplained:${analysis.unexplained.join(",")}`;
  return null;
}

// The profile concept whose canonical answer should replace `response`, or null
// when the response already serves one of the question's concepts.
export function conceptOverride(
  analysis: QuestionAnalysis,
  response: string,
  responseIsRefusal: boolean,
): ProfileConcept | null {
  if (analysis.projects.length > 0 || analysis.knownTech.length > 0 || analysis.unknownTech.length > 0) {
    return null;
  }
  const concepts = analysis.concepts
    .map((id) => CONCEPT_BY_ID.get(id))
    .filter((c): c is ProfileConcept => Boolean(c));
  if (concepts.length === 0) return null;
  const dominant = concepts.find((c) => c.dominant);
  if (dominant) return !responseIsRefusal && dominant.evidence.test(response) ? null : dominant;
  if (!responseIsRefusal && concepts.some((c) => c.evidence.test(response))) return null;
  // A mixed question ("Has Mike built a SOC?") keeps an answer that covers its specific term.
  const covered = analysis.kbTerms.some((term) => isDistinctiveKbTerm(term) && mentions(response, term));
  if (!responseIsRefusal && covered) return null;
  return concepts[0];
}

function mentions(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function conceptTerms(): string[] {
  return [...PROFILE_CONCEPTS.flatMap((c) => c.terms), ...REFUSE_TOPICS.flatMap((t) => t.terms)];
}
