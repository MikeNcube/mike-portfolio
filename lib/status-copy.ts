// Canonical production-system, AWS, ZDI, and Zororo AI OS status copy, plus a post-check.

export const ANSWER_CACHE_VERSION = "r33";

export type StatusSourceRef = { id?: string; title?: string };

export const CANONICAL_PRODUCTION_ANSWER =
  "Shipped: Digi App Form [1] and the Zororo CRM [2] (over 40 people, around 10 roles). Rolling out: ZDI [3] (approved for production rollout at Zororo-Phumulani, rolling out soon, not yet live). The claims operations platform is an approved, production-ready standby (failover) for Zororo-Phumulani's current claims system, not the live system itself [4].";

export const CANONICAL_WORK_ANSWER =
  "At Zororo-Phumulani Mike shipped Digi App Form [1] and the lead-management CRM [2]. ZDI is approved for production rollout but not yet live [3]. The claims operations platform is an approved, production-ready standby, not the live system [4]. Zororo AI OS is early-stage and not yet deployed [5].";

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
  /\b(production systems|what has mike shipped|what did mike ship|shipped at zororo)\b/i;

const WORK_QUESTION_RE =
  /\bwhat (?:does mike work on|has mike built|did mike build)\b/i;

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

const CONTACT_EMAIL_TAIL_RE = /\s*Email mikencube03@gmail\.com\.?\s*$/i;

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

// True when the visitor asked what Mike works on / has built (not the production-systems list).
export function isWorkQuestion(question: string): boolean {
  if (isProductionSystemsQuestion(question)) return false;
  return WORK_QUESTION_RE.test(question);
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

function splitCurrentStatus(text: string): { body: string; status: string } {
  const idx = text.search(/\bCurrent status:/i);
  if (idx < 0) return { body: text, status: "" };
  return { body: text.slice(0, idx), status: text.slice(idx) };
}

// True when Zororo AI OS is early-stage and not (yet) deployed. "Built" alone is not required.
export function hasAiOsStatus(text: string): boolean {
  return hasEarlyStage(text) && hasNotDeployed(text);
}

// True when early-stage and not-deployed each appear once on the AI OS span (Current status excluded).
export function aiOsStatusAppearsOnce(text: string): boolean {
  const { body, status } = splitCurrentStatus(text);
  const span = projectSpan("ai-os", body) || body;
  const early = countMatches(span, EARLY_STAGE_MEANING_RE);
  const deployed = countMatches(span, NOT_DEPLOYED_MEANING_RE);
  if (status && mentionsAiOs(status)) {
    return early <= 1 && deployed <= 1 && hasAiOsStatus(`${span} ${status}`);
  }
  return early === 1 && deployed === 1;
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

// True when an answer repeats a status word back-to-back. The Current status line is excluded.
export function hasRepeatedStatus(text: string): boolean {
  const { body } = splitCurrentStatus(text);
  return REPEATED_STATUS_RES.some((re) => re.test(body));
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

// Clip a list sentence to this project's own clause so a neighbour's "approved" cannot satisfy it.
function clauseAroundMention(kind: StatusKind, text: string): string {
  const re = mentionRe(kind);
  re.lastIndex = 0;
  const m = re.exec(text);
  if (!m) return text;
  const before = text.slice(0, m.index);
  const lastSemi = before.lastIndexOf(";");
  const lastComma = before.lastIndexOf(",");
  const lastBreak = Math.max(lastSemi, lastComma);
  const start = lastBreak >= 0 ? lastBreak + 1 : 0;
  const afterMention = text.slice(m.index + m[0].length);
  const next = nextOtherProjectIndex(afterMention, kind);
  const end = next >= 0 ? m.index + m[0].length + next : text.length;
  return text.slice(start, end);
}

// Status text for one project: its mentioning sentences, or the question's subject if unnamed.
function statusTextForKind(kind: StatusKind, text: string, question: string): string {
  const span = projectSpan(kind, text);
  if (!span.trim()) {
    if (!mentionsKind(kind, question)) return "";
    const parts = splitSentences(text);
    const allKinds: StatusKind[] = ["zdi", "ai-os", "claims"];
    const otherKinds = allKinds.filter((k) => k !== kind);
    const owned = parts.filter((part) => otherKinds.every((k) => !mentionRe(k).test(part)));
    return owned.join("") || text;
  }
  if (sentenceProjectHits(span) > 1) {
    const clause = clauseAroundMention(kind, span);
    if (clause.trim()) return clause;
  }
  return span;
}

function statusKindsToFill(question: string, text: string): StatusKind[] {
  const kinds: StatusKind[] = [];
  for (const kind of ["zdi", "claims", "ai-os"] as const) {
    if (
      (mentionsKind(kind, question) || mentionsKind(kind, text))
      && !alreadyConveysStatus(kind, text, question)
    ) {
      kinds.push(kind);
    }
  }
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
): string {
  const fromSources = sourceCiteForKind(kind, sources);
  if (fromSources) return fromSources;
  const near = citationNearMention(kind, text);
  if (near) return near;
  const all = uniqueCitationMarkers(text);
  if (all.length === 1) return all[0];
  return "";
}

function currentStatusClause(kind: StatusKind): string {
  switch (kind) {
    case "zdi":
      return "ZDI is approved for production rollout but not yet live";
    case "ai-os":
      return "Zororo AI OS is early-stage and not yet deployed";
    case "claims":
      return "the claims operations platform is an approved, production-ready standby, not the live system";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function peelContactEmail(text: string): { body: string; email: string } {
  const m = text.match(/^(.*?)(\s*Email mikencube03@gmail\.com\.?\s*)$/is);
  if (!m || !m[1].trim()) return { body: text, email: "" };
  return { body: m[1].trim(), email: m[2].replace(/^\s+/, " ").trimEnd() };
}

function appendCurrentStatus(
  question: string,
  text: string,
  sources: StatusSourceRef[],
): string {
  const kinds = statusKindsToFill(question, text);
  if (kinds.length === 0) return text;
  const { body, email } = peelContactEmail(text.trim());
  const parts = kinds.map((kind) => {
    const clause = currentStatusClause(kind);
    const cite = ownCitation(kind, body, sources);
    return cite ? `${clause} ${cite}` : clause;
  });
  const sentence = `Current status: ${parts.join("; ")}.`;
  const trimmed = body.trim();
  const sep = /[.!?]$/.test(trimmed) ? " " : ". ";
  const combined = `${trimmed}${sep}${sentence}`.replace(/ {2,}/g, " ").trim();
  if (!email) return combined;
  const emailBit = CONTACT_EMAIL_TAIL_RE.test(email) ? email.trim() : `Email mikencube03@gmail.com.`;
  return `${combined} ${emailBit}`.replace(/ {2,}/g, " ").trim();
}

const OTHER_PROJECT_RES: RegExp[] = [
  /\bdigi(?:\s+app\s+form)?\b/i,
  /\bcrm\b/i,
  /\bsitewarden\b/i,
  /\bcube(?:\s+agent)?\b/i,
  /\bclaims[\s-]extraction\b/i,
  /\bsentinel\b/i,
];

function sentenceHasKindStatus(kind: StatusKind, sentence: string): boolean {
  switch (kind) {
    case "zdi":
      return hasApproved(sentence) || hasNotLive(sentence);
    case "ai-os":
      return hasEarlyStage(sentence) || hasNotDeployed(sentence);
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

function isPronounStatusSentence(sentence: string, kind: StatusKind): boolean {
  return /^\s*it\s+(is|was|'s)\b/i.test(sentence) && sentenceHasKindStatus(kind, sentence);
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

function collapseDuplicateCitesInSentence(sentence: string): string {
  const nums = [...sentence.matchAll(/\[(\d+)\]/g)].map((m) => m[1]);
  if (nums.length < 2) return sentence;
  if (new Set(nums).size !== 1) return sentence;
  const stripped = sentence
    .replace(/\s*\[\d+\]/g, "")
    .replace(/\s+([,;:.!?])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
  return attachCites(stripped, `[${nums[0]}]`);
}

// Collapse identical [n] repeats in one sentence to a single cite at the sentence end.
export function collapseDuplicateCitesInSentences(text: string): string {
  return splitSentences(text).map(collapseDuplicateCitesInSentence).join("");
}

function productionLabelHaystack(sentence: string): string {
  return sentence
    .replace(/approved for production rollout/gi, " ")
    .replace(/production-ready/gi, " ")
    .replace(/not production/gi, " ");
}

function sentenceFalselyLabelsProduction(sentence: string): boolean {
  if (!/\bproduction systems?\b/i.test(productionLabelHaystack(sentence))) return false;
  return mentionsZdi(sentence) || mentionsClaims(sentence) || mentionsAiOs(sentence);
}

export function falselyLabelsNonProductionAsProduction(text: string): boolean {
  if (productionAnswerIsCanonical(text) || text.trim() === CANONICAL_WORK_ANSWER) return false;
  return splitSentences(text).some(sentenceFalselyLabelsProduction);
}

function stripFalseProductionLabel(text: string): string {
  if (productionAnswerIsCanonical(text) || text.trim() === CANONICAL_WORK_ANSWER) return text;
  return splitSentences(text)
    .map((sentence) => {
      if (!sentenceFalselyLabelsProduction(sentence)) return sentence;
      return sentence
        .replace(/\bproduction systems\b/gi, "projects")
        .replace(/\bproduction system\b/gi, "project");
    })
    .join("");
}

function peelUnbalancedParens(text: string): string[] {
  const failures: string[] = [];
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (depth < 0) {
      failures.push("unbalanced parentheses");
      return failures;
    }
  }
  if (depth !== 0) failures.push("unbalanced parentheses");
  return failures;
}

// Punctuation defects that must fail evals and be sanitised in output.
export function punctuationFailures(text: string): string[] {
  const failures: string[] = [];
  if (/,(?=[A-Za-z])/.test(text)) failures.push("comma without following space");
  if (/;(?=[A-Za-z])/.test(text)) failures.push("semicolon without following space");
  if (/\]\.,/.test(text)) failures.push("].,");
  if (/\]\.;/.test(text)) failures.push("].;");
  if (/\. ,/.test(text)) failures.push(". ,");
  if (/(^|[^.])\.\.($|[^.])/.test(text)) failures.push("..");
  if (/(?:^|[.!?]\s+),/.test(text)) failures.push("sentence starts with comma");
  failures.push(...peelUnbalancedParens(text));
  return failures;
}

export function punctuationIsSane(text: string): boolean {
  return punctuationFailures(text).length === 0;
}

// Repair list-fold garble without rewriting the model's words.
export function sanitisePunctuation(text: string): string {
  let out = text
    .replace(/\]\.,/g, "],")
    .replace(/\]\.;/g, "];")
    .replace(/\. ,/g, ". ")
    .replace(/(^|[^.])\.\.($|[^.])/g, "$1.$2")
    .replace(/,(?=[A-Za-z])/g, ", ")
    .replace(/;(?=[A-Za-z])/g, "; ")
    .replace(/(^|[.!?]\s+),+\s*/g, "$1")
    .replace(/ {2,}/g, " ");
  return out.trim();
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

function applyCanonicalGuards(question: string, text: string): string {
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
  if (isWorkQuestion(question) && !/\[\d+\]/.test(out)) {
    out = CANONICAL_WORK_ANSWER;
  }
  if (isWorkQuestion(question) && falselyLabelsNonProductionAsProduction(out)) {
    out = CANONICAL_WORK_ANSWER;
  }
  return out;
}

// Never rewrite the model's sentences. Append one Current status line when meaning is missing.
export function ensureProjectStatusCopy(
  question: string,
  text: string,
  sources: StatusSourceRef[] = [],
): string {
  let out = applyCanonicalGuards(question, text);
  out = stripFalseProductionLabel(out);
  out = appendCurrentStatus(question, out, sources);
  out = collapseDuplicateCitesInSentences(out);
  out = sanitisePunctuation(out);
  return collapseRepeatedStatus(stripUncitedEvaluativeConclusions(out));
}
