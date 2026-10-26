// A refusal is a decline to answer. An email address next to real content
// is not a refusal — bios and availability answers include the contact.

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
] as const;

export function isRefusal(text: string): boolean {
  const t = text.toLowerCase();
  return DECLINE_PHRASES.some((p) => t.includes(p));
}
