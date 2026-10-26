// Canonical production-system, AWS, ZDI, and Zororo AI OS status copy, plus a post-check.

export const ANSWER_CACHE_VERSION = "r27";

export const CANONICAL_PRODUCTION_ANSWER =
  "Shipped: Digi App Form [1] and the Zororo CRM [2] (over 40 people, around 10 roles). Rolling out: ZDI [3] (approved for production rollout at Zororo-Phumulani, rolling out soon, not yet live). The claims operations platform is an approved, production-ready standby (failover), not the live system [4].";

export const ZDI_STATUS_SENTENCE =
  "It is approved for production rollout at Zororo-Phumulani and rolling out soon, but it is not yet live.";

export const AI_OS_STATUS_SENTENCE =
  "It is built, early stage, and not deployed.";

export const CLAIMS_STATUS_SENTENCE =
  "It is an approved, production-ready standby (failover), not the live system.";

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

const TECH_LEAD_RE = /\btech lead\b/i;

const TECH_LEAD_TITLE_CLAIM_RE =
  /\b(?:the tech lead|as tech lead|was tech lead|is tech lead)\b/i;

const ELLIPSIS_RE = /…|\u2026|\.\.\./;

const AWS_PROVIDER_AS_CREDENTIAL_RE =
  /AWS Training and Certification|AWS Skills Center/i;

const REPEATED_STATUS_RES: RegExp[] = [
  /built\.\s*built/i,
  /prototype\.\s*status:\s*prototype/i,
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

// True when the visitor asked whether Mike was tech lead on the CRM.
export function isTechLeadCrmQuestion(question: string): boolean {
  return TECH_LEAD_RE.test(question) && /\bcrm\b/i.test(question);
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
  return /\bnot the live system\b/.test(foldStatusText(text));
}

// True when ZDI status covers approved, rolling out, and not (yet) live.
export function hasZdiStatus(text: string): boolean {
  return hasApproved(text) && hasRollingOut(text) && hasNotLive(text);
}

// True when Zororo AI OS is built and not (yet) deployed.
export function hasAiOsStatus(text: string): boolean {
  return hasBuilt(text) && hasEarlyStage(text) && hasNotDeployed(text);
}

// True when claims ops is approved, production-ready, and standby/failover.
export function hasClaimsStatus(text: string): boolean {
  return hasApproved(text) && hasProductionReady(text) && hasFailoverOrStandby(text);
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
function productionAnswerIsCanonical(text: string): boolean {
  if (ELLIPSIS_RE.test(text)) return false;
  return (
    /^shipped:/i.test(text) &&
    /rolling out:\s*zdi/i.test(text) &&
    /not yet live/i.test(text) &&
    /claims operations platform/i.test(text) &&
    /not the live system/i.test(text) &&
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

function joinStatusBits(bits: string[]): string {
  if (bits.length === 0) return "";
  if (bits.length === 1) return bits[0];
  if (bits.length === 2) return `${bits[0]} and ${bits[1]}`;
  return `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;
}

// Full sentence covering only the status facts the mention sentence is missing.
function statusSentenceFor(kind: StatusKind, mention: string): string | null {
  switch (kind) {
    case "zdi": {
      const approved = hasApproved(mention);
      const rolling = hasRollingOut(mention);
      const notLive = hasNotLive(mention);
      if (approved && rolling && notLive) return null;
      if (!approved && !rolling && !notLive) return ZDI_STATUS_SENTENCE;
      const bits: string[] = [];
      if (!approved) bits.push("approved for production rollout at Zororo-Phumulani");
      if (!rolling) bits.push("rolling out soon");
      if (!notLive) bits.push("not yet live");
      if (bits.length === 0) return null;
      if (bits.length === 1 && !notLive) return `It is ${bits[0]}.`;
      if (bits.length === 1) return `It is ${bits[0]}.`;
      const last = bits[bits.length - 1];
      const head = bits.slice(0, -1);
      if (last === "not yet live") {
        return `It is ${joinStatusBits(head)}, but it is not yet live.`;
      }
      return `It is ${joinStatusBits(bits)}.`;
    }
    case "ai-os": {
      const built = hasBuilt(mention);
      const early = hasEarlyStage(mention);
      const notDeployed = hasNotDeployed(mention);
      if (built && early && notDeployed) return null;
      if (!built && !early && !notDeployed) return AI_OS_STATUS_SENTENCE;
      const bits: string[] = [];
      if (!built) bits.push("built");
      if (!early) bits.push("early stage");
      if (!notDeployed) bits.push("not deployed");
      if (bits.length === 0) return null;
      return `It is ${joinStatusBits(bits)}.`;
    }
    case "claims": {
      const approved = hasApproved(mention);
      const ready = hasProductionReady(mention);
      const standby = hasFailoverOrStandby(mention);
      const notLiveSystem = hasNotTheLiveSystem(mention);
      if (approved && ready && standby) return null;
      if (!approved && !ready && !standby) return CLAIMS_STATUS_SENTENCE;
      const bits: string[] = [];
      if (!approved) bits.push("approved");
      if (!ready) bits.push("production-ready");
      if (!standby) bits.push("a standby (failover)");
      const core = bits.length > 0 ? `It is ${joinStatusBits(bits)}` : "It is";
      if (notLiveSystem) return bits.length > 0 ? `${core}.` : null;
      if (bits.length === 0) return "It is not the live system.";
      return `${core}, not the live system.`;
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
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

// Insert a full status sentence right after the sentence that names the project.
function insertStatusAfterMention(text: string, kind: StatusKind): string {
  const re = mentionRe(kind);
  const parts = splitSentences(text);
  const idx = parts.findIndex((part) => re.test(part));
  const mention = idx >= 0 ? parts[idx] : text;
  const sentence = statusSentenceFor(kind, mention);
  if (!sentence) return text;

  if (idx < 0) {
    const { body, cites } = peelTrailingCitations(text.trim());
    return appendStatusSentence(body, sentence, cites);
  }

  const { body, cites } = peelTrailingCitations(parts[idx].trim());
  const injected = attachCites(sentence, cites);
  const sep = /[.!?]$/.test(body) ? " " : ". ";
  const replaced = `${body}${sep}${injected}`;
  const head = parts.slice(0, idx).join("");
  const rest = parts.slice(idx + 1).join("").trim();
  if (!rest) return `${head}${replaced}`.trim();
  const gap = /[.!?]$/.test(replaced) ? " " : ". ";
  return `${head}${replaced}${gap}${rest}`.replace(/ {2,}/g, " ").trim();
}

// Drop a second "Built." or "Status: Prototype." when the equivalent is already said.
export function collapseRepeatedStatus(text: string): string {
  return text
    .replace(/\bprototype\.\s*Status:\s*Prototype\.?/gi, "prototype.")
    .replace(/\bbuilt\.\s*Built\b/gi, "built");
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
  if (isProductionSystemsQuestion(question) && !productionAnswerIsCanonical(out)) {
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
  return collapseRepeatedStatus(out);
}
