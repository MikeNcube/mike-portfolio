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

import { RELATED_TERMS } from "./grounding";
import { namedProjects } from "./intent";
import { KNOWLEDGE_CHUNKS } from "./knowledge";
import { STATIC_ANSWERS } from "./static-answers";
import { stem } from "./stem";
import { TECH_LEXICON } from "./tech-lexicon";

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

// General English function and discourse words. No domain vocabulary.
const GENERIC_WORD_LIST = [
  // question words and auxiliaries
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how", "whatever",
  "is", "are", "was", "were", "be", "been", "being", "am", "do", "does", "did", "done",
  "doing", "has", "have", "had", "having", "can", "could", "would", "should", "will",
  "shall", "may", "might", "must", "dont", "doesnt", "didnt", "isnt", "arent", "wasnt",
  "werent", "cant", "cannot", "couldnt", "wouldnt", "shouldnt", "wont", "hasnt",
  "havent", "hadnt", "im", "ive", "id", "youre", "hes", "theyre", "thats", "theres",
  // pronouns and determiners
  "i", "me", "my", "mine", "myself", "we", "us", "our", "ours", "you", "your", "yours",
  "he", "him", "his", "himself", "she", "her", "they", "them", "their", "it", "its",
  "this", "that", "these", "those", "there", "here", "someone", "somebody", "anyone",
  "anybody", "anything", "something", "everything", "nothing", "one", "ones", "a",
  "an", "the", "any", "some", "all", "each", "every", "both", "either", "neither",
  "no", "not", "none", "much", "many", "more", "most", "few", "fewer", "several",
  "other", "others", "another", "such", "own", "same", "else",
  // prepositions and conjunctions
  "about", "above", "across", "after", "against", "along", "among", "around", "as",
  "at", "before", "behind", "below", "beneath", "beside", "besides", "between",
  "beyond", "by", "down", "during", "except", "for", "from", "in", "inside", "into",
  "like", "near", "of", "off", "on", "onto", "out", "outside", "over", "past", "per",
  "since", "through", "throughout", "till", "to", "toward", "towards", "under",
  "until", "up", "upon", "with", "within", "without", "via", "versus", "vs", "and",
  "or", "but", "nor", "so", "yet", "if", "then", "than", "because", "while",
  "whether", "though", "although", "also", "too", "plus", "including", "regarding",
  "re", "according",
  // adverbs, discourse and politeness
  "just", "really", "actually", "currently", "presently", "now", "today", "nowadays",
  "right", "still", "already", "ever", "never", "always", "often", "sometimes",
  "usually", "again", "once", "even", "only", "very", "quite", "pretty", "rather",
  "exactly", "precisely", "roughly", "approximately", "around", "basically",
  "generally", "typically", "mostly", "mainly", "primarily", "specifically",
  "particularly", "overall", "simply", "briefly", "quickly", "quick", "brief",
  "short", "please", "kindly", "thanks", "thank", "hi", "hello", "hey", "ok",
  "okay", "yes", "yeah", "maybe", "perhaps", "well", "anyway", "honestly", "truly",
  "certainly", "definitely", "probably", "possibly", "likely", "yet", "these",
  "days", "day", "moment", "lately", "recently", "recent", "latest", "these days",
  // generic request and cognition verbs
  "tell", "say", "says", "said", "ask", "give", "gave", "share", "show", "explain",
  "describe", "summarise", "summarize", "list", "name", "outline", "walk", "mention",
  "talk", "go", "goes", "going", "get", "gets", "got", "make", "makes", "let", "find",
  "see", "look", "looks", "seem", "seems", "mean", "means", "think", "thinks",
  "know", "knows", "knew", "known", "believe", "feel", "need", "needs", "try",
  "help", "call", "called", "consider", "considered", "count", "include",
  "includes", "involve", "involves", "cover", "covers", "matter", "matters",
  "happen", "become", "remain", "stay", "come", "bring", "keep", "put", "take",
  "use", "uses", "used", "using", "have", "hold", "holds", "held", "work", "works",
  "worked", "working", "able", "familiar", "comfortable", "proficient",
  "proficiency", "fluent", "expert", "expertise", "skilled", "hands-on", "hands",
  "solid", "deep", "strong", "good", "great", "real", "actual", "true", "official",
  "formal", "formally", "specific", "particular", "general", "typical", "usual",
  "normal", "common", "main", "key", "major", "core", "primary", "biggest", "big",
  "small", "new", "current", "present", "previous", "first", "last", "next",
  "certain", "sure", "possible", "kind", "kinds", "sort", "sorts", "type", "types",
  "thing", "things", "stuff", "way", "ways", "lot", "lots", "bit", "level", "point",
  "part", "parts", "detail", "details", "info", "information", "summary", "overview",
  "example", "examples", "specifics", "quickly", "anymore", "somewhere", "anywhere",
  "everywhere", "whole", "entire", "exact", "mike", "ncube", "s", "mr", "guy",
  "person", "people", "engineer", "engineers", "developer", "developers",
  // domain-neutral nouns, verbs and adjectives common in questions
  "reason", "reasons", "power", "powers", "land", "url", "link", "links", "page",
  "prevent", "act", "acts", "card", "accept", "accepts", "join", "extra",
  "additional", "large", "larger", "size", "stop", "stops", "prefer", "prefers",
  "preferred", "favour", "favor", "favourite", "favorite", "set", "setup", "option",
  "options", "engage", "independent", "appear", "appears", "screen", "represent",
  "represents", "publish", "published", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "dozen", "treat", "treats", "paper", "sentence",
  "sentences", "paragraph", "line", "lines", "word", "words", "fully", "full",
  "total", "far", "practise", "existing", "table", "integrate",
  "expect", "expected", "advertise", "duty", "duties", "solo", "alone", "alongside",
  "free", "board", "welcome", "enquiry", "enquiries", "inquiry", "recruit",
  "recruiting", "recruiter", "recruiters", "conversation", "implement", "ensure",
  "thorough", "high", "low", "bar", "provide", "add", "stance", "avoid", "silent",
  "fail", "fails", "instrument", "bad", "string", "print",
  "printed", "belong", "belongs", "offer", "offers", "require", "required",
  "lengthy", "length", "immediate", "tiny", "chase", "chasing", "restrict",
  "restricted", "arrangement", "delivery", "ping", "gone", "finish", "finished",
  "store", "stores", "hit", "prior", "path", "credit", "meant", "usage", "original",
  "hidden", "natural", "visitor", "visitors", "reply", "replies", "benefit",
  "month", "months", "week", "weeks", "quarter", "protect", "mitigate", "resist",
  "defend", "guard", "handle", "handles", "design", "designed", "fact", "facts",
  "pick", "picked", "sit", "sits", "behind", "happen", "happens", "address", "ui",
  "uis", "ux", "api", "apis", "kb", "faq", "mid", "junior", "entry",
  "principal", "industry", "field", "domain", "space", "sector", "problem", "problems",
  "solve", "solves", "solved", "purpose", "point", "online", "automatically",
  "automatic", "manually", "answer",
  "answers", "question", "questions", "reply", "respond", "response", "write",
  "writes", "wrote", "read", "reads", "run", "runs", "running", "ran",
  "change", "changes", "improve", "explore", "check", "checks", "compare",
  "difference", "differences", "similar", "fast", "slow",
  "easy", "hard", "simple", "complex", "safe", "safely", "sound", "right", "wrong",
  "correct", "clear", "clean", "open", "close", "closed", "done", "complete",
  "completed", "ready", "since", "ago", "started", "begin", "began", "end",
  "ended", "goal", "goals", "plan", "plans", "planned", "focus", "focused", "aspect",
  // comparatives such as "better" and "worse" are left out on purpose: they mark opinions
  "aspects", "feature", "features", "piece", "pieces",
];

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

// Topics the knowledge base cannot answer. A hit refuses with the email fallback.
export const REFUSE_TOPICS: Array<{ id: string; terms: readonly string[] }> = [
  {
    id: "compensation",
    terms: [
      "salary", "salaries", "pay", "paid", "payslip", "paycheck", "paycheque", "wage",
      "wages", "earn", "earns", "earnings", "income", "compensation", "remuneration",
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
      "bank details", "home address", "physical address", "street address", "phone",
      "phone number", "cellphone", "cell", "mobile number", "whatsapp", "telephone"],
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
      "set up a call", "arrange a call"],
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
      "self-study"],
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
    terms: ["strongest", "best", "proudest", "proud", "flagship", "impressive",
      "showcase", "favourite project", "favorite project", "signature project",
      "standout project", "greatest", "demo"],
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
    // How failures are handled. Dominant: an answer about the models or tools
    // involved does not answer what happens when they fail.
    id: "failure-handling",
    canonical: "How does Mike approach engineering?",
    evidence: /fallible|fallback|retries/i,
    terms: ["failure", "failures", "fallback", "fallbacks", "fall back", "falls back",
      "retry", "retries", "retrying", "outage", "outages", "downtime", "error handling",
      "resilience", "resilient", "fault tolerance", "fault-tolerant", "graceful degradation",
      "degrade gracefully"],
    dominant: true,
  },
  {
    // The labelling scheme for repo maturity. Dominant: a link to the repos does
    // not say how they are labelled.
    id: "labels",
    canonical: "How does Mike label his repos?",
    evidence: /labelled production, prototype, or lab/i,
    terms: ["labels", "maturity", "maturity label", "maturity labels", "maturity level",
      "maturity levels", "repo labels", "project labels", "status labels"],
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
    id: "assistant",
    canonical: "How does this assistant work?",
    evidence: /RAG|Gemini/,
    terms: ["assistant", "chatbot", "chat bot", "bot", "chat", "this assistant",
      "this chat", "answering", "this site", "this website", "portfolio site"],
  },
  {
    id: "who",
    canonical: "Who is Mike Ncube?",
    evidence: /Applied AI Engineer/,
    terms: ["introduce", "introduction", "bio", "biography", "blurb", "elevator",
      "positioning", "one-liner", "one liner", "nutshell", "snapshot", "profile",
      "highlights"],
  },
];

const CONCEPT_BY_ID = new Map(PROFILE_CONCEPTS.map((c) => [c.id, c]));
const CONCEPT_ORDER = new Map(PROFILE_CONCEPTS.map((c, i) => [c.id, i]));

const REFUSE_LEXICON = buildLexicon(REFUSE_TOPICS);
const CONCEPT_LEXICON = buildLexicon(PROFILE_CONCEPTS);
const TECH_PHRASES = buildLexicon([{ id: "tech", terms: TECH_LEXICON.filter((t) => t.includes(" ")) }]);
const TECH_SINGLES = new Set(TECH_LEXICON.filter((t) => !t.includes(" ")));

function buildKbVocabulary(): { stems: Set<string>; text: string } {
  const parts: string[] = [];
  for (const chunk of KNOWLEDGE_CHUNKS) {
    parts.push(chunk.title, chunk.text, ...(chunk.keywords ?? []));
  }
  for (const item of STATIC_ANSWERS) parts.push(item.answer);
  for (const [key, needles] of Object.entries(RELATED_TERMS)) parts.push(key, ...needles);
  const text = parts.join("\n");
  const stems = new Set<string>();
  for (const token of questionTokens(text)) {
    stems.add(token.stem);
    stems.add(token.norm);
    for (const piece of token.norm.split(/[-/]/)) {
      if (piece) stems.add(stem(piece));
    }
  }
  return { stems, text: text.toLowerCase() };
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

function isDistinctiveKbTerm(term: string): boolean {
  const count = KB_CHUNK_FREQUENCY.get(stem(term)) ?? 0;
  return count > 0 && count <= DISTINCTIVE_MAX_CHUNKS;
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
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(KB_VOCAB.text);
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

  matchPhrases(tokens, used, REFUSE_LEXICON, (ids) => refuse.push(...ids));
  matchPhrases(tokens, used, CONCEPT_LEXICON, (ids) => hitConcepts(ids));
  matchPhrases(tokens, used, TECH_PHRASES, (_ids, start, end) => {
    const raw = tokens.slice(start, end).map((t) => t.raw).join(" ");
    hitTech(raw, raw.toLowerCase());
  });

  // Pieces of a compound ("third-party", "fan-out") only explain the compound;
  // they must not trigger a refusal topic on their own.
  const classify = (token: QuestionToken, isPiece = false): Slot => {
    if (GENERIC_STEMS.has(token.stem) || GENERIC_STEMS.has(token.norm)) return "generic";
    if (/^\d/.test(token.norm)) return kbKnows(token) ? "kb" : "unexplained";
    const refuseIds = REFUSE_LEXICON.singles.get(token.stem);
    if (refuseIds) {
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
// concept, project or listed technology ("Can we engage Mike as a contractor?").
// Unexplained names never are: they name something the portfolio does not cover.
export function coverageRefusalReason(analysis: QuestionAnalysis): string | null {
  if (analysis.refuseTopic) return `topic:${analysis.refuseTopic}`;
  if (analysis.concepts.includes("elsewhere") && asksAboutWorkingThere(analysis.concepts)) {
    return "topic:relocation";
  }
  const anchored = analysis.concepts.length > 0
    || analysis.projects.length > 0
    || analysis.knownTech.length > 0;
  const tolerated = anchored && analysis.unexplainedNames.length === 0 ? 1 : 0;
  if (analysis.unexplained.length > tolerated) return `unexplained:${analysis.unexplained.join(",")}`;
  if (
    analysis.unknownTech.length > 0
    && analysis.knownTech.length === 0
    && analysis.projects.length === 0
  ) {
    return `unknown-tech:${analysis.unknownTech.join(",")}`;
  }
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
