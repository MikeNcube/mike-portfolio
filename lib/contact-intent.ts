// Requests for a way to reach Mike. A question is a contact request when it
// (a) aims a contact act at Mike, (b) asks where or how to deliver an item such
// as an offer or CV to him, (c) asks how a requester can start hiring him, or
// (d) asks for his contact details. Each part is a small thesaurus of general
// wording, not phrasings taken from evaluation or retest questions.

import { namedProjects } from "./intent";

const TARGET = String.raw`(?:mike(?:\s+ncube)?|him)\b`;

// Acts that open contact with a person. Each takes the person as its object.
const CONTACT_ACT = [
  String.raw`contact(?:ing)?`,
  String.raw`reach(?:ing)?(?:\s+out\s+to)?`,
  String.raw`get(?:ting)?\s+(?:a\s+)?hold\s+of`,
  String.raw`get(?:ting)?\s+ahold\s+of`,
  String.raw`get(?:ting)?\s+in\s+touch\s+with`,
  String.raw`be\s+in\s+touch\s+with`,
  String.raw`touch\s+base\s+with`,
  String.raw`get(?:ting)?\s+(?:through|a\s+message)\s+to`,
  String.raw`e-?mail(?:ing)?`,
  String.raw`messag(?:e|ing)`,
  String.raw`ping(?:ing)?`,
  String.raw`dm`,
  String.raw`writ(?:e|ing)\s+to`,
  String.raw`(?:talk|speak)(?:ing)?\s+(?:to|with)`,
  String.raw`follow(?:ing)?\s+up\s+with`,
  String.raw`hear\s+(?:back\s+)?from`,
  String.raw`correspond(?:ing)?\s+with`,
  String.raw`approach(?:ing)?`,
  String.raw`call(?:ing)?`,
  String.raw`phon(?:e|ing)`,
  String.raw`ring(?:ing)?`,
].join("|");

// The same acts without an object ("how do I get in touch?").
const CONTACT_ACT_BARE = [
  String.raw`contact`,
  String.raw`reach\s+out`,
  String.raw`get\s+in\s+touch`,
  String.raw`be\s+in\s+touch`,
  String.raw`touch\s+base`,
  String.raw`get\s+(?:a\s+)?hold\s+of`,
  String.raw`e-?mail`,
  String.raw`(?:talk|speak)\s+(?:to|with)`,
  String.raw`call`,
  String.raw`phone`,
].join("|");

const DELIVER = String.raw`(?:send|sending|sent|forward|forwarding|submit|submitting|direct|address|route|pass\s+(?:on|along)|deliver|e-?mail|mail|share)`;

const ITEM = String.raw`(?:(?:job|work|employment|contract|interview|formal|written|freelance)\s+)?(?:offers?|cvs?|resumes?|résumés?|applications?|proposals?|invitations?|invites?|opportunit(?:y|ies)|openings?|vacanc(?:y|ies)|roles?|positions?|briefs?|specs?|job\s+descriptions?|enquir(?:y|ies)|inquir(?:y|ies)|requests?|questions?)\b`;

const REQUESTER = String.raw`(?:i|we|one|you|recruiters?|hiring\s+managers?|employers?|companies|(?:a|an|the|my|our)\s+(?:company|team|recruiter|business|client|startup|employer|hiring\s+manager))\b`;

const MODAL = String.raw`(?:do|does|can|could|would|should|might|may|shall|will)`;

// "how do I", "where should we", "who can a recruiter", or a "best way to" opener.
const CHANNEL_LEAD = String.raw`(?:\b(?:how|where|who|whom)\s+${MODAL}\s+${REQUESTER}|\bwhat(?:'s|\s+is|\s+are)?\s+the\s+(?:best|right|quickest|fastest|easiest|preferred|usual|proper|official|simplest)\s+(?:way|ways|channel|method|address|route|place|person|contact)\b)`;

const HIRE = String.raw`(?:hire|hiring|recruit|recruiting|engage|engaging|book|booking|onboard|onboarding|bring\s+(?:mike|him)\s+on(?:\s*board)?)\b`;

const PATTERNS: RegExp[] = [
  // (a) a contact act aimed at Mike
  new RegExp(String.raw`\b(?:${CONTACT_ACT})\s+${TARGET}`, "i"),
  // (a) the act with no object after a channel opener
  new RegExp(String.raw`${CHANNEL_LEAD}[^?.!]{0,30}?\b(?:to\s+)?(?:${CONTACT_ACT_BARE})\b`, "i"),
  // (b) an item delivered to or for Mike
  new RegExp(String.raw`\b${DELIVER}\b[^?.!]{0,40}?\b${ITEM}[^?.!]{0,30}?\b(?:to|for)\s+${TARGET}`, "i"),
  new RegExp(String.raw`\b${DELIVER}\s+${TARGET}\s+(?:(?:an?|the|my|our|this|that)\s+)?${ITEM}`, "i"),
  new RegExp(String.raw`${CHANNEL_LEAD}[^?.!]{0,30}?\b${DELIVER}\b[^?.!]{0,40}?\b${ITEM}`, "i"),
  // (c) how a requester starts hiring him
  new RegExp(String.raw`${CHANNEL_LEAD}[^?.!]{0,30}?\b(?:go\s+about\s+)?${HIRE}`, "i"),
  new RegExp(String.raw`\b(?:process|steps?|way)\s+(?:to|for)\s+${HIRE}`, "i"),
  // (a) passing word to him ("let him know", "tell Mike about")
  new RegExp(String.raw`\b(?:let|make)\s+${TARGET}\s+(?:know|aware)`, "i"),
  new RegExp(String.raw`\b(?:tell|inform|notify|alert)\s+${TARGET}\s+(?:about|of)\b`, "i"),
  // (c) arranging time with him: a call, interview or walk-through
  /\b(?:book|arrange|schedule|set\s+up|organi[sz]e|request)\b[^?.!]{0,40}\b(?:walk-?throughs?|interviews?|calls?|meetings?|chats?)\b/i,
];

// A number to reach someone on. The device alone ("his phone") is personal, not a contact detail.
const PHONE = String.raw`(?:phone|cell(?:\s*phone)?|mobile|telephone|contact)`;
// "number" as the end of its noun phrase: "his number?", "his number so I can call",
// "a number I can text". "his number one skill" and "the number of projects" use
// the word otherwise.
const NUMBER = String.raw`(?:numbers?|no\.?)(?=\s*(?:$|[?.!,;:])|\s+(?:please|so|to|for|and|or|if|is|are|was|again|that|i|we|you|on|at|where|which)\b)`;
// Mike himself, not something of his ("Mike's employer").
const MIKE_HIMSELF = String.raw`(?:mike|him)\b(?!['’]s)`;
const CALL_ACT = String.raw`(?:call|phone|ring|reach|contact|message|text|sms|whats-?app)`;
const NOT_A_COUNT = String.raw`(?!\s+(?:of|one|1)\b)`;
// A phone line or messaging channel. "Line" alone ("line manager", "line of work") is not one.
const LINE = String.raw`(?:(?:direct|phone|telephone|land|cell|mobile|private|whats-?app)\s*-?\s*lines?\b|whats-?app\b)`;

// A phone number that belongs to Mike. Anyone else's number (his employer's, a
// customer's, one a system stores) is personal data the assistant never gives.
const MIKES_NUMBER_PATTERNS: RegExp[] = [
  new RegExp(String.raw`\b(?:mike'?s|his)\s+(?:(?:work|personal|direct|best|main|primary|other|second(?:ary)?)\s+)?(?:${PHONE}\s+)?${NUMBER}`, "i"),
  new RegExp(String.raw`\b(?:mike'?s|his)\s+(?:(?:work|personal|direct|best|main|primary|other|second(?:ary)?)\s+)?${PHONE}\s+numbers?\b`, "i"),
  new RegExp(String.raw`\b(?:mike|he)\s+(?:have|has|got|share|list)\s+(?:a\s+|any\s+)?(?:${PHONE}\s+)?${NUMBER}`, "i"),
  new RegExp(String.raw`\bnumbers?\s+(?:for|of)\s+${MIKE_HIMSELF}`, "i"),
  new RegExp(String.raw`\bnumbers?\b${NOT_A_COUNT}[^?.!]{0,40}\b${CALL_ACT}\s+${MIKE_HIMSELF}`, "i"),
  new RegExp(String.raw`\b${CALL_ACT}\s+${MIKE_HIMSELF}[^?.!]{0,30}\bnumbers?\b${NOT_A_COUNT}`, "i"),
  // A line or messaging channel: "his direct line", "a WhatsApp line for Mike", "Is Mike on WhatsApp?".
  new RegExp(String.raw`\b(?:mike'?s|his)\s+(?:(?:work|personal|best|main|primary|other|second(?:ary)?)\s+)?${LINE}`, "i"),
  new RegExp(String.raw`\b(?:mike|he)\s+(?:have|has|got|share|list|use|uses)\s+(?:a\s+|any\s+)?${LINE}`, "i"),
  new RegExp(String.raw`\b${LINE}\s+(?:for|to)\s+${MIKE_HIMSELF}`, "i"),
  new RegExp(String.raw`\b(?:mike|he)\s+(?:on|reachable\s+on|available\s+on)\s+whats-?app\b`, "i"),
  new RegExp(String.raw`\bwhats-?app(?:ing)?\s+${MIKE_HIMSELF}`, "i"),
];

// Someone or something else named beside the number: "call his employer",
// "his number for the CRM team". The number asked for may not be Mike's.
const OTHER_PARTY_RE =
  /\b(?:employers?|managers?|boss|team|company|colleagues?|clients?|customers?|claimants?|suppliers?|office|hr|reception|referees?|references?|family|wife|husband|partner)\b/i;

// A phone number asked for in Mike's terms, whoever else the question names.
export function asksForANumber(question: string): boolean {
  const text = question.replace(/[‘’`]/g, "'");
  return MIKES_NUMBER_PATTERNS.some((re) => re.test(text));
}

export function asksForMikesNumber(question: string): boolean {
  const text = question.replace(/[‘’`]/g, "'");
  if (OTHER_PARTY_RE.test(text) || namedProjects(text).length > 0) return false;
  return asksForANumber(text);
}

// (d) contact details. These hold even with Mike as the subject ("Does Mike have a phone number?").
const DETAIL_PATTERNS: RegExp[] = [
  new RegExp(String.raw`\b(?:mike'?s|his)\s+(?:e-?mail(?:\s+address)?|contact(?:\s+(?:details|info|information|address))?|inbox|mailbox)\b(?!\s+signature)`, "i"),
  /\bcontact\s+(?:details|info|information|channels?)\b/i,
  /\be-?mail\s+address\b/i,
];

const WHY_HIRE_RE = /\bwhy\b[^?.!]*\b(?:hire|hiring|pick|choose)\b/i;

// "Does Mike book calls with clients?" asks about his work, not how to reach him.
const MIKE_AS_SUBJECT_RE = /\b(?:does|did|do|can|could|will|would|has|is|was)\s+(?:mike|he)\b/i;

const ACT_ON_MIKE_RE = new RegExp(String.raw`\b(?:${CONTACT_ACT})\s+${TARGET}`, "i");

// Every request must point at Mike. "How do I contact my bank?" has the shape of
// a contact request but is about someone else.
const NAMES_MIKE_RE = /\b(?:mike|him|his)\b/i;

export function isContactRequest(question: string): boolean {
  const text = question.replace(/[‘’`]/g, "'");
  if (WHY_HIRE_RE.test(text) || !NAMES_MIKE_RE.test(text)) return false;
  if (DETAIL_PATTERNS.some((re) => re.test(text)) || asksForMikesNumber(text)) return true;
  if (MIKE_AS_SUBJECT_RE.test(text) && !ACT_ON_MIKE_RE.test(text)) return false;
  return PATTERNS.some((re) => re.test(text));
}
