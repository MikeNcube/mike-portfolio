// Grammatical form of a question. A yes/no question asks whether its own words
// are true, so those words are claims under test. A wh-question asks for a value,
// and its words describe what is wanted.

const OPENER = String.raw`^\s*(?:(?:so|and|ok|okay|hey|hi|hello|also|quick question|one more)[,:!]?\s+)*`;

const POLAR_RE = new RegExp(
  `${OPENER}(?:is|isn't|are|aren't|was|wasn't|were|weren't|am|do|don't|does|doesn't|did|didn't|has|hasn't|have|haven't|had|can|can't|could|couldn't|will|won't|would|wouldn't|should|shouldn't|shall|may|might|must)\\b`,
  "i",
);

const WH_RE = new RegExp(
  `${OPENER}(?:what|what's|whats|which|who|who's|whom|whose|where|where's|when|why|how|how's|tell|explain|describe|list|show|give|walk|name|summari[sz]e|outline)\\b`,
  "i",
);

export function isPolarQuestion(question: string): boolean {
  return POLAR_RE.test(question.replace(/[‘’`]/g, "'"));
}

export function isWhQuestion(question: string): boolean {
  return WH_RE.test(question.replace(/[‘’`]/g, "'"));
}

// "Tell me, does Mike have a degree?" opens like a request but asks yes or no.
const EMBEDDED_POLAR_RE =
  /[,;:]\s*(?:is|are|was|were|do|does|did|has|have|had|can|could|will|would|should)\b/i;

// Drops a leading "Yes." or "No," when the question did not ask yes or no.
export function stripUnaskedYesNo(question: string, answer: string): string {
  if (!isWhQuestion(question) || EMBEDDED_POLAR_RE.test(question)) return answer;
  const match = answer.match(/^\s*(?:yes|no)\s*[.,:;]\s+(\S)/i);
  if (!match) return answer;
  const rest = answer.slice(match.index! + match[0].length - 1);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
