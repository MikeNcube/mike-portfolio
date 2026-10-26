// Canonical production-system, AWS, ZDI, and Zororo AI OS status copy, plus a post-check.

export const ANSWER_CACHE_VERSION = "r32";

export type StatusSourceRef = { id?: string; title?: string };

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
  const t = foldStatusText(text);
  return (
    /\bearly (?:stage|development|phase)\b/.test(t)
    || /\bin development\b/.test(t)
    || /\bprototype\b/.test(t)
    || /\bnot production ready\b/.test(t)
  );
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
  return /\b(?:built|builds|building|developed|developing|created|designed)\b/.test(
    foldStatusText(text),
  );
}

function hasNotDeployed(text: string): boolean {
  const t = foldStatusText(text);
  return (
    /\bnot(?: yet)? deployed\b/.test(t)
    || /\bhas(?: not|n't) been deployed\b/.test(t)
    || /\bnot(?: yet)? in production\b/.test(t)
    || /\bundeployed\b/.test(t)
    || /\bnot(?: yet)? live\b/.test(t)
  );
}

function hasNotLive(text: string): boolean {
  return /\bnot(?: yet)? live\b/.test(foldStatusText(text));
}

function hasNotTheLiveSystem(text: string): boolean {
  const t = foldStatusText(text);
  return (
    /\b(?:not|rather than) the(?: current)? live(?: \(\s*claims\s*\)| claims)? system(?: itself)?\b/.test(
      t,
    )
    || /\b(?:failover|fail over|standby)(?:\s*\([^)]*\))?\s+for the(?: current)? live(?: \(\s*claims\s*\)| claims)? system\b/.test(
      t,
    )
  );
}

// True when ZDI is approved and not (yet) live. "Rolling out soon" alone is not required.
export function hasZdiStatus(text: string): boolean {
  return hasApproved(text) && hasNotLive(text);
}

const EARLY_STAGE_MEANING_RE =
  /\bearly (?:stage|development|phase)\b|\bin development\b|\bprototype\b|\bnot production ready\b/g;

const NOT_DEPLOYED_MEANING_RE =
  /\bnot(?: yet)? deployed\b|\bhas(?: not|n't) been deployed\b|\bundeployed\b|\bnot(?: yet)? in production\b|\bnot(?: yet)? live\b/g;

function countMatches(text: string, re: RegExp): number {
  const global = new RegExp(re.source, "g");
  return (foldStatusText(text).match(global) ?? []).length;
}

// True when Zororo AI OS is early-stage and not (yet) deployed. "Built" alone is not required.
export function hasAiOsStatus(text: string): boolean {
  return hasEarlyStage(text) && hasNotDeployed(text);
}

// True when early-stage and not-deployed each appear once on the AI OS span.
export function aiOsStatusAppearsOnce(text: string): boolean {
  const span = projectSpan("ai-os", text) || text;
  return countMatches(span, EARLY_STAGE_MEANING_RE) === 1
    && countMatches(span, NOT_DEPLOYED_MEANING_RE) === 1;
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

function mentionsKind(kind: StatusKind, text: string): boolean {
  switch (kind) {
    case "zdi":
      return mentionsZdi(text);
    case "ai-os":
      return mentionsAiOs(text);
    case "claims":
      return mentionsClaims(text);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function firstMentionIndex(text: string, kind: StatusKind): number {
  const m = mentionRe(kind).exec(text);
  return m ? m.index : Number.POSITIVE_INFINITY;
}

// Sentences that name this project, plus a following pronoun status clause for that project.
function projectSpan(kind: StatusKind, text: string): string {
  const parts = splitSentences(text);
  const re = mentionRe(kind);
  const kept: string[] = [];
  let includeNextPronoun = false;
  for (const part of parts) {
    if (re.test(part)) {
      kept.push(part);
      includeNextPronoun = sentenceProjectHits(part) === 1;
      continue;
    }
    if (
      includeNextPronoun
      && isPronounStatusSentence(part, kind)
      && sentenceProjectHits(part) === 0
    ) {
      kept.push(part);
      continue;
    }
    includeNextPronoun = false;
  }
  return kept.join("");
}

// Status text for one project: its mentioning sentences, or the question's subject if unnamed.
function statusTextForKind(kind: StatusKind, text: string, question: string): string {
  const span = projectSpan(kind, text);
  if (span.trim()) return span;
  if (!mentionsKind(kind, question)) return "";
  const parts = splitSentences(text);
  const allKinds: StatusKind[] = ["zdi", "ai-os", "claims"];
  const otherKinds = allKinds.filter((k) => k !== kind);
  const owned = parts.filter((part) => otherKinds.every((k) => !mentionRe(k).test(part)));
  return owned.join("") || text;
}

function statusKindsToFill(question: string, text: string): StatusKind[] {
  const kinds: StatusKind[] = [];
  for (const kind of ["zdi", "ai-os", "claims"] as const) {
    if (
      (mentionsKind(kind, question) || mentionsKind(kind, text))
      && !alreadyConveysStatus(kind, text, question)
    ) {
      kinds.push(kind);
    }
  }
  kinds.sort((a, b) => {
    const ia = firstMentionIndex(text, a);
    const ib = firstMentionIndex(text, b);
    if (ia !== ib) return ib - ia;
    return firstMentionIndex(question, b) - firstMentionIndex(question, a);
  });
  return kinds;
}

// Skip appending only when THIS project's mentioning sentences already have the full meaning.
function alreadyConveysStatus(kind: StatusKind, text: string, question: string): boolean {
  const span = statusTextForKind(kind, text, question);
  if (!span.trim()) return false;
  switch (kind) {
    case "zdi":
      return hasZdiStatus(span);
    case "ai-os":
      return hasAiOsStatus(span);
    case "claims":
      return hasClaimsStatus(span);
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

function sourceCiteForKind(kind: StatusKind, sources: StatusSourceRef[]): string {
  if (sources.length === 0) return "";
  const idx = sources.findIndex((s) => {
    const title = s.title ?? "";
    switch (kind) {
      case "zdi":
        return s.id === "zdi-signature-workflow" || /\bzdi\b|document intelligence/i.test(title);
      case "ai-os":
        return s.id === "zororo-ai-os" || /ai os/i.test(title);
      case "claims":
        return s.id === "zororo-claims" || /\bclaims\b/i.test(title);
      default: {
        const _exhaustive: never = kind;
        return _exhaustive;
      }
    }
  });
  return idx >= 0 ? `[${idx + 1}]` : "";
}

function nextOtherProjectIndex(after: string, kind: StatusKind): number {
  let min = -1;
  const consider = (index: number) => {
    if (index >= 0 && (min < 0 || index < min)) min = index;
  };
  for (const k of ["zdi", "ai-os", "claims"] as const) {
    if (k === kind) continue;
    const re = mentionRe(k);
    re.lastIndex = 0;
    const m = re.exec(after);
    if (m) consider(m.index);
  }
  for (const re of OTHER_PROJECT_RES) {
    re.lastIndex = 0;
    const m = re.exec(after);
    if (m) consider(m.index);
  }
  return min;
}

function citationNearMention(kind: StatusKind, text: string): string {
  const re = mentionRe(kind);
  re.lastIndex = 0;
  const m = re.exec(text);
  if (!m) return "";
  const after = text.slice(m.index + m[0].length);
  const next = nextOtherProjectIndex(after, kind);
  const window = next >= 0 ? after.slice(0, next) : after;
  const cite = window.match(/\[(\d+)\]/);
  return cite ? `[${cite[1]}]` : "";
}

function uniqueCitationMarkers(text: string): string[] {
  return [...new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => `[${m[1]}]`))];
}

// Cite THIS project from the source list or its own clause, never a neighbour's trailing [n].
function ownCitation(
  kind: StatusKind,
  text: string,
  sources: StatusSourceRef[],
  clauseCites = "",
): string {
  const fromSources = sourceCiteForKind(kind, sources);
  if (fromSources) return fromSources;
  if (clauseCites) return clauseCites;
  const near = citationNearMention(kind, text);
  if (near) return near;
  const all = uniqueCitationMarkers(text);
  if (all.length === 1) return all[0];
  return "";
}

function citeStatusForKind(
  sentence: string,
  kind: StatusKind,
  sourceText: string,
  sources: StatusSourceRef[],
  clauseCites = "",
): string {
  if (/\[\d+\]/.test(sentence)) return sentence;
  return attachCites(sentence, ownCitation(kind, sourceText, sources, clauseCites));
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
      if (!hasNotLive(text)) bits.push("not yet live");
      if (!hasRollingOut(text) && bits.length > 0) bits.splice(1, 0, "rolling out soon");
      return bits;
    }
    case "ai-os": {
      const bits: string[] = [];
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
    (kind === "zdi" && bits.length === 3)
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
  t = t.replace(/\bhas(?: not|n t) been deployed\b/g, " ");
  t = t.replace(/\bnot(?: yet)? in production\b/g, " ");
  t = t.replace(/\bundeployed\b/g, " ");
  t = t.replace(/\bearly (?:stage|development|phase)\b/g, " ");
  t = t.replace(/\bin development\b/g, " ");
  t = t.replace(/\bprototype\b/g, " ");
  t = t.replace(/\bnot production ready\b/g, " ");
  t = t.replace(/\bfail over\b/g, " ");
  t = t.replace(/\bfailover\b/g, " ");
  t = t.replace(/\bstandby\b/g, " ");
  t = t.replace(/\bapproved\b/g, " ");
  t = t.replace(/\b(?:built|builds|building|developed|developing|created|designed)\b/g, " ");
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

function wordCount(text: string): number {
  return foldStatusText(text).split(/\s+/).filter(Boolean).length;
}

function projectIsSubject(sentence: string, kind: StatusKind): boolean {
  const body = peelTrailingCitations(sentence.trim()).body.replace(/[.!?]$/, "").trim();
  const re = mentionRe(kind);
  re.lastIndex = 0;
  const m = re.exec(body);
  if (!m) return false;
  const prefix = body.slice(0, m.index).trim();
  if (!prefix) return true;
  return /^(the|mike'?s)$/i.test(prefix);
}

function canUsePronounFold(sentence: string, kind: StatusKind): boolean {
  if (namesMultipleProjects(sentence)) return false;
  if (/;/.test(sentence)) return false;
  if (!projectIsSubject(sentence, kind)) return false;
  const body = peelTrailingCitations(sentence.trim()).body.replace(/[.!?]$/, "").trim();
  return wordCount(body) <= 16;
}

function foldMissingIntoSentence(
  sentence: string,
  kind: StatusKind,
  missing: string[],
  sourceText: string,
  sources: StatusSourceRef[],
): string {
  const { body, cites } = peelTrailingCitations(sentence.trim());
  const core = body.replace(/[.!?]$/, "").trim();
  const cite = ownCitation(kind, sourceText, sources, namesMultipleProjects(sentence) ? "" : cites);
  if (missing.length === 0) return attachCites(`${core}.`, cite);
  const onlyNotLive =
    kind === "claims"
    && missing.length === 1
    && missing[0] === "not the live system itself";
  if (onlyNotLive) {
    return attachCites(`${core}, not the live system itself.`, cite);
  }
  if (leftoverAfterStrippingStatus(sentence) === "") {
    return citeStatusForKind(canonicalNamedStatus(kind), kind, sourceText, sources, cite);
  }
  const bits = joinStatusBits(missing);
  if (canUsePronounFold(sentence, kind)) {
    return attachCites(`${core}; it is ${bits}.`, cite);
  }
  const head = attachCites(`${core}.`, cites || cite);
  return `${head} ${citeStatusForKind(`${projectDisplayName(kind)} is ${bits}.`, kind, sourceText, sources, cite)}`.replace(/ {2,}/g, " ");
}

function foldFullIntoMention(
  mention: string,
  kind: StatusKind,
  extraCites = "",
  sourceText = mention,
  sources: StatusSourceRef[] = [],
): string {
  const { body, cites } = peelTrailingCitations(mention.trim());
  const core = body.replace(/[.!?]$/, "").trim();
  const cite = ownCitation(kind, sourceText, sources, cites || extraCites);
  const predicate = fullStatusPredicate(kind);
  if (canUsePronounFold(mention, kind)) {
    return attachCites(`${core}; it is ${predicate}.`, cite);
  }
  const head = attachCites(`${core}.`, cites || cite);
  return `${head} ${citeStatusForKind(`${projectDisplayName(kind)} is ${predicate}.`, kind, sourceText, sources, cite)}`.replace(/ {2,}/g, " ");
}

function projectNamePattern(kind: StatusKind): RegExp | null {
  switch (kind) {
    case "ai-os":
      return /(Zororo AI OS(?:\s*\([^)]*\))?)/i;
    case "zdi":
      return /(\bZDI\b(?:\s*\([^)]*\))?)/;
    case "claims":
      return /(the claims operations platform(?:\s*\([^)]*\))?)/i;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

// Fold a relative clause after the project name instead of a second named sentence.
function extractProjectClause(
  sentence: string,
  kind: StatusKind,
): { prefix: string; clause: string; suffix: string } | null {
  const re = mentionRe(kind);
  re.lastIndex = 0;
  const m = re.exec(sentence);
  if (!m) return null;
  const before = sentence.slice(0, m.index);
  const lastSemi = before.lastIndexOf(";");
  const lastComma = before.lastIndexOf(",");
  let start = 0;
  if (lastSemi >= 0) start = lastSemi + 1;
  else if (lastComma >= 0 && namesMultipleProjects(sentence)) start = lastComma + 1;
  const after = sentence.slice(m.index);
  const nextOther = nextOtherProjectIndex(after, kind);
  let end = nextOther >= 0 ? m.index + nextOther : sentence.length;
  const clauseAfter = sentence.slice(m.index, end);
  const citeMatch = clauseAfter.match(/\[(\d+)\]/);
  if (citeMatch && citeMatch.index !== undefined) {
    end = m.index + citeMatch.index + citeMatch[0].length;
  }
  return {
    prefix: sentence.slice(0, start),
    clause: sentence.slice(start, end).trim(),
    suffix: sentence.slice(end),
  };
}

function foldBitsIntoClaimsClause(
  clause: string,
  missing: string[],
): { clause: string; remaining: string[] } {
  let remaining = [...missing];
  let out = clause;
  if (remaining.includes("approved") && /\bproduction-ready\b/i.test(out) && !/\bapproved\b/i.test(out)) {
    if (/\ban?\s+production-ready\b/i.test(out)) {
      out = out.replace(/\ban?\s+production-ready\b/i, "an approved, production-ready");
    } else {
      out = out.replace(/\bproduction-ready\b/i, "approved, production-ready");
    }
    remaining = remaining.filter((b) => b !== "approved");
  }
  if (
    remaining.includes("not the live system itself")
    && !hasNotTheLiveSystem(out)
    && hasFailoverOrStandby(out)
  ) {
    const { body, cites } = peelTrailingCitations(out.trim());
    const core = body.replace(/[.!?;]$/, "").trim();
    out = attachCites(`${core}, not the live system itself.`, cites);
    remaining = remaining.filter((b) => b !== "not the live system itself");
  }
  return { clause: out, remaining };
}

function foldIntoProjectClause(
  mention: string,
  kind: StatusKind,
  missing: string[],
  sourceText: string,
  sources: StatusSourceRef[],
): string | null {
  const span = extractProjectClause(mention, kind);
  if (!span) return null;
  const { cites: clauseCites } = peelTrailingCitations(span.clause.trim());
  let clause = span.clause;
  let remaining = missing;
  if (kind === "claims") {
    const folded = foldBitsIntoClaimsClause(clause, remaining);
    clause = folded.clause;
    remaining = folded.remaining;
  }
  if (remaining.length === 0) {
    const gap = span.suffix.startsWith(";") || span.suffix.startsWith(",") || span.suffix.startsWith(".")
      ? ""
      : span.suffix.trim() ? " " : "";
    return `${span.prefix}${clause}${gap}${span.suffix}`.replace(/ {2,}/g, " ").trim();
  }
  if (remaining.length === missing.length) return null;
  const named = citeStatusForKind(
    namedStatusForBits(kind, remaining),
    kind,
    sourceText,
    sources,
    clauseCites,
  );
  return `${span.prefix}${clause}${span.suffix} ${named}`.replace(/ {2,}/g, " ").trim();
}

function foldWhichAfterName(
  sentence: string,
  kind: StatusKind,
  bits: string[],
): string | null {
  if (kind !== "ai-os") return null;
  if (bits.length !== 1 || bits[0] !== "not yet deployed") return null;
  const nameRe = projectNamePattern(kind);
  if (!nameRe) return null;
  const { body, cites } = peelTrailingCitations(sentence.trim());
  const punctMatch = body.match(/[.!?]$/);
  const punct = punctMatch ? punctMatch[0] : "";
  const core = punctMatch ? body.slice(0, -1) : body;
  nameRe.lastIndex = 0;
  const found = nameRe.exec(core);
  if (!found || found.index < 0) return null;
  const clause = joinStatusBits(bits);
  const after = core.slice(found.index + found[0].length);
  const needsTrailingComma = /^\s+and\b/i.test(after);
  const injected =
    `${core.slice(0, found.index)}${found[0]}, which is ${clause}${needsTrailingComma ? "," : ""}${after}`;
  return attachCites(`${injected}${punct || "."}`, cites);
}

function multiProjectStatusInsert(
  mention: string,
  kind: StatusKind,
  missing: string[],
  sourceText: string,
  sources: StatusSourceRef[],
): string {
  const clauseFold = foldIntoProjectClause(mention, kind, missing, sourceText, sources);
  if (clauseFold) return clauseFold;
  const which = foldWhichAfterName(mention, kind, missing);
  if (which) return which;
  const kept = /[.!?]$/.test(mention.trim()) ? mention.trim() : `${mention.trim()}.`;
  const named = citeStatusForKind(
    namedStatusForBits(kind, missing),
    kind,
    sourceText,
    sources,
    "",
  );
  return `${kept} ${named}`.replace(/ {2,}/g, " ");
}

// Fold missing status into the mentioning sentence, or add a named clause.
function insertStatusAfterMention(
  text: string,
  kind: StatusKind,
  question: string,
  sources: StatusSourceRef[],
): string {
  const parts = splitSentences(text);
  const missing = missingStatusBits(kind, statusTextForKind(kind, text, question));
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
      return spliceSentence(
        parts,
        mentionIdx,
        citeStatusForKind(canonicalNamedStatus(kind), kind, text, sources, cites),
      );
    }
    if (namesMultipleProjects(mention)) {
      return spliceSentence(
        parts,
        mentionIdx,
        multiProjectStatusInsert(mention, kind, missing, text, sources),
      );
    }
    return spliceSentence(
      parts,
      mentionIdx,
      foldMissingIntoSentence(mention, kind, missing, text, sources),
    );
  }

  if (pronounIdx >= 0 && mentionIdx >= 0 && !namesMultipleProjects(parts[mentionIdx])) {
    const { cites: pronounCites } = peelTrailingCitations(parts[pronounIdx].trim());
    const folded = foldFullIntoMention(parts[mentionIdx], kind, pronounCites, text, sources);
    const withoutPronoun = parts.filter((_, i) => i !== pronounIdx);
    const newIdx = mentionIdx < pronounIdx ? mentionIdx : mentionIdx - 1;
    return spliceSentence(withoutPronoun, newIdx, folded);
  }

  if (pronounIdx >= 0) {
    const pronoun = parts[pronounIdx];
    if (leftoverAfterStrippingStatus(pronoun) === "") {
      const { cites } = peelTrailingCitations(pronoun.trim());
      return spliceSentence(
        parts,
        pronounIdx,
        citeStatusForKind(canonicalNamedStatus(kind), kind, text, sources, cites),
      );
    }
    return spliceSentence(
      parts,
      pronounIdx,
      foldMissingIntoSentence(pronoun, kind, missing, text, sources),
    );
  }

  if (mentionIdx >= 0) {
    const mention = parts[mentionIdx];
    if (namesMultipleProjects(mention)) {
      return spliceSentence(
        parts,
        mentionIdx,
        multiProjectStatusInsert(mention, kind, missing, text, sources),
      );
    }
    return spliceSentence(parts, mentionIdx, foldFullIntoMention(mention, kind, "", text, sources));
  }

  return appendStatusSentence(
    text.trim(),
    citeStatusForKind(canonicalNamedStatus(kind), kind, text, sources, ""),
    "",
  );
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
export function ensureProjectStatusCopy(
  question: string,
  text: string,
  sources: StatusSourceRef[] = [],
): string {
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
  for (const kind of statusKindsToFill(question, out)) {
    out = insertStatusAfterMention(out, kind, question, sources);
  }
  return collapseRepeatedStatus(stripUncitedEvaluativeConclusions(out));
}
