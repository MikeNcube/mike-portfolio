// Canonical production-system, AWS, ZDI, and Zororo AI OS status copy, plus a post-check.

import { GENERIC_WORD_LIST } from "./generic-words";
import { KNOWLEDGE_CHUNKS } from "./knowledge";
import {
  capitaliseAfterCiteStops,
  insertMissingSentenceSpaces,
  insertSpaceBeforeCites,
  moveTrailingCitesBeforeStop,
  splitIntoSentences,
  stripSourceAndPathLeakage,
} from "./normalise-answer";

export const ANSWER_CACHE_VERSION = "r55";

export type StatusSourceRef = { id?: string; title?: string; url?: string };

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

export const CANONICAL_CRM_ZDI_LIVE_ANSWER =
  "The lead-management CRM is a shipped live production system at Zororo-Phumulani [1]. ZDI is approved for production rollout at Zororo-Phumulani and rolling out soon, but it is not yet live [2].";

export const CANONICAL_AWS_ANSWER =
  "Mike's stack lists AWS services S3, EC2, IAM, CloudWatch, and Bedrock [1]. The resilient web tier on AWS is labelled lab, not production [2]. Training includes the Becoming an AI Practitioner Series (Introduction to AI; Introduction to Generative AI; Prompts and Working with Foundation Models) [3].";

export const CANONICAL_TECH_LEAD_CRM_ANSWER =
  "The sources do not use the title tech lead. Mike shipped the lead-management CRM at Zororo-Phumulani, used by over 40 people across around 10 roles [1]. His title is Applied AI Engineer and Systems Architect, and he is the sole AI engineer in a four-person IT team [2].";

const PRODUCTION_QUESTION_RE =
  /\b(production systems?|what has mike shipped|what did mike ship|shipped at zororo|in production|ship(?:ped)? live)\b/i;

const WORK_CORE_RE =
  /(?:^|[.!?,]\s*)(?:so |hey,? |and )?(?:what (?:does mike work on|has mike built|did mike build)|what projects (?:has|did) mike (?:built|build|work on)|show me (?:mike'?s projects|what mike has built|mike'?s work)|(?:give me (?:an? )?)?(?:overview|summary) of mike'?s (?:work|projects)|list mike'?s projects)(.*)$/i;

const WORK_WH_RE = /\b(?:what|which)\b/i;

const WORK_ACTION_RE =
  /\b(?:build|built|deliver(?:ed)?|ship(?:ped)?|make|made|create(?:d)?|develop(?:ed)?)\b/i;

const WORK_SCOPE_RE =
  /\b(?:zororo(?:-phumulani)?|employer|his company|at work)\b/i;

const WORK_TECH_OR_PROJECT_RE =
  /\b(?:rag|aws|python|langchain|langgraph|proactive sentinel|sentinel|fastapi|flask|next\.?js|typescript|react|gemini|groq|redis|postgres(?:ql)?|docker|bedrock|sitewarden|cube(?:\s+agent)?|anthropic|claude|openai)\b/i;

const WORK_FILLER_RE =
  /\b(?:recently|so far|lately|to date|before|already|overall|in total|in general|professionally|at all)\b/gi;

const ZDI_RE = /\b(zdi|zororo document intelligence)\b/i;

const ZDI_LIVE_QUESTION_RE =
  /\b(?:is zdi\b.{0,32}\b(?:live|rolled out|deployed)|has zdi been (?:rolled out|deployed|launched)|zdi\b.{0,24}\b(?:rolled out|rollout|rolling out))\b/i;

const OTHER_LIVE_PROJECT_RE = /\bcrm\b|\bdigi\b|\bsentinel\b|\bsitewarden\b/i;

const AI_OS_RE = /\bzororo ai os\b/i;

const CLAIMS_RE =
  /\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b|\bclaims system\b/i;

const AWS_QUESTION_RE = /\baws\b/i;

const AWS_OVERCLAIM_RE = /\bextensive(?:ly)?\b|\bproduction-grade\b/i;

const TECH_LEAD_RE =
  /\b(?:tech lead|team lead|engineering lead)\b/i;

const TECH_LEAD_TITLE_CLAIM_RE =
  /\b(?:the tech lead|as tech lead|was tech lead|is tech lead)\b/i;

const ELLIPSIS_RE = /…|\u2026|\.\.\./;

const AWS_PROVIDER_AS_CREDENTIAL_RE =
  /AWS Training and Certification|AWS Skills Center/i;

const CONTACT_EMAIL_TAIL_RE = /\s*Email mikencube03@gmail\.com\.?\s*$/i;

const OTHER_PROJECT_RES: RegExp[] = [
  /\bdigi(?:\s+app\s+form)?\b/i,
  /\bcrm\b/i,
  /\bsitewarden\b/i,
  /\bcube(?:\s+agent)?\b/i,
  /\bclaims[\s-]extraction\b/i,
  /\bsentinel\b/i,
];

type StatusKind = "zdi" | "ai-os" | "claims";

const STATUS_SOURCE_ID: Record<StatusKind, string> = {
  zdi: "zdi-signature-workflow",
  "ai-os": "zororo-ai-os",
  claims: "zororo-claims",
};

const BACK_TO_BACK_STATUS_RES: RegExp[] = [
  /built\.\s*built/i,
  /prototype\.\s*status:\s*prototype/i,
];

// True when the visitor asked which production systems Mike shipped.
const SINGLE_PROJECT_RE =
  /\b(?:zdi|crm|digi(?: app form)?|sentinel|sitewarden|cube|zororo ai os|claims (?:operations )?platform|content pipeline|fastapi|flask|postgres(?:ql)?|sqlite|redis|celery|docker|python|typescript|react|next\.js|jwt|langgraph|pgvector)\b/i;

// Words that keep a production question about the shipped list itself: what was
// shipped, where it runs and who uses it.
const PRODUCTION_LIST_WORDS = new Set([
  ...GENERIC_WORD_LIST,
  "production", "prod", "system", "systems", "project", "projects", "app", "apps",
  "application", "applications", "product", "products", "software", "tool", "tools",
  "build", "builds", "built", "ship", "ships", "shipped", "shipping", "live", "run",
  "runs", "running", "deploy", "deployed", "deployment", "deployments", "serve",
  "serves", "serving", "users", "customers", "traffic", "zororo", "phumulani",
  "funeral", "assurance", "company", "employer", "experience", "track", "record",
]);

// True when a word outside the production phrase names a topic of its own: "stop
// an LLM hallucinating in production" asks about hallucination, and "in
// production" only qualifies it.
function hasOtherTopic(question: string): boolean {
  const rest = question.replace(new RegExp(PRODUCTION_QUESTION_RE.source, "gi"), " ").toLowerCase();
  const words = rest.match(/[a-z][a-z'’-]*/g) ?? [];
  return words.some((word) => !PRODUCTION_LIST_WORDS.has(word.replace(/['’]s$/, "").replace(/['’]/g, "")));
}

export function isProductionSystemsQuestion(question: string): boolean {
  if (!PRODUCTION_QUESTION_RE.test(question)) return false;
  if (hasOtherTopic(question)) return false;
  // "Is ZDI in production?" asks about one project, not for the shipped list.
  const asksForList = /\bproduction systems?\b|\bwhat (?:has|did) mike ship/i.test(question);
  return asksForList || !SINGLE_PROJECT_RE.test(question);
}

function stripWorkScopeWords(text: string): string {
  return text
    .replace(/\b(?:at\s+)?zororo(?:-phumulani)?(?:\s+funeral(?:\s+assurance)?)?\b/gi, " ")
    .replace(/\b(?:for\s+)?(?:his\s+)?(?:employer|company)\b/gi, " ")
    .replace(/\bat work\b/gi, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
}

function stripWorkFillerWords(text: string): string {
  return text.replace(WORK_FILLER_RE, " ").replace(/[^a-z0-9]+/gi, " ").trim();
}

function meaningfulWorkRemainder(text: string): string {
  return stripWorkFillerWords(stripWorkScopeWords(text));
}

function remainderAfterWorkCore(question: string): string | null {
  const m = question.match(WORK_CORE_RE);
  if (!m) return null;
  return (m[1] ?? "").replace(/[?!.\s]+$/g, "").trim();
}

// True when "what has Mike built / did Mike build" names a tech, tool, cloud, or other project.
export function isTopicalTechBuildQuestion(question: string): boolean {
  const rest = remainderAfterWorkCore(question);
  if (rest !== null) {
    return meaningfulWorkRemainder(rest).length > 0;
  }
  if (!(WORK_WH_RE.test(question) && WORK_ACTION_RE.test(question))) return false;
  if (WORK_SCOPE_RE.test(question) && !WORK_TECH_OR_PROJECT_RE.test(question)) return false;
  return WORK_TECH_OR_PROJECT_RE.test(question);
}

// True when the visitor asked what Mike works on / has built at Zororo (not a tech/project topic).
export function isWorkQuestion(question: string): boolean {
  if (isProductionSystemsQuestion(question)) return false;
  if (isAwsQuestion(question)) return false;
  if (isTopicalTechBuildQuestion(question)) return false;
  const rest = remainderAfterWorkCore(question);
  if (rest !== null && meaningfulWorkRemainder(rest).length === 0) return true;
  return WORK_WH_RE.test(question) && WORK_ACTION_RE.test(question) && WORK_SCOPE_RE.test(question);
}

const EXPERIENCE_QUESTION_RE =
  /\b(?:tell me about mike'?s (?:experience|background|career)|(?:give me (?:an? )?)?(?:summary|overview) of mike'?s (?:experience|background|career)|mike'?s (?:experience|background|career))\b/i;

export function isExperienceQuestion(question: string): boolean {
  if (isAwsQuestion(question)) return false;
  if (WORK_TECH_OR_PROJECT_RE.test(question)) return false;
  return EXPERIENCE_QUESTION_RE.test(question);
}

// True when the text names ZDI or Zororo Document Intelligence.
export function mentionsZdi(text: string): boolean {
  return ZDI_RE.test(text);
}

// True when the visitor asked whether ZDI is live, and only ZDI.
export function isZdiLiveQuestion(question: string): boolean {
  return ZDI_LIVE_QUESTION_RE.test(question) && !OTHER_LIVE_PROJECT_RE.test(question);
}

// True when the visitor asked whether both the CRM and ZDI are live.
export function isCrmAndZdiLiveQuestion(question: string): boolean {
  return ZDI_LIVE_QUESTION_RE.test(question) && /\bcrm\b/i.test(question);
}

// True when the text names Zororo AI OS.
export function mentionsAiOs(text: string): boolean {
  return AI_OS_RE.test(text);
}

// True when the text names the claims operations platform.
export function mentionsClaims(text: string): boolean {
  return CLAIMS_RE.test(text);
}

// True when the visitor asked about AWS experience, stack, labs, or what Mike built using AWS.
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
  /\bnot(?: yet)? deployed\b|\bhas(?: not|n't) been deployed\b|\bundeployed\b|\bnot(?: yet)? in production\b/g;

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
  const span = stripUmbrellaStatusFraming(projectFollowSpan("ai-os", body) || body);
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

function stripUmbrellaStatusFraming(text: string): string {
  return text
    .replace(/\b(?:several|many|multiple)\s+production\s+and\s+early[- ]stage\s+systems\b/gi, " ")
    .replace(/\bearly[- ]stage\s+systems\b/gi, " ");
}

function kindStatusRepeatCount(kind: StatusKind, span: string): boolean {
  const t = stripUmbrellaStatusFraming(span);
  switch (kind) {
    case "ai-os":
      return countMatches(t, EARLY_STAGE_MEANING_RE) > 1 || countMatches(t, NOT_DEPLOYED_MEANING_RE) > 1;
    case "zdi":
      return countMatches(t, /\bapproved\b/g) > 1 || countMatches(t, /\bnot(?: yet)? live\b/g) > 1;
    case "claims":
      return (
        countMatches(t, /standby \(failover\)/g) > 1
        || countMatches(t, /not the live system/g) > 1
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

// True when THIS project's span repeats a status meaning. Umbrella lines are not a repeat.
export function hasRepeatedStatus(text: string): boolean {
  const { body } = splitCurrentStatus(text);
  if (BACK_TO_BACK_STATUS_RES.some((re) => re.test(body))) return true;
  for (const kind of ["zdi", "ai-os", "claims"] as const) {
    if (!mentionsKind(kind, body)) continue;
    if (kindStatusRepeatCount(kind, projectFollowSpan(kind, body))) return true;
  }
  return false;
}

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

function namedStatusKinds(text: string): StatusKind[] {
  const kinds: StatusKind[] = [];
  for (const kind of ["zdi", "ai-os", "claims"] as const) {
    if (mentionsKind(kind, text)) kinds.push(kind);
  }
  return kinds;
}

function isSameProjectFollowUp(sentence: string): boolean {
  if (sentenceProjectHits(sentence) > 0) return false;
  return (
    /^\s*it\b/i.test(sentence)
    || /^\s*the platform\b/i.test(sentence)
    || /^\s*the project\b/i.test(sentence)
    || /^\s*the system\b/i.test(sentence)
    || /^\s*this (?:system|platform|project|product)\b/i.test(sentence)
  );
}

// Mentioning sentences plus continuations until another project is named.
function projectFollowSpan(kind: StatusKind, text: string): string {
  const parts = splitSentences(text);
  const re = mentionRe(kind);
  const keep = parts.map(() => false);
  let following = false;
  for (let i = 0; i < parts.length; i++) {
    if (re.test(parts[i])) {
      keep[i] = true;
      following = sentenceProjectHits(parts[i]) === 1;
      const earlierNamesAProject = parts.slice(0, i).some((p) => sentenceProjectHits(p) > 0);
      if (!earlierNamesAProject) {
        for (let j = i - 1; j >= 0; j--) {
          if (sentenceProjectHits(parts[j]) > 0) break;
          if (!isSameProjectFollowUp(parts[j])) break;
          keep[j] = true;
        }
      }
      continue;
    }
    if (following && sentenceProjectHits(parts[i]) === 0) {
      keep[i] = true;
      continue;
    }
    following = false;
  }
  return parts.filter((_, i) => keep[i]).join("");
}

// Sentences that name this project, plus follow-ups until another project is named.
function projectSpan(kind: StatusKind, text: string): string {
  const named = namedStatusKinds(text);
  if (named.length === 1 && named[0] === kind) return text;
  return projectFollowSpan(kind, text);
}

function projectMentionIndexes(text: string): Array<{ index: number }> {
  const found: Array<{ index: number }> = [];
  const add = (re: RegExp) => {
    const global = new RegExp(re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = global.exec(text)) !== null) {
      found.push({ index: m.index });
    }
  };
  add(ZDI_RE);
  add(AI_OS_RE);
  add(CLAIMS_RE);
  for (const re of OTHER_PROJECT_RES) add(re);
  return found.sort((a, b) => a.index - b.index);
}

function stripTrailingCiteAndParens(text: string): string {
  let out = text;
  for (;;) {
    const next = out
      .replace(/\s*\[\d+\]\s*$/, "")
      .replace(/\s*\([^()]*\)\s*$/, "")
      .replace(/[\s.,;:]+$/, "");
    if (next === out) return out.trimEnd();
    out = next;
  }
}

function endsWithProjectMention(text: string): boolean {
  const stripped = stripTrailingCiteAndParens(text);
  if (!stripped) return false;
  const res = [ZDI_RE, AI_OS_RE, CLAIMS_RE, ...OTHER_PROJECT_RES];
  return res.some((re) => new RegExp(`(?:${re.source})$`, "i").test(stripped));
}

// Last list break: ';', ', and', or a comma after a project item (not 'early-stage, not-deployed').
function lastListBreak(before: string): number {
  type Sep = { start: number; end: number; always: boolean };
  const seps: Sep[] = [];
  let depth = 0;
  for (let i = 0; i < before.length; i++) {
    const ch = before[i];
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth !== 0) continue;
    if (ch === ";") {
      seps.push({ start: i, end: i + 1, always: true });
      continue;
    }
    if (ch === ",") {
      const andMatch = before.slice(i).match(/^,\s*and\b/i);
      if (andMatch) {
        seps.push({ start: i, end: i + andMatch[0].length, always: true });
        i += andMatch[0].length - 1;
        continue;
      }
      seps.push({ start: i, end: i + 1, always: false });
    }
  }

  let best = 0;
  for (const sep of seps) {
    const rightHas = projectMentionIndexes(before.slice(sep.end)).length > 0;
    if (sep.always) {
      best = sep.end;
      if (!rightHas) break;
      continue;
    }
    if (!endsWithProjectMention(before.slice(0, sep.start))) continue;
    best = sep.end;
    if (!rightHas) break;
  }
  return best;
}

// Clip a list sentence at list separators, not at every comma (keep 'early-stage, not-deployed').
function clauseAroundMention(kind: StatusKind, text: string): string {
  const re = mentionRe(kind);
  re.lastIndex = 0;
  const m = re.exec(text);
  if (!m) return text;
  const before = text.slice(0, m.index);
  const start = lastListBreak(before);
  const afterMention = text.slice(m.index + m[0].length);
  const next = nextOtherProjectIndex(afterMention, kind);
  const end = next >= 0 ? m.index + m[0].length + next : text.length;
  return text.slice(start, end);
}

// Status text for one project: its mentioning sentences, or the question's subject if unnamed.
function statusTextForKind(kind: StatusKind, text: string, question: string): string {
  const named = namedStatusKinds(text);
  if (named.length === 1 && named[0] === kind) return text;
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

function firstMentionIndex(kind: StatusKind, text: string, question: string): number {
  const re = mentionRe(kind);
  re.lastIndex = 0;
  const inText = re.exec(text);
  if (inText) return inText.index;
  re.lastIndex = 0;
  const inQ = re.exec(question);
  return inQ ? 10_000 + inQ.index : Number.MAX_SAFE_INTEGER;
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
  kinds.sort((a, b) => firstMentionIndex(a, text, question) - firstMentionIndex(b, text, question));
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

function titleMatchesKind(kind: StatusKind, title: string): boolean {
  switch (kind) {
    case "zdi":
      return /\bzdi\b|document intelligence/i.test(title);
    case "ai-os":
      return /ai os/i.test(title);
    case "claims":
      return /claims operations/i.test(title);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function sourceCiteForKind(kind: StatusKind, sources: StatusSourceRef[]): string {
  if (sources.length === 0) return "";
  const id = STATUS_SOURCE_ID[kind];
  const idIdx = sources.findIndex((s) => s.id === id);
  if (idIdx >= 0) return `[${idIdx + 1}]`;
  const titleIdx = sources.findIndex((s) => titleMatchesKind(kind, s.title ?? ""));
  if (titleIdx >= 0) return `[${titleIdx + 1}]`;
  return "";
}

function canonicalSourceForKind(kind: StatusKind): StatusSourceRef | null {
  const id = STATUS_SOURCE_ID[kind];
  const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === id);
  if (!chunk || !chunk.sourceUrl.startsWith("http")) return null;
  return { id: chunk.id, title: chunk.title, url: chunk.sourceUrl };
}

// Append each incomplete project's canonical source when it is missing from the list.
export function sourcesWithCanonicalStatus(
  question: string,
  text: string,
  sources: StatusSourceRef[],
): StatusSourceRef[] {
  const out = [...sources];
  for (const kind of statusKindsToFill(question, text)) {
    if (sourceCiteForKind(kind, out)) continue;
    const extra = canonicalSourceForKind(kind);
    if (!extra) continue;
    if (out.some((s) => s.id && extra.id && s.id === extra.id)) continue;
    out.push(extra);
  }
  return out;
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

function joinStatusBits(bits: string[]): string {
  if (bits.length === 0) return "";
  if (bits.length === 1) return bits[0];
  if (bits.length === 2) return `${bits[0]} and ${bits[1]}`;
  return `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
}

function projectDisplayName(kind: StatusKind): string {
  switch (kind) {
    case "zdi":
      return "ZDI";
    case "ai-os":
      return "Zororo AI OS";
    case "claims":
      return "the claims operations platform";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function missingStatusBits(kind: StatusKind, text: string): string[] {
  switch (kind) {
    case "zdi": {
      const bits: string[] = [];
      if (!hasApproved(text)) bits.push("approved for production rollout");
      if (!hasNotLive(text)) bits.push("not yet live");
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
      if (!hasFailoverOrStandby(text)) bits.push("a standby");
      if (!hasNotTheLiveSystem(text)) bits.push("not the live system");
      return bits;
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function claimsMissingPhrase(missing: string[]): string {
  const needA = missing.includes("approved");
  const needP = missing.includes("production-ready");
  const needS = missing.includes("a standby");
  const needN = missing.includes("not the live system");
  let identity = "";
  if (needA && needP && needS) identity = "an approved, production-ready standby";
  else if (needA && needP) identity = "approved and production-ready";
  else if (needA && needS) identity = "an approved standby";
  else if (needP && needS) identity = "a production-ready standby";
  else if (needA) identity = "approved";
  else if (needP) identity = "production-ready";
  else if (needS) identity = "a standby";
  if (identity && needN) return `${identity}, not the live system`;
  if (identity) return identity;
  if (needN) return "not the live system";
  return "";
}

function currentStatusClause(kind: StatusKind, span: string): string {
  const missing = missingStatusBits(kind, span);
  if (missing.length === 0) return "";
  const allMissing =
    (kind === "zdi" && missing.length === 2)
    || (kind === "ai-os" && missing.length === 2)
    || (kind === "claims" && missing.length === 4);
  if (allMissing) {
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
  if (kind === "claims") {
    const phrase = claimsMissingPhrase(missing);
    return phrase ? `${projectDisplayName(kind)} is ${phrase}` : "";
  }
  return `${projectDisplayName(kind)} is ${joinStatusBits(missing)}`;
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
  const parts: string[] = [];
  for (const kind of kinds) {
    const span = statusTextForKind(kind, body, question);
    const clause = currentStatusClause(kind, span);
    if (!clause) continue;
    const cite = ownCitation(kind, body, sources);
    parts.push(cite ? `${clause} ${cite}` : clause);
  }
  if (parts.length === 0) return text;
  const sentence = `Current status: ${parts.join("; ")}.`;
  const trimmed = body.trim();
  const sep = /[.!?]$/.test(trimmed) ? " " : ". ";
  const combined = `${trimmed}${sep}${sentence}`.replace(/ {2,}/g, " ").trim();
  if (!email) return combined;
  const emailBit = CONTACT_EMAIL_TAIL_RE.test(email) ? email.trim() : `Email mikencube03@gmail.com.`;
  return `${combined} ${emailBit}`.replace(/ {2,}/g, " ").trim();
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

function splitSentences(text: string): string[] {
  return splitIntoSentences(text);
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

function normaliseCiteClusters(text: string): string {
  return text.replace(/(?:\[\d+\])(?:\s*\[\d+\])+/g, (cluster) => {
    const nums = [...cluster.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const unique = [...new Set(nums)].sort((a, b) => a - b);
    return unique.map((n) => `[${n}]`).join("");
  });
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

// Collapse identical [n] repeats in one sentence; sort adjacent clusters to [1][2].
export function collapseDuplicateCitesInSentences(text: string): string {
  return splitSentences(normaliseCiteClusters(text)).map(collapseDuplicateCitesInSentence).join("");
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
    .replace(/(^|[.!?]\s+),+\s*/g, "$1");
  out = moveTrailingCitesBeforeStop(out);
  out = insertMissingSentenceSpaces(out);
  out = insertSpaceBeforeCites(out);
  out = stripSourceAndPathLeakage(out);
  out = capitaliseAfterCiteStops(out);
  return out.replace(/ {2,}/g, " ").trim();
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

function stripKnownNegations(sentence: string): string {
  return sentence
    .replace(/zororo ai os/gi, " ")
    .replace(/\bai os\b/gi, " ")
    .replace(/\bno ai\b/gi, " ")
    .replace(/not(?: yet)? (?:the )?live/gi, " ")
    .replace(/rather than the(?: current)? live/gi, " ")
    .replace(/\bhas(?: not|n't) been deployed(?: yet)?\b/gi, " ")
    .replace(/\bnot(?: yet)? deployed\b/gi, " ")
    .replace(/\bundeployed\b/gi, " ")
    .replace(/\bnot(?: yet)? in production\b/gi, " ")
    .replace(/not production/gi, " ")
    .replace(/\bnot an llm product\b/gi, " ")
    .replace(/\bnot(?: an)? llm[ -]?based\b/gi, " ");
}

function hasLiveLaunchClaim(hay: string): boolean {
  return (
    /\balready\s+live\b/i.test(hay)
    || /\bwent live\b/i.test(hay)
    || /\bis live\b/i.test(hay)
    || /\blive (?:system|production|platform)\b/i.test(hay)
    || /\bin production\b/i.test(hay)
    || /\bcurrently live\b/i.test(hay)
    || /\bnow live\b/i.test(hay)
    || /\blaunched\b/i.test(hay)
    || /\bdeployed\b/i.test(hay)
  );
}

function contradictsZdiAsAi(sentence: string): boolean {
  if (!ZDI_RE.test(sentence)) return false;
  const hay = stripKnownNegations(sentence);
  return (
    /\bai[ -]?driven\b/i.test(hay)
    || /\bdecision[ -]?support\b/i.test(hay)
    || /\bmachine learning\b|\bml\b/i.test(hay)
    || /\ban ai\b/i.test(hay)
    || /\bis ai\b/i.test(hay)
    || /\bas ai\b/i.test(hay)
    || /\bai (?:tool|system|platform|product|assistant|model|workflow)\b/i.test(hay)
  );
}

function contradictsShippedAsEarly(sentence: string): boolean {
  const mentionsDigi = /\bdigi\b/i.test(sentence);
  const mentionsCrm = /\bcrm\b/i.test(sentence);
  if (!mentionsDigi && !mentionsCrm) return false;
  if (AI_OS_RE.test(sentence)) return false;
  return /\bearly[ -]?stage\b/i.test(sentence) || /\bnot(?: yet)? deployed\b/i.test(sentence);
}

function contradictsClaimsAsLive(sentence: string): boolean {
  if (!/\bclaims operations\b|\bzororo-claims\b|\bclaims platform\b/i.test(sentence)) {
    return false;
  }
  const hay = stripKnownNegations(sentence);
  return hasLiveLaunchClaim(hay) || /\bprimary\b/i.test(hay);
}

function contradictsAiOsAsDeployed(sentence: string): boolean {
  if (!AI_OS_RE.test(sentence)) return false;
  const hay = stripKnownNegations(sentence);
  return hasLiveLaunchClaim(hay) || /\bproduction systems?\b/i.test(hay);
}

function contradictsZdiAsLive(sentence: string): boolean {
  if (!ZDI_RE.test(sentence)) return false;
  const hay = stripKnownNegations(sentence);
  return hasLiveLaunchClaim(hay);
}

function contradictsSentinelAsLlm(sentence: string): boolean {
  if (!/\b(?:proactive )?sentinel\b/i.test(sentence)) return false;
  const hay = stripKnownNegations(sentence);
  return (
    /\bai[ -]?driven\b/i.test(hay)
    || /\bllm[ -]?based\b/i.test(hay)
    || /\bllm (?:product|system|tool)\b/i.test(hay)
  );
}

const PROJECT_TEST_COUNTS: Array<{ mention: RegExp; count: number }> = [
  { mention: ZDI_RE, count: 525 },
  { mention: /\b(?:proactive )?sentinel\b/i, count: 44 },
  { mention: AI_OS_RE, count: 310 },
  { mention: /\bsitewarden\b/i, count: 89 },
];

function contradictsCrossProjectTestCount(sentence: string): boolean {
  if (!/\btests?\b/i.test(sentence)) return false;
  const mentioned = PROJECT_TEST_COUNTS.filter((p) => p.mention.test(sentence));
  if (mentioned.length === 0) return false;
  for (const project of mentioned) {
    if (new RegExp(`\\b${project.count}\\b`).test(sentence)) continue;
    for (const other of PROJECT_TEST_COUNTS) {
      if (other.count === project.count) continue;
      if (new RegExp(`\\b${other.count}\\b`).test(sentence)) return true;
    }
  }
  return false;
}

function sentenceHasProjectFactContradiction(sentence: string): boolean {
  return (
    contradictsZdiAsAi(sentence)
    || contradictsZdiAsLive(sentence)
    || contradictsShippedAsEarly(sentence)
    || contradictsClaimsAsLive(sentence)
    || contradictsAiOsAsDeployed(sentence)
    || contradictsSentinelAsLlm(sentence)
    || contradictsCrossProjectTestCount(sentence)
  );
}

export function hasProjectFactContradiction(text: string): boolean {
  return splitIntoSentences(text).some(sentenceHasProjectFactContradiction);
}

function applyCanonicalGuards(question: string, text: string): string {
  let out = text.trim();
  if (isCrmAndZdiLiveQuestion(question)) {
    out = CANONICAL_CRM_ZDI_LIVE_ANSWER;
  } else if (isZdiLiveQuestion(question)) {
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
  if (isWorkQuestion(question)) {
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
  const sourced = sourcesWithCanonicalStatus(question, out, sources);
  out = appendCurrentStatus(question, out, sourced);
  out = collapseDuplicateCitesInSentences(out);
  out = sanitisePunctuation(out);
  return collapseRepeatedStatus(stripUncitedEvaluativeConclusions(out));
}
