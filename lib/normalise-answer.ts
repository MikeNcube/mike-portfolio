// One pass over every model answer before refusal, citations, or status copy.

const CURLY_SINGLE = /[\u2018\u2019]/g;
const CURLY_DOUBLE = /[\u201C\u201D]/g;
const UNICODE_DASH = /[\u2010-\u2015]/g;
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

// Straighten quotes/dashes, fold full-width [n], and drop repeated adjacent citations.
export function normaliseModelText(text: string): string {
  const straightened = text
    .replace(CURLY_SINGLE, "'")
    .replace(CURLY_DOUBLE, '"')
    .replace(UNICODE_DASH, "-");
  const cited = straightened.replace(FULLWIDTH_CITE, "[$1]");
  return collapseDuplicateCitations(cited);
}
