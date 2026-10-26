// A refusal is a decline to answer. An email address next to real content
// is not a refusal — bios and availability answers include the contact.

import { normaliseModelText } from "./normalise-answer";

const DECLINE_PHRASES = [
  "i don't have",
  "i do not have",
  "don't have information",
  "do not have information",
  "not have that information",
  "not have information about",
  "not in my knowledge",
  "not in the knowledge",
  "isn't in my knowledge",
  "is not in my knowledge",
  "outside my knowledge",
  "outside of my knowledge",
  "outside the knowledge",
  "out of scope",
  "cannot answer that",
  "can't answer that",
  "can't comply",
  "cannot comply",
  "can't provide",
  "cannot provide",
  "won't comply",
  "will not comply",
  "unable to comply",
  "cannot help with that",
  "can't help with that",
  "cannot help with this",
  "can't help with this",
  "i cannot help with",
  "i can't help with",
  "i'm sorry, but i can't",
  "i'm sorry but i can't",
  "i am sorry, but i can't",
  "i am sorry but i can't",
  "sorry, but i can't",
  "i'm not able to",
  "i am not able to",
  "i must decline",
  "i have to decline",
  "i cannot do that",
  "i can't do that",
  "i can only answer questions about",
] as const;

// Word-boundary phrases only. Bare "act as", "you are now", and "roleplay"
// are not jailbreaks — they match innocent recruiter copy ("contract as well").
const JAILBREAK_RES: RegExp[] = [
  /\bignore (all |any |the |your |these )?(previous |prior )?(instructions|rules|prompt)\b/i,
  /\bpretend (you are|you're|to be) (a |an )?(different|another|new|unrestricted)\b/i,
  /\bact as (a |an )?(different|unrestricted|new|jailbroken) (ai|assistant|model|bot)\b/i,
  /\bno (restrictions|rules|filters|guardrails)\b/i,
  /\b(developer|god|jailbreak) mode\b/i,
  /\bdisregard (your |the |all )?(system )?(prompt|instructions|rules)\b/i,
  /\b(reveal|show|print) (your |the )?(system )?prompt\b/i,
  /\bfrom now on,? you are\b/i,
  /\bwithout (any )?(rules|restrictions|filters)\b/i,
];

// Uppercase DAN only so "Has Mike worked with Dan?" is not flagged.
const DAN_RE = /\bDAN\b/;

export function isRefusal(text: string): boolean {
  const t = normaliseModelText(text).toLowerCase();
  return DECLINE_PHRASES.some((p) => t.includes(p));
}

const INJECTION_DEFENCE_QUESTION_RE =
  /\b(?:defend(?:s|ing|ed)?|defen[cs]e|protect(?:s|ing|ed)?|prevent(?:s|ing|ed)?|handle(?:s|d)?|handling|harden(?:s|ing|ed)?|jailbreak-proof)\b/i;

const INJECTION_THREAT_RE = /\bprompt injection\b|\bjailbreak/i;

// True when the visitor asked how Mike defends RAG against jailbreaks / prompt injection.
export function isInjectionDefenceQuestion(question: string): boolean {
  const t = normaliseModelText(question);
  return INJECTION_DEFENCE_QUESTION_RE.test(t) && INJECTION_THREAT_RE.test(t);
}

// True when the visitor is trying to jailbreak or role-play the assistant.
export function isJailbreakPrompt(question: string): boolean {
  if (isInjectionDefenceQuestion(question)) return false;
  const normalised = normaliseModelText(question);
  if (DAN_RE.test(normalised)) return true;
  const t = normalised.toLowerCase();
  return JAILBREAK_RES.some((re) => re.test(t));
}
