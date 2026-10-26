// One pass over every model answer before refusal, citations, or status copy.

const CURLY_SINGLE = /[\u2018\u2019]/g;
const CURLY_DOUBLE = /[\u201C\u201D]/g;
const HYPHEN_LIKE = /[\u2010\u2011\u2012]/g;
const LONG_DASH = /(\s*)[\u2013\u2014\u2015](\s*)/g;
const FULLWIDTH_CITE = /[【［]\s*(\d+)\s*[】］]/g;
const CITE_CLUSTER = /(?:\[\d+\]){2,}/g;

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

// Straighten quotes, map hyphen-like dashes, fold full-width [n], drop repeated cites.
export function normaliseModelText(text: string): string {
  const straightened = replaceLongDashes(
    text.replace(CURLY_SINGLE, "'").replace(CURLY_DOUBLE, '"').replace(HYPHEN_LIKE, "-"),
  );
  const cited = straightened.replace(FULLWIDTH_CITE, "[$1]");
  const collapsed = collapseCitationClusters(cited);
  return collapsed.replace(/([.!?])\s*\[(\d+)\]\s*\./g, " [$2].");
}
