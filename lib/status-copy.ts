// Canonical production-system, ZDI, and Zororo AI OS status copy, plus a post-check.

export const ANSWER_CACHE_VERSION = "r18";

export const CANONICAL_PRODUCTION_ANSWER =
  "Shipped: Digi App Form and the Zororo CRM (over 40 people, around 10 roles). Rolling out: ZDI (approved for production rollout, rolling out soon, not yet live). The claims operations platform is an approved, production-ready standby.";

export const ZDI_STATUS_SENTENCE =
  "Approved for production rollout, rolling out soon, not yet live.";

export const AI_OS_STATUS_SENTENCE = "Built. Early stage, not deployed.";

const PRODUCTION_QUESTION_RE =
  /\b(production systems|what has mike shipped|what did mike (?:ship|build)|shipped at zororo)\b/i;

const ZDI_RE = /\b(zdi|zororo document intelligence)\b/i;

const AI_OS_RE = /\bzororo ai os\b/i;

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

// True when ZDI status covers approved, rolling out soon, and not yet live.
export function hasZdiStatus(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("approved for production rollout") &&
    t.includes("rolling out soon") &&
    t.includes("not yet live")
  );
}

// True when Zororo AI OS is described as built, early stage, and not deployed.
export function hasAiOsStatus(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes("built") && t.includes("early stage") && t.includes("not deployed");
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

function appendStatusSentence(text: string, sentence: string): string {
  const trimmed = text.trim();
  if (!trimmed) return sentence;
  const sep = /[.!?]$/.test(trimmed) ? " " : ". ";
  return `${trimmed}${sep}${sentence}`;
}

// Force the Shipped/Rolling out split, ZDI status, and Zororo AI OS status.
export function ensureProjectStatusCopy(question: string, text: string): string {
  let out = text.trim();
  if (isProductionSystemsQuestion(question) && !productionAnswerIsCanonical(out)) {
    out = CANONICAL_PRODUCTION_ANSWER;
  }
  if ((mentionsZdi(question) || mentionsZdi(out)) && !hasZdiStatus(out)) {
    out = appendStatusSentence(out, ZDI_STATUS_SENTENCE);
  }
  if ((mentionsAiOs(question) || mentionsAiOs(out)) && !hasAiOsStatus(out)) {
    out = appendStatusSentence(out, AI_OS_STATUS_SENTENCE);
  }
  return out;
}
