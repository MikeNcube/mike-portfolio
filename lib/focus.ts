// What a question is about, and which sentence of a pre-written answer speaks to
// it. A static answer must open with a sentence about the asked thing; when none
// of its sentences is, the caller falls through to another candidate or refuses.

import {
  conceptById,
  isDistinctiveKbTerm,
  isSpecificTerm,
  isGenericWord,
  questionTokens,
  type ProfileConcept,
  type QuestionAnalysis,
} from "./concepts";
import { passageHasTerm } from "./grounding";
import { namedProjects, withoutProjectNames } from "./intent";
import { splitIntoSentences } from "./normalise-answer";
import { synonymsOf } from "./thesaurus";

export function mentionsTerm(text: string, term: string): boolean {
  return passageHasTerm(text, term) || synonymsOf(term).some((syn) => passageHasTerm(text, syn));
}

// The things a question names: technologies, and knowledge-base terms the visitor
// wrote as names (capitalised mid-sentence or acronyms, like "PII" or "SOC") that
// identify a few sources. Lowercase words ("map", "data") are too often verbs or
// general nouns to hold an answer to. Project names are tracked separately.
export function focusEntities(question: string, analysis: QuestionAnalysis): string[] {
  const kbTerms = new Set(analysis.kbTerms);
  // Words inside a project's name ("Proactive" in "Proactive Sentinel") name the project, not an entity.
  const outsideNames = new Set(questionTokens(withoutProjectNames(question)).map((t) => t.raw));
  const named = questionTokens(question)
    .filter((token, i) => (i > 0 && /[A-Z]/.test(token.raw)) || /^[A-Z0-9]{2,}$/.test(token.raw))
    .map((token) => token.raw)
    .filter((raw) =>
      kbTerms.has(raw)
      && outsideNames.has(raw)
      && raw.length >= 3
      && namedProjects(raw).length === 0
      && isDistinctiveKbTerm(raw),
    );
  // A technology inside a project's name ("RAG" in "Mike's RAG assistant") names the project too.
  const outsideLower = new Set([...outsideNames].map((raw) => raw.toLowerCase()));
  const tech = analysis.knownTech.filter((t) => t.includes(" ") || outsideLower.has(t.toLowerCase()));
  return [...new Set([...tech, ...named])];
}

function concepts(analysis: QuestionAnalysis): ProfileConcept[] {
  return analysis.concepts.map(conceptById).filter((c): c is ProfileConcept => Boolean(c));
}

export function dominantConcepts(analysis: QuestionAnalysis): ProfileConcept[] {
  return concepts(analysis).filter((c) => c.dominant);
}

// The specific aspect asked about a named project ("encryption" in "Does the CRM
// use encryption?"): the first dominant concept's term found in the question.
export function askedAspect(question: string, analysis: QuestionAnalysis): { concept: ProfileConcept; term: string } | null {
  const lower = question.toLowerCase();
  for (const concept of dominantConcepts(analysis)) {
    const term = concept.terms
      .filter((t) => !t.includes("..."))
      .sort((a, b) => b.length - a.length)
      .find((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower));
    if (term) return { concept, term };
  }
  return null;
}

// True when `sentence` speaks to what the question is about.
export function addressesFocus(sentence: string, question: string, analysis: QuestionAnalysis): boolean {
  const dominant = dominantConcepts(analysis);
  const entities = focusEntities(question, analysis);
  // A dominant aspect (failures, personal data) is the point of the question:
  // naming Gemini without saying what happens when it fails does not answer it.
  // With a named thing as well ("the label on the AWS lab repo"), the aspect said
  // about something else does not answer it either.
  if (dominant.length > 0) {
    return dominant.some((c) => c.evidence.test(sentence))
      && (entities.length === 0 || entities.some((term) => mentionsTerm(sentence, term)));
  }
  if (entities.length > 0) return entities.some((term) => mentionsTerm(sentence, term));
  const projects = namedProjects(question);
  if (projects.length > 0) {
    const named = new Set(namedProjects(sentence).map((p) => p.id));
    return projects.some((p) => named.has(p.id));
  }
  return true;
}

function stemsOf(text: string): Set<string> {
  const out = new Set<string>();
  for (const token of questionTokens(text)) {
    out.add(token.stem);
    for (const piece of token.norm.split(/[-/]/)) if (piece) out.add(questionTokens(piece)[0]?.stem ?? piece);
  }
  return out;
}

// How many distinct topic words of the question (outside project names) a
// sentence contains, by stem or listed synonym.
export function questionWordHits(sentence: string, question: string): number {
  const sentenceStems = stemsOf(sentence);
  // Words of a named project's display name ("platform" in "the claims platform") name it, not a detail.
  const nameStems = stemsOf(namedProjects(question).map((p) => p.name).join(" "));
  const seen = new Set<string>();
  let hits = 0;
  for (const token of questionTokens(withoutProjectNames(question))) {
    if (isGenericWord(token.norm) || seen.has(token.stem) || nameStems.has(token.stem)) continue;
    seen.add(token.stem);
    const forms = [token.stem, ...synonymsOf(token.norm).map((s) => questionTokens(s)[0]?.stem ?? s)];
    if (forms.some((form) => sentenceStems.has(form))) hits += 1;
  }
  return hits;
}

// The topic words a question adds to the question a canned answer was written for
// ("security" in "What security protects Mike's production systems?" against "What
// production systems has Mike shipped?"), and how many the answer covers by stem
// or listed synonym.
// Words a profile concept explains ("customer data" for personal data) are already
// served by that concept's answer, and common KB words name nothing in particular,
// so only technologies and distinctive KB terms count as added.
export function addedTopicCoverage(
  question: string,
  analysis: QuestionAnalysis,
  cannedWording: string,
  answer: string,
): { added: number; covered: number } {
  const known = stemsOf(`${cannedWording} ${namedProjects(question).map((p) => p.name).join(" ")}`);
  const unclaimed = new Set(
    [...analysis.kbTerms.filter(isSpecificTerm), ...analysis.knownTech, ...analysis.unknownTech]
      .flatMap((term) => questionTokens(term).map((t) => t.stem)),
  );
  const answerStems = stemsOf(answer);
  const answerLower = answer.toLowerCase();
  const seen = new Set<string>();
  let added = 0;
  let covered = 0;
  for (const token of questionTokens(withoutProjectNames(question))) {
    if (!unclaimed.has(token.stem)) continue;
    if (isGenericWord(token.norm) || /^\d/.test(token.norm) || token.norm.length < 3) continue;
    if (seen.has(token.stem) || known.has(token.stem)) continue;
    seen.add(token.stem);
    added += 1;
    const forms = [token.stem, ...synonymsOf(token.norm).map((s) => questionTokens(s)[0]?.stem ?? s)];
    // Inside a compound name counts too: "graph" in "LangGraph".
    if (forms.some((form) => answerStems.has(form) || (form.length >= 4 && answerLower.includes(form)))) covered += 1;
  }
  return { added, covered };
}

// Sentences that cannot open an answer because they lean on the one before.
// "He" and "His" can: every answer is about Mike, so they become his name.
const DEPENDENT_LEAD_RE = /^(?:yes|no)\b|^(?:it|its|they|their|she|her|also|and|but|so|then)\b|^(?:this|that|these|those)\s+(?:is|are|was|were|means)\b/i;

function standAlone(sentence: string): string {
  return sentence.replace(/^His\b/, "Mike's").replace(/^He\b/, "Mike");
}

function sentenceScore(sentence: string, question: string, analysis: QuestionAnalysis): number {
  let score = 0;
  for (const term of focusEntities(question, analysis)) if (mentionsTerm(sentence, term)) score += 3;
  for (const concept of concepts(analysis)) {
    if (concept.evidence.test(sentence)) score += concept.dominant ? 2 : 1;
  }
  const seen = new Set<string>();
  for (const token of questionTokens(question)) {
    // Generic words count only when the thesaurus ties them to KB wording ("writes" ~ "generates").
    if (seen.has(token.stem) || (isGenericWord(token.norm) && synonymsOf(token.norm).length === 0)) continue;
    seen.add(token.stem);
    if (mentionsTerm(sentence, token.norm)) score += 1;
  }
  return score;
}

// Moves the sentence that best matches the question to the front, keeping the
// rest in order. Leaves the text alone when the opening sentence already does
// best, when the opener is a direct yes or no, or when the better sentence
// depends on the one before it.
export function leadWithFocus(text: string, question: string, analysis: QuestionAnalysis): string {
  const sentences = splitIntoSentences(text).map((s) => s.trim()).filter(Boolean);
  if (sentences.length < 2) return text;
  if (/^(?:yes|no)\b/i.test(sentences[0])) return text;
  const scores = sentences.map((s) => sentenceScore(s, question, analysis));
  let best = 0;
  scores.forEach((score, i) => {
    if (score > scores[best] && !DEPENDENT_LEAD_RE.test(sentences[i])) best = i;
  });
  if (best === 0) return text;
  return [standAlone(sentences[best]), ...sentences.filter((_, i) => i !== best)].join(" ");
}

// The opening sentence; a bare "Yes." or "No." is read with the sentence after it.
export function leadSentence(text: string): string {
  const sentences = splitIntoSentences(text.trim()).map((s) => s.trim()).filter(Boolean);
  if (sentences.length === 0) return text.trim();
  if (sentences.length > 1 && /^(?:yes|no)[.!]?$/i.test(sentences[0])) return `${sentences[0]} ${sentences[1]}`;
  return sentences[0];
}
