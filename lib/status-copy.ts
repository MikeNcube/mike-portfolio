// Canonical production-system, AWS, ZDI, and Zororo AI OS status copy, plus a post-check.

export const ANSWER_CACHE_VERSION = "r24";

export const CANONICAL_PRODUCTION_ANSWER =
  "Shipped: Digi App Form and the Zororo CRM (over 40 people, around 10 roles). Rolling out: ZDI (approved for production rollout, rolling out soon, not yet live). The claims operations platform is an approved, production-ready standby.";

export const ZDI_STATUS_SENTENCE =
  "Approved for production rollout, rolling out soon, not yet live.";

export const AI_OS_STATUS_SENTENCE = "Built. Early stage, not deployed.";

export const CLAIMS_STATUS_SENTENCE =
  "Approved, production-ready standby (failover).";

export const CANONICAL_AWS_ANSWER =
  "Mike's stack lists AWS services S3, EC2, IAM, CloudWatch, and Bedrock. The resilient web tier on AWS is labelled lab, not production. AWS training and certifications include AWS Training and Certification, AWS Skills Center, and the Becoming an AI Practitioner Series.";

export const CANONICAL_TECH_LEAD_CRM_ANSWER =
  "The sources do not use the title tech lead. Mike shipped the lead-management CRM at Zororo-Phumulani, used by over 40 people across around 10 roles [1]. His title is Applied AI Engineer and Systems Architect, and he is the sole AI engineer in a four-person IT team.";

const PRODUCTION_QUESTION_RE =
  /\b(production systems|what has mike shipped|what did mike (?:ship|build)|shipped at zororo)\b/i;

const ZDI_RE = /\b(zdi|zororo document intelligence)\b/i;

const AI_OS_RE = /\bzororo ai os\b/i;

const CLAIMS_RE =
  /\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b|\bclaims system\b/i;

const AWS_QUESTION_RE = /\baws\b/i;

const AWS_OVERCLAIM_RE = /\bextensive(?:ly)?\b|\bproduction-grade\b/i;

const TECH_LEAD_RE = /\btech lead\b/i;

const TECH_LEAD_TITLE_CLAIM_RE =
  /\b(?:the tech lead|as tech lead|was tech lead|is tech lead)\b/i;

const ELLIPSIS_RE = /…|\u2026|\.\.\./;

// True when the visitor asked which production systems Mike shipped.
export function isProductionSystemsQuestion(question: string): boolean {
  return PRODUCTION_QUESTION_RE.test(question);
}

// True when the text names ZDI or Zororo Document Intelligence.
export function mentionsZdi(text: string): boolean {
  return ZDI_RE.test(text);
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
    && /AWS Training and Certification/i.test(text)
    && !AWS_OVERCLAIM_RE.test(text)
  );
}

// True when ZDI status covers approved, rolling out, and not (yet) live.
export function hasZdiStatus(text: string): boolean {
  return /approved/i.test(text) && /rolling out/i.test(text) && /not (yet )?live/i.test(text);
}

// True when Zororo AI OS is built and not (yet) deployed.
export function hasAiOsStatus(text: string): boolean {
  return /built/i.test(text) && /early stage/i.test(text) && /not (yet )?deployed/i.test(text);
}

// True when claims ops is approved, production-ready, and standby/failover.
export function hasClaimsStatus(text: string): boolean {
  return (
    /approved/i.test(text)
    && /production[- ]ready/i.test(text)
    && /(standby|fail-?over)/i.test(text)
  );
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
    /claims operations platform/i.test(text) &&
    !zdiListedAsShipped(text)
  );
}

// Pull trailing [n] markers off so a status sentence can sit before them.
function peelTrailingCitations(text: string): { body: string; cites: string } {
  const m = text.match(/^(.*?)((?:\s*\[\d+\])+)\s*[.!?]?$/s);
  if (!m || !m[1].trim()) return { body: text, cites: "" };
  return { body: m[1].trim(), cites: m[2].trim().replace(/\s+/g, " ") };
}

function appendStatusSentence(text: string, sentence: string): string {
  const trimmed = text.trim();
  if (!trimmed) return sentence;
  const { body, cites } = peelTrailingCitations(trimmed);
  const sep = /[.!?]$/.test(body) ? " " : ". ";
  const core = `${body}${sep}${sentence}`;
  if (!cites) return core;
  return /[.!?]$/.test(core) ? `${core} ${cites}` : `${core}. ${cites}`;
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

function canonicalSentence(kind: StatusKind): string {
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

// Insert the status sentence right after the sentence that names the project.
function insertStatusAfterMention(text: string, kind: StatusKind): string {
  const sentence = canonicalSentence(kind);
  const re = mentionRe(kind);
  const parts = splitSentences(text);
  const idx = parts.findIndex((part) => re.test(part));
  if (idx < 0) return appendStatusSentence(text, sentence);

  const { body, cites } = peelTrailingCitations(parts[idx].trim());
  const sep = /[.!?]$/.test(body) ? " " : ". ";
  const core = `${body}${sep}${sentence}`;
  const injected = cites
    ? (/[.!?]$/.test(core) ? `${core} ${cites}` : `${core}. ${cites}`)
    : core;
  const head = parts.slice(0, idx).join("");
  const rest = parts.slice(idx + 1).join("").trim();
  if (!rest) return `${head}${injected}`.trim();
  const gap = /[.!?]$/.test(injected) ? " " : ". ";
  return `${head}${injected}${gap}${rest}`.replace(/ {2,}/g, " ").trim();
}

// Force AWS copy, the Shipped/Rolling out split, ZDI status, and Zororo AI OS status.
export function ensureProjectStatusCopy(question: string, text: string): string {
  let out = text.trim();
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
  return out;
}
