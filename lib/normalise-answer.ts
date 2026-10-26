// One pass over every model answer before refusal, citations, or status copy.

const CURLY_SINGLE = /[\u2018\u2019]/g;
const CURLY_DOUBLE = /[\u201C\u201D]/g;
const HYPHEN_LIKE = /[\u2010\u2011\u2012]/g;
const LONG_DASH = /(\s*)[\u2013\u2014\u2015](\s*)/g;
const FULLWIDTH_CITE = /[【［]\s*(\d+)\s*[】］]/g;
const DUP_CITE = /(\[\d+\])(?:\s*\1)+/g;

function collapseDuplicateCitations(text: string): string {
  let prev = "";
  let out = text;
  while (out !== prev) {
    prev = out;
    out = out.replace(DUP_CITE, "$1");
  }
  return out;
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
  const collapsed = collapseDuplicateCitations(cited);
  return collapsed.replace(/([.!?])\s*\[(\d+)\]\s*\./g, " [$2].");
}
