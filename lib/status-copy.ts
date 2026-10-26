// Canonical production-system, AWS, ZDI, and Zororo AI OS status copy, plus a post-check.

export const ANSWER_CACHE_VERSION = "r30";

export const CANONICAL_PRODUCTION_ANSWER =
  "Shipped: Digi App Form [1] and the Zororo CRM [2] (over 40 people, around 10 roles). Rolling out: ZDI [3] (approved for production rollout at Zororo-Phumulani, rolling out soon, not yet live). The claims operations platform is an approved, production-ready standby (failover) for Zororo-Phumulani's current claims system, not the live system itself [4].";

export const ZDI_STATUS_SENTENCE =
  "ZDI is approved for production rollout at Zororo-Phumulani and rolling out soon, but it is not yet live.";

export const AI_OS_STATUS_SENTENCE =
  "Zororo AI OS is built, early-stage and not yet deployed.";

export const CLAIMS_STATUS_SENTENCE =
  "The claims operations platform is an approved, production-ready standby (failover) for Zororo-Phumulani's current claims system, not the live system itself.";

export const CANONICAL_ZDI_LIVE_ANSWER =
  "No. ZDI is approved for production rollout at Zororo-Phumulani and rolling out soon, but it is not yet live [1].";

export const CANONICAL_AWS_ANSWER =
  "Mike's stack lists AWS services S3, EC2, IAM, CloudWatch, and Bedrock [1]. The resilient web tier on AWS is labelled lab, not production [2]. Training includes the Becoming an AI Practitioner Series (Introduction to AI; Introduction to Generative AI; Prompts and Working with Foundation Models) [3].";

export const CANONICAL_TECH_LEAD_CRM_ANSWER =
  "The sources do not use the title tech lead. Mike shipped the lead-management CRM at Zororo-Phumulani, used by over 40 people across around 10 roles [1]. His title is Applied AI Engineer and Systems Architect, and he is the sole AI engineer in a four-person IT team.";

const PRODUCTION_QUESTION_RE =
  /\b(production systems|what has mike shipped|what did mike (?:ship|build)|shipped at zororo)\b/i;

const ZDI_RE = /\b(zdi|zororo document intelligence)\b/i;

const ZDI_LIVE_QUESTION_RE = /\bis zdi\b.{0,24}\blive\b/i;

const AI_OS_RE = /\bzororo ai os\b/i;

const CLAIMS_RE =
  /\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b|\bclaims system\b/i;

const AWS_QUESTION_RE = /\baws\b/i;

const AWS_OVERCLAIM_RE = /\bextensive(?:ly)?\b|\bproduction-grade\b/i;

const TECH_LEAD_RE =
  /\btech lead\b|\bteam lead\b|\bleadership\b|\bengineering lead\b/i;

const TECH_LEAD_TITLE_CLAIM_RE =
  /\b(?:the tech lead|as tech lead|was tech lead|is tech lead)\b/i;

const ELLIPSIS_RE = /…|\u2026|\.\.\./;

const AWS_PROVIDER_AS_CREDENTIAL_RE =
  /AWS Training and Certification|AWS Skills Center/i;

const REPEATED_STATUS_RES: RegExp[] = [
  /built\.\s*built/i,
  /prototype\.\s*status:\s*prototype/i,
  /early[- ]stage[\s\S]+?early[- ]stage/i,
  /not(?: yet)? deployed[\s\S]+?not(?: yet)? deployed/i,
  /standby \(failover\)[\s\S]+?standby \(failover\)/i,
  /not the live system[\s\S]+?not the live system/i,
];

// True when the visitor asked which production systems Mike shipped.
export function isProductionSystemsQuestion(question: string): boolean {
  return PRODUCTION_QUESTION_RE.test(question);
}

// True when the text names ZDI or Zororo Document Intelligence.
export function mentionsZdi(text: string): boolean {
  return ZDI_RE.test(text);
}

// True when the visitor asked whether ZDI is live.
export function isZdiLiveQuestion(question: string): boolean {
  return ZDI_LIVE_QUESTION_RE.test(question);
}

// True when the text names Zororo AI OS.
export function mentionsAiOs(text: string): boolean {
  return AI_OS_RE.test(text);
}

// True when the text names the claims operations platform.
export function mentionsClaims(text: string): boolean {
  return CLAIMS_RE.test(text);
}

// True when the visitor asked about AWS experience, stack, or labs.
export function isAwsQuestion(question: string): boolean {
  return AWS_QUESTION_RE.test(question);
}

// True when the visitor asked about tech-lead or leadership titles.
export function isTechLeadCrmQuestion(question: string): boolean {
  return TECH_LEAD_RE.test(question);
}

// True when the text claims the title tech lead (not merely naming the unused term).
export function claimsTechLeadTitle(text: string): boolean {
  return TECH_LEAD_TITLE_CLAIM_RE.test(text);
}

// True when a tech-lead CRM answer denies the unused title, states CRM facts, and cites.
export function techLeadAnswerIsCanonical(text: string): boolean {
  return (
    /do not use the title tech lead/i.test(text)
    && /\bcrm\b/i.test(text)
    && /\[\d+\]/.test(text)
    && !claimsTechLeadTitle(text)
  );
}

// True when an AWS answer names the CV services, the lab label, and training, with no overclaim.
export function awsAnswerIsCanonical(text: string): boolean {
  return (
    /\bS3\b/i.test(text)
    && /\bEC2\b/i.test(text)
    && /\bIAM\b/i.test(text)
    && /\bCloudWatch\b/i.test(text)
    && /\bBedrock\b/i.test(text)
    && /lab, not production/i.test(text)
    && /Becoming an AI Practitioner Series/i.test(text)
    && /\[\d+\]/.test(text)
    && !AWS_OVERCLAIM_RE.test(text)
    && !AWS_PROVIDER_AS_CREDENTIAL_RE.test(text)
  );
}

// Fold hyphen-like dashes and spaces so 'early-stage' and 'early stage' match.
export function foldStatusText(text: string): string {
  return text
    .replace(/[\u2010-\u2015]/g, "-")
    .toLowerCase()
    .replace(/[\s-]+/g, " ")
    .trim();
}

function hasRollingOut(text: string): boolean {
  const t = foldStatusText(text);
  return /\brolling out\b|\broll out\b/.test(t);
}

function hasEarlyStage(text: string): boolean {
  return /\bearly stage\b/.test(foldStatusText(text));
}

function hasProductionReady(text: string): boolean {
  return /\bproduction ready\b/.test(foldStatusText(text));
}

function hasFailoverOrStandby(text: string): boolean {
  const t = foldStatusText(text);
  return /\bstandby\b/.test(t) || /\bfailover\b/.test(t) || /\bfail over\b/.test(t);
}

function hasApproved(text: string): boolean {
  return /\bapproved\b/.test(foldStatusText(text));
}

function hasBuilt(text: string): boolean {
  return /\bbuilt\b/.test(foldStatusText(text));
}

function hasNotDeployed(text: string): boolean {
  return /\bnot(?: yet)? deployed\b/.test(foldStatusText(text));
}

function hasNotLive(text: string): boolean {
  return /\bnot(?: yet)? live\b/.test(foldStatusText(text));
}

function hasNotTheLiveSystem(text: string): boolean {
  const t = foldStatusText(text);
  return /\b(?:not|rather than) the(?: current)? live(?: \(\s*claims\s*\)| claims)? system(?: itself)?\b/.test(
    t,
  );
}

// True when ZDI status covers approved, rolling out, and not (yet) live.
export function hasZdiStatus(text: string): boolean {
  return hasApproved(text) && hasRollingOut(text) && hasNotLive(text);
}

// True when Zororo AI OS is built and not (yet) deployed.
export function hasAiOsStatus(text: string): boolean {
  return hasBuilt(text) && hasEarlyStage(text) && hasNotDeployed(text);
}

// True when claims ops is the approved standby/failover and not the live system.
export function hasClaimsStatus(text: string): boolean {
  return (
    hasApproved(text)
    && hasProductionReady(text)
    && hasFailoverOrStandby(text)
    && hasNotTheLiveSystem(text)
  );
}

// True when an answer repeats a status word back-to-back (built/built, prototype/Status: Prototype).
export function hasRepeatedStatus(text: string): boolean {
  return REPEATED_STATUS_RES.some((re) => re.test(text));
}

type StatusKind = "zdi" | "ai-os" | "claims";

// Skip appending only when the answer already has that project's full meaning.
function alreadyConveysStatus(kind: StatusKind, text: string): boolean {
  switch (kind) {
    case "zdi":
      return hasZdiStatus(text);
    case "ai-os":
      return hasAiOsStatus(text);
    case "claims":
      return hasClaimsStatus(text);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

// True when ZDI is listed in the Shipped: clause instead of Rolling out.
export function zdiListedAsShipped(text: string): boolean {
  const lower = text.toLowerCase();
  const shippedIdx = lower.search(/shipped\s*:/);
  if (shippedIdx < 0) return false;
  const rollingIdx = lower.search(/rolling out\s*:/);
  const end = rollingIdx > shippedIdx ? rollingIdx : lower.length;
  return /\bzdi\b/.test(lower.slice(shippedIdx, end));
}

// True when the answer already uses the Shipped / Rolling out split.
export function productionAnswerIsCanonical(text: string): boolean {
  if (ELLIPSIS_RE.test(text)) return false;
  return (
    /^shipped:/i.test(text) &&
    /Digi App Form \[1\]/i.test(text) &&
    /Zororo CRM \[2\]/i.test(text) &&
    /rolling out:\s*zdi \[3\]/i.test(text) &&
    /not yet live/i.test(text) &&
    /claims operations platform/i.test(text) &&
    /not the live system/i.test(text) &&
    /\[4\]/.test(text) &&
    !zdiListedAsShipped(text)
  );
}

// Pull trailing [n] markers off so a status sentence can sit before them.
function peelTrailingCitations(text: string): { body: string; cites: string } {
  const m = text.match(/^(.*?)((?:\s*\[\d+\])+)\s*[.!?]?$/s);
  if (!m || !m[1].trim()) return { body: text, cites: "" };
  return { body: m[1].trim(), cites: m[2].trim().replace(/\s+/g, " ") };
}

// Put [n] inside the sentence, before the closing punctuation.
function attachCites(sentence: string, cites: string): string {
  const trimmed = sentence.trim();
  if (!cites) return trimmed;
  if (/\[\d+\]/.test(trimmed)) return trimmed;
  const punctMatch = trimmed.match(/[.!?]$/);
  const punct = punctMatch ? punctMatch[0] : ".";
  const core = punctMatch ? trimmed.slice(0, -1).trimEnd() : trimmed;
  return `${core} ${cites}${punct}`;
}

function canonicalNamedStatus(kind: StatusKind): string {
  switch (kind) {
    case "zdi":
      return ZDI_STATUS_SENTENCE;
    case "ai-os":
      return AI_OS_STATUS_SENTENCE;
    case "claims":
      return CLAIMS_STATUS_SENTENCE;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function projectDisplayName(kind: StatusKind): string {
  switch (kind) {
    case "zdi":
      return "ZDI";
    case "ai-os":
      return "Zororo AI OS";
    case "claims":
      return "The claims operations platform";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function fullStatusPredicate(kind: StatusKind): string {
  switch (kind) {
    case "zdi":
      return "approved for production rollout at Zororo-Phumulani and rolling out soon, but it is not yet live";
    case "ai-os":
      return "built, early-stage and not yet deployed";
    case "claims":
      return "an approved, production-ready standby (failover) for Zororo-Phumulani's current claims system, not the live system itself";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function joinStatusBits(bits: string[]): string {
  if (bits.length === 0) return "";
  if (bits.length === 1) return bits[0];
  if (bits.length === 2) return `${bits[0]} and ${bits[1]}`;
  return `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
}

function missingStatusBits(kind: StatusKind, text: string): string[] {
  switch (kind) {
    case "zdi": {
      const bits: string[] = [];
      if (!hasApproved(text)) bits.push("approved for production rollout at Zororo-Phumulani");
      if (!hasRollingOut(text)) bits.push("rolling out soon");
      if (!hasNotLive(text)) bits.push("not yet live");
      return bits;
    }
    case "ai-os": {
      const bits: string[] = [];
      if (!hasBuilt(text)) bits.push("built");
      if (!hasEarlyStage(text)) bits.push("early-stage");
      if (!hasNotDeployed(text)) bits.push("not yet deployed");
      return bits;
    }
    case "claims": {
      const bits: string[] = [];
      if (!hasApproved(text)) bits.push("approved");
      if (!hasProductionReady(text)) bits.push("production-ready");
      if (!hasFailoverOrStandby(text)) bits.push("a standby (failover)");
      if (!hasNotTheLiveSystem(text)) bits.push("not the live system itself");
      return bits;
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function namedStatusForBits(kind: StatusKind, bits: string[]): string {
  if (bits.length === 0) return "";
  const allMissing =
    (kind === "ai-os" && bits.length === 3)
    || (kind === "zdi" && bits.length === 3)
    || (kind === "claims" && bits.length === 4);
  if (allMissing) return canonicalNamedStatus(kind);
  return `${projectDisplayName(kind)} is ${joinStatusBits(bits)}.`;
}

function sentenceHasKindStatus(kind: StatusKind, sentence: string): boolean {
  switch (kind) {
    case "zdi":
      return hasApproved(sentence) || hasRollingOut(sentence) || hasNotLive(sentence);
    case "ai-os":
      return hasBuilt(sentence) || hasEarlyStage(sentence) || hasNotDeployed(sentence);
    case "claims":
      return (
        hasApproved(sentence)
        || hasProductionReady(sentence)
        || hasFailoverOrStandby(sentence)
        || hasNotTheLiveSystem(sentence)
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

const OTHER_PROJECT_RES: RegExp[] = [
  /\bdigi(?:\s+app\s+form)?\b/i,
  /\bcrm\b/i,
  /\bsitewarden\b/i,
  /\bcube(?:\s+agent)?\b/i,
  /\bclaims[\s-]extraction\b/i,
  /\bsentinel\b/i,
];

function sentenceProjectHits(sentence: string): number {
  let n = 0;
  if (ZDI_RE.test(sentence)) n += 1;
  if (AI_OS_RE.test(sentence)) n += 1;
  if (CLAIMS_RE.test(sentence)) n += 1;
  for (const re of OTHER_PROJECT_RES) {
    if (re.test(sentence)) n += 1;
  }
  return n;
}

function namesMultipleProjects(sentence: string): boolean {
  return sentenceProjectHits(sentence) > 1;
}

function isPronounStatusSentence(sentence: string, kind: StatusKind): boolean {
  return /^\s*it\s+(is|was|'s)\b/i.test(sentence) && sentenceHasKindStatus(kind, sentence);
}

const STATUS_LEFTOVER_STOP = new Set([
  "it",
  "is",
  "was",
  "are",
  "be",
  "been",
  "a",
  "an",
  "the",
  "and",
  "but",
  "for",
  "at",
  "to",
  "of",
  "in",
  "on",
  "or",
  "not",
  "yet",
  "itself",
  "soon",
  "current",
  "currently",
  "claims",
  "live",
  "system",
  "platform",
  "operations",
]);

function leftoverAfterStrippingStatus(sentence: string): string {
  let t = foldStatusText(sentence).replace(/\[\d+\]/g, " ").replace(/[^a-z0-9\s]/g, " ");
  t = t.replace(/\bzdi\b/g, " ");
  t = t.replace(/\bzororo document intelligence\b/g, " ");
  t = t.replace(/\bzororo ai os\b/g, " ");
  t = t.replace(/\bclaims operations(?: platform)?\b/g, " ");
  t = t.replace(/\bzororo claims\b/g, " ");
  t = t.replace(/\bclaims platform\b/g, " ");
  t = t.replace(/\bclaims system\b/g, " ");
  t = t.replace(/\bzororo phumulani\b/g, " ");
  t = t.replace(/\bproduction rollout\b/g, " ");
  t = t.replace(/\bproduction ready\b/g, " ");
  t = t.replace(/\brolling out\b/g, " ");
  t = t.replace(/\broll out\b/g, " ");
  t = t.replace(/\bnot(?: yet)? (?:live|deployed)\b/g, " ");
  t = t.replace(/\bearly stage\b/g, " ");
  t = t.replace(/\bfail over\b/g, " ");
  t = t.replace(/\bfailover\b/g, " ");
  t = t.replace(/\bstandby\b/g, " ");
  t = t.replace(/\bapproved\b/g, " ");
  t = t.replace(/\bbuilt\b/g, " ");
  t = t.replace(/\blive system\b/g, " ");
  t = t.replace(/\brather than\b/g, " ");
  return t
    .split(/\s+/)
    .filter((w) => w && !STATUS_LEFTOVER_STOP.has(w))
    .join(" ");
}

function spliceSentence(
  parts: string[],
  idx: number,
  replacement: string,
): string {
  const head = parts.slice(0, idx).join("");
  const rest = parts.slice(idx + 1).join("").trim();
  if (!rest) return `${head}${replacement}`.trim();
  const gap = /[.!?]$/.test(replacement) ? " " : ". ";
  return `${head}${replacement}${gap}${rest}`.replace(/ {2,}/g, " ").trim();
}

function appendStatusSentence(text: string, sentence: string, cites: string): string {
  const trimmed = text.trim();
  const injected = attachCites(sentence, cites);
  if (!trimmed) return injected;
  const sep = /[.!?]$/.test(trimmed) ? " " : ". ";
  return `${trimmed}${sep}${injected}`;
}

function splitSentences(text: string): string[] {
  const parts: string[] = [];
  const re = /[^.!?]+(?:[.!?]+(?:\s*\[\d+\])*)\s*|[^.!?]+$/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[0]) parts.push(match[0]);
  }
  return parts.length > 0 ? parts : [text];
}

function mentionRe(kind: StatusKind): RegExp {
  switch (kind) {
    case "zdi":
      return ZDI_RE;
    case "ai-os":
      return AI_OS_RE;
    case "claims":
      return CLAIMS_RE;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function foldMissingIntoSentence(
  sentence: string,
  kind: StatusKind,
  missing: string[],
): string {
  const { body, cites } = peelTrailingCitations(sentence.trim());
  const core = body.replace(/[.!?]$/, "").trim();
  if (missing.length === 0) return attachCites(`${core}.`, cites);
  const onlyNotLive =
    kind === "claims"
    && missing.length === 1
    && missing[0] === "not the live system itself";
  if (onlyNotLive) {
    return attachCites(`${core}, not the live system itself.`, cites);
  }
  if (leftoverAfterStrippingStatus(sentence) === "") {
    return attachCites(canonicalNamedStatus(kind), cites);
  }
  return attachCites(`${core}; it is ${joinStatusBits(missing)}.`, cites);
}

function foldFullIntoMention(
  mention: string,
  kind: StatusKind,
  extraCites = "",
): string {
  const { body, cites } = peelTrailingCitations(mention.trim());
  const core = body.replace(/[.!?]$/, "").trim();
  return attachCites(`${core}; it is ${fullStatusPredicate(kind)}.`, cites || extraCites);
}

// Fold missing status into the mentioning sentence, or add a named clause.
function insertStatusAfterMention(text: string, kind: StatusKind): string {
  const parts = splitSentences(text);
  const missing = missingStatusBits(kind, text);
  if (missing.length === 0) return text;

  const re = mentionRe(kind);
  const mentionIdx = parts.findIndex((part) => re.test(part));
  const pronounIdx = parts.findIndex(
    (part) => isPronounStatusSentence(part, kind) && sentenceProjectHits(part) === 0,
  );

  if (mentionIdx >= 0 && sentenceHasKindStatus(kind, parts[mentionIdx])) {
    const mention = parts[mentionIdx];
    if (!namesMultipleProjects(mention) && leftoverAfterStrippingStatus(mention) === "") {
      const { cites } = peelTrailingCitations(mention.trim());
      return spliceSentence(parts, mentionIdx, attachCites(canonicalNamedStatus(kind), cites));
    }
    if (namesMultipleProjects(mention)) {
      const kept = /[.!?]$/.test(mention.trim()) ? mention.trim() : `${mention.trim()}.`;
      const { cites } = peelTrailingCitations(mention.trim());
      return spliceSentence(
        parts,
        mentionIdx,
        `${kept} ${attachCites(namedStatusForBits(kind, missing), cites)}`.replace(/ {2,}/g, " "),
      );
    }
    return spliceSentence(parts, mentionIdx, foldMissingIntoSentence(mention, kind, missing));
  }

  if (pronounIdx >= 0 && mentionIdx >= 0 && !namesMultipleProjects(parts[mentionIdx])) {
    const { cites: pronounCites } = peelTrailingCitations(parts[pronounIdx].trim());
    const folded = foldFullIntoMention(parts[mentionIdx], kind, pronounCites);
    const withoutPronoun = parts.filter((_, i) => i !== pronounIdx);
    const newIdx = mentionIdx < pronounIdx ? mentionIdx : mentionIdx - 1;
    return spliceSentence(withoutPronoun, newIdx, folded);
  }

  if (pronounIdx >= 0) {
    const pronoun = parts[pronounIdx];
    if (leftoverAfterStrippingStatus(pronoun) === "") {
      const { cites } = peelTrailingCitations(pronoun.trim());
      return spliceSentence(parts, pronounIdx, attachCites(canonicalNamedStatus(kind), cites));
    }
    return spliceSentence(parts, pronounIdx, foldMissingIntoSentence(pronoun, kind, missing));
  }

  if (mentionIdx >= 0) {
    const mention = parts[mentionIdx];
    if (namesMultipleProjects(mention)) {
      const kept = /[.!?]$/.test(mention.trim()) ? mention.trim() : `${mention.trim()}.`;
      const { cites } = peelTrailingCitations(mention.trim());
      return spliceSentence(
        parts,
        mentionIdx,
        `${kept} ${attachCites(namedStatusForBits(kind, missing), cites)}`.replace(/ {2,}/g, " "),
      );
    }
    return spliceSentence(parts, mentionIdx, foldFullIntoMention(mention, kind));
  }

  const { body, cites } = peelTrailingCitations(text.trim());
  return appendStatusSentence(body, canonicalNamedStatus(kind), cites);
}

// Drop a second "Built." or "Status: Prototype." when the equivalent is already said.
export function collapseRepeatedStatus(text: string): string {
  return text
    .replace(/\bprototype\.\s*Status:\s*Prototype\.?/gi, "prototype.")
    .replace(/\bbuilt\.\s*Built\b/gi, "built");
}

const EVALUATIVE_CONCLUSION_RE =
  /\bthis (?:shows|demonstrates|proves) (?:he|him|mike|that (?:he|mike)) can\b/i;

function stripUncitedEvaluativeConclusions(text: string): string {
  const kept = splitSentences(text).filter((part) => {
    if (!EVALUATIVE_CONCLUSION_RE.test(part)) return true;
    return /\[\d+\]/.test(part);
  });
  return kept.join("").replace(/ {2,}/g, " ").trim();
}

// Force AWS copy, the Shipped/Rolling out split, ZDI status, and Zororo AI OS status.
export function ensureProjectStatusCopy(question: string, text: string): string {
  let out = text.trim();
  if (isZdiLiveQuestion(question)) {
    out = CANONICAL_ZDI_LIVE_ANSWER;
  }
  if (isTechLeadCrmQuestion(question) && !techLeadAnswerIsCanonical(out)) {
    out = CANONICAL_TECH_LEAD_CRM_ANSWER;
  }
  if (isAwsQuestion(question) && !awsAnswerIsCanonical(out)) {
    out = CANONICAL_AWS_ANSWER;
  }
  if (isProductionSystemsQuestion(question)) {
    out = CANONICAL_PRODUCTION_ANSWER;
  }
  if ((mentionsZdi(question) || mentionsZdi(out)) && !alreadyConveysStatus("zdi", out)) {
    out = insertStatusAfterMention(out, "zdi");
  }
  if ((mentionsAiOs(question) || mentionsAiOs(out)) && !alreadyConveysStatus("ai-os", out)) {
    out = insertStatusAfterMention(out, "ai-os");
  }
  if ((mentionsClaims(question) || mentionsClaims(out)) && !alreadyConveysStatus("claims", out)) {
    out = insertStatusAfterMention(out, "claims");
  }
  return collapseRepeatedStatus(stripUncitedEvaluativeConclusions(out));
}
