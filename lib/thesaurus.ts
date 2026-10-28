// Synonym groups shared by the coverage gate, the model-answer validator and
// static-answer focus matching. Each group is general vocabulary for one idea,
// written as a thesaurus entry. Entries must not be copied from evaluation or
// retest questions.

import { stem } from "./stem";

export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["cutoff", "cut-off", "threshold", "minimum", "minimum score", "gate", "gating", "below"],
  ["drop", "discard", "filter out", "throw away"],
  ["frontend", "front-end", "front end", "client-side", "client side"],
  ["backend", "back-end", "back end", "server-side", "server side"],
  ["llm", "language model", "large language model", "model"],
  ["reply", "answer", "response"],
  ["write", "generate", "produce", "compose"],
  ["outage", "down", "downtime", "unavailable", "offline", "fail", "failure", "error", "rate-limited", "rate-limit", "rate-limits", "rate-limiting", "fallible"],
  ["fallback", "fallbacks", "fall back", "falls back", "falling back", "fell back"],
  ["pii", "personal data", "personal information", "personally identifiable information", "sensitive data"],
  ["privacy", "data protection", "popia"],
  ["label", "labelled", "labeled", "tag", "tagged", "badge", "marker"],
  ["mask", "masking", "redact", "redaction"],
  ["encrypt", "encrypted", "encryption"],
  ["shape", "inform", "influence"],
  ["ci", "continuous integration"],
  ["email", "e-mail", "mail"],
  ["phone", "call", "telephone", "ring", "cellphone"],
  ["contact", "reach", "get in touch", "get hold of"],
  ["insurance", "assurance", "insurer", "insured"],
  ["approve", "approval", "approver", "sign-off"],
  ["validate", "validation", "validated"],
  ["status", "tracking", "progress"],
  ["limit", "cap", "quota", "throttle"],
  ["provider", "providers", "api", "apis"],
  ["quote", "quotes", "quotation", "quotations"],
  ["supplier", "suppliers", "vendor", "vendors"],
];

// Lowercase, hyphen and space insensitive, so "front-end", "front end" and "frontend" compare equal.
export function squash(word: string): string {
  return word.toLowerCase().replace(/[\s-]+/g, "");
}

function keyOf(word: string): string {
  const squashed = squash(word);
  return /\s|-/.test(word) ? squashed : stem(squashed);
}

const GROUP_BY_KEY: Map<string, number[]> = (() => {
  const map = new Map<string, number[]>();
  SYNONYM_GROUPS.forEach((group, index) => {
    for (const word of group) {
      const key = keyOf(word);
      const ids = map.get(key) ?? [];
      if (!ids.includes(index)) ids.push(index);
      map.set(key, ids);
    }
  });
  return map;
})();

// Every listed synonym of `word`, excluding the word itself. Unknown words have none.
export function synonymsOf(word: string): string[] {
  const ids = GROUP_BY_KEY.get(keyOf(word)) ?? [];
  const self = keyOf(word);
  const out = new Set<string>();
  for (const id of ids) {
    for (const other of SYNONYM_GROUPS[id]) {
      if (keyOf(other) !== self) out.add(other);
    }
  }
  return [...out];
}

// One key per idea: a word and its listed synonyms share it ("encrypt", "encryption").
export function synonymGroupKey(word: string): string {
  return [word, ...synonymsOf(word)].map(keyOf).sort()[0];
}

// Every word and phrase in the thesaurus, for vocabulary checks.
export function thesaurusWords(): string[] {
  return SYNONYM_GROUPS.flat();
}

// Multi-word entries, longest first, so a validator can treat each as one claim unit.
export const THESAURUS_PHRASES: readonly string[] = [...new Set(SYNONYM_GROUPS.flat().filter((w) => w.includes(" ")))]
  .sort((a, b) => b.length - a.length);
