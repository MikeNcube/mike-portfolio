// One pass over every model answer before refusal, citations, or status copy.

const CURLY_SINGLE = /[\u2018\u2019]/g;
const CURLY_DOUBLE = /[\u201C\u201D]/g;
const HYPHEN_LIKE = /[\u2010\u2011\u2012]/g;
const LONG_DASH = /(\s*)[\u2013\u2014\u2015](\s*)/g;
const FULLWIDTH_CITE = /[【［]\s*(\d+)\s*[】］]/g;
const CITE_CLUSTER = /(?:\[\d+\]){2,}/g;

const ABBREV_BEFORE_DOT =
  /(?:\b(?:e\.g|i\.e|etc|vs|mr|mrs|ms|dr|prof|approx|al))\.$/i;

function collapseCitationClusters(text: string): string {
  return text.replace(CITE_CLUSTER, (cluster) => {
    const nums = [...cluster.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const unique = [...new Set(nums)].sort((a, b) => a - b);
    return unique.map((n) => `[${n}]`).join("");
  });
}

// Spaced en/em dashes become a comma pause; tight ones become ' - ' so words never join.
function replaceLongDashes(text: string): string {
  return text.replace(LONG_DASH, (_m, before: string, after: string) => {
    if (before.length > 0 || after.length > 0) return ", ";
    return " - ";
  });
}

function isInsideUrlOrEmail(text: string, index: number): boolean {
  let start = index;
  while (start > 0 && !/\s/.test(text[start - 1] ?? "")) start -= 1;
  const token = text.slice(start, index + 1);
  const urlLike = /@/.test(token) || /^https?:\/\//i.test(token) || /^www\./i.test(token);
  if (!urlLike) return false;
  const next = text[index + 1] ?? "";
  return /[A-Za-z0-9/?#\-._]/.test(next);
}

function consumeBoundaryTail(text: string, punctIndex: number): number {
  let j = punctIndex + 1;
  while (j < text.length && /[.!?]/.test(text[j] ?? "")) j += 1;
  const citeMatch = text.slice(j).match(/^(?:\s*\[\d+\])+/);
  if (citeMatch) j += citeMatch[0].length;
  return j;
}

function isSentenceBoundary(text: string, index: number): boolean {
  const ch = text[index];
  if (ch !== "." && ch !== "!" && ch !== "?") return false;

  const prev = text[index - 1] ?? "";
  const next = text[index + 1] ?? "";

  if (ch === "." && /\d/.test(prev) && /\d/.test(next)) return false;
  if (ch === "." && /[A-Za-z0-9]/.test(prev) && /[A-Za-z0-9]/.test(next)) return false;

  if (isInsideUrlOrEmail(text, index)) return false;

  const prefix = text.slice(Math.max(0, index - 8), index + 1);
  if (ABBREV_BEFORE_DOT.test(prefix)) return false;

  const after = consumeBoundaryTail(text, index);
  if (after >= text.length) return true;
  return /^\s+[A-Z]/.test(text.slice(after));
}

// Split on [.!?] plus whitespace+capital or end of text. Keep Next.js, 3.12, e.g., URLs, emails.
export function splitIntoSentences(text: string): string[] {
  if (!text) return [text];
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (!isSentenceBoundary(text, i)) continue;
    let end = consumeBoundaryTail(text, i);
    while (end < text.length && /\s/.test(text[end] ?? "")) end += 1;
    parts.push(text.slice(start, end));
    start = end;
    i = end - 1;
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts.length > 0 ? parts : [text];
}

function asSentence(item: string): string {
  const trimmed = item.trim();
  if (!trimmed) return "";
  const core = trimmed.replace(/\s*\[\d+\]\s*$/, "");
  if (/[.!?]$/.test(core)) return trimmed;
  const cite = trimmed.match(/\s*(\[\d+\])\s*$/);
  if (cite) return `${core}. ${cite[1]}`.replace(/ {2,}/g, " ");
  return `${trimmed}.`;
}

function stripMarkdown(text: string): string {
  let out = text.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```[a-zA-Z0-9]*\n?/g, "").replace(/```/g, "").trim(),
  );
  out = out.replace(/`([^`]+)`/g, "$1");
  out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
  out = out.replace(/__([^_]+)__/g, "$1");
  out = out.replace(/^[ \t]*#{1,6}[ \t]+(.+)$/gm, (_m, title: string) => asSentence(title));
  out = out.replace(/^[ \t]*[-*+][ \t]+(.+)$/gm, (_m, item: string) => asSentence(item));
  out = out.replace(/^[ \t]*\d+\.[ \t]+(.+)$/gm, (_m, item: string) => asSentence(item));
  out = out.replace(/\*\*/g, "").replace(/__/g, "");
  out = out.replace(/(^|[\s(])\*(?!\s)([^*]+?)\*(?=[\s.,!?)]|$)/g, "$1$2");
  return out.replace(/\n+/g, " ").replace(/ {2,}/g, " ").trim();
}

const DOTTED_NAME_RE =
  /\b(?:deeplearning\.ai|node\.js|next\.js|vue\.js|nuxt\.js|express\.js|asp\.net|d3\.js|three\.js|socket\.io)\b/gi;

function protectDottedNames(text: string): { text: string; names: string[] } {
  const names: string[] = [];
  const out = text.replace(DOTTED_NAME_RE, (match) => {
    names.push(match);
    return `\u0000DOT${names.length - 1}\u0000`;
  });
  return { text: out, names };
}

function restoreDottedNames(text: string, names: string[]): string {
  return text.replace(/\u0000DOT(\d+)\u0000/g, (_m, idx: string) => names[Number(idx)] ?? "");
}

// Space after ]. before a capital. Only treat lowercase-word{2,}.Capital+lowercase as a missing sentence space.
export function insertMissingSentenceSpaces(text: string): string {
  const protectedNames = protectDottedNames(text);
  const spaced = protectedNames.text
    .replace(/\]\.(?=[A-Z])/g, "]. ")
    .replace(/\b([a-z]{2,})\.(?=[A-Z][a-z])/g, "$1. ");
  return restoreDottedNames(spaced, protectedNames.names);
}

export function insertSpaceBeforeCites(text: string): string {
  return text.replace(/([A-Za-z0-9.,;:!?…'"])(\[\d+\])/g, "$1 $2");
}

const PATH_OR_SOURCE_RE = /\blib\/|\bapp\/|\.tsx?\b|\bSource:/i;

export function sentenceLeaksSourceOrPath(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^\s*source(?:\s+code)?\s*:/i.test(t)) return true;
  return PATH_OR_SOURCE_RE.test(t);
}

export function stripSourceAndPathLeakage(text: string): string {
  const kept = splitIntoSentences(text).filter((part) => !sentenceLeaksSourceOrPath(part));
  return kept.join(" ").replace(/ {2,}/g, " ").trim();
}

export function moveTrailingCitesBeforeStop(text: string): string {
  return text.replace(
    /(…|\.\.\.|[.!?])\s*((?:\[\d+\]\s*)+)(?:\.)?(?=\s|$)/g,
    (match, punct: string, cites: string, offset: number, full: string) => {
      if (punct === ".") {
        const prefix = full.slice(Math.max(0, offset - 8), offset + 1);
        if (ABBREV_BEFORE_DOT.test(prefix)) return match;
      }
      const nums = [...cites.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
      const unique = [...new Set(nums)].sort((a, b) => a - b);
      const end = punct === "..." ? "…" : punct;
      return ` ${unique.map((n) => `[${n}]`).join("")}${end}`;
    },
  );
}

// Straighten quotes, map hyphen-like dashes, fold full-width [n], drop repeated cites.
export function normaliseModelText(text: string): string {
  const straightened = replaceLongDashes(
    text.replace(CURLY_SINGLE, "'").replace(CURLY_DOUBLE, '"').replace(HYPHEN_LIKE, "-"),
  );
  const cited = straightened.replace(FULLWIDTH_CITE, "[$1]");
  const plain = insertMissingSentenceSpaces(stripMarkdown(cited));
  const collapsed = collapseCitationClusters(plain);
  return stripSourceAndPathLeakage(insertSpaceBeforeCites(moveTrailingCitesBeforeStop(collapsed)));
}
