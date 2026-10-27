// Recruiter-intent canned answers from KB/CV facts only.
// Runs before retrieve, models, and generic refusal.

import { STATIC_ANSWERS, type StaticAnswer } from "./static-answers";

export type RecruiterIntent = {
  id: string;
  answer: StaticAnswer;
};

function staticByQuestion(question: string): StaticAnswer {
  const hit = STATIC_ANSWERS.find((item) => item.question === question);
  if (!hit) {
    throw new Error(`missing static answer: ${question}`);
  }
  return hit;
}

const INTENTS: Array<{ id: string; re: RegExp; question: string }> = [
  { id: "linkedin", re: /\blinkedin\b/i, question: "What is Mike's LinkedIn?" },
  {
    id: "education",
    re: /\b(?:education|formal degree|university|college|what degree|have a degree|his degree)\b/i,
    question: "What is Mike's education?",
  },
  {
    id: "years",
    re: /\b(?:years of experience|how many years|how long has (?:mike|he)|six-plus years)\b/i,
    question: "How many years of experience does Mike have?",
  },
  {
    id: "remote",
    re: /\b(?:remote(?:ly|-first)?|work from home)\b/i,
    question: "Does Mike work remotely?",
  },
  {
    id: "location",
    re: /\b(?:where is mike (?:based|located)|mike based|where does mike live|where is he (?:based|located)|where does he live|(?:live|based) in (?:johannesburg|south africa))\b/i,
    question: "Where is Mike based?",
  },
  {
    id: "title",
    re: /\b(?:job title|current title|current job|current role|mike'?s title|what is mike'?s (?:current )?job)\b/i,
    question: "What is Mike's current job title?",
  },
  {
    id: "employer",
    re: /\b(?:where does mike work|who does mike work for|mike'?s employer|which company|what company|where (?:does he|he) work)\b/i,
    question: "Where does Mike work?",
  },
  {
    id: "roles",
    re: /\b(?:looking for|target roles|roles is mike looking|what is (?:mike|he) looking)\b/i,
    question: "What roles is Mike looking for?",
  },
  {
    id: "ai-tools",
    re: /\bai tools?\b|\bllm tools?\b/i,
    question: "What AI tools does Mike use?",
  },
  {
    id: "languages",
    re: /\bprogramming languages?\b|\bwhat languages?\b/i,
    question: "What programming languages does Mike use?",
  },
  {
    id: "skills",
    re: /\b(?:main skills|tech stack|mike'?s stack|mike'?s skills|what skills)\b/i,
    question: "What are Mike's main skills?",
  },
  {
    id: "team",
    re: /\b(?:team size|how (?:big|large) is .{0,16}team|how many (?:people|engineers) .{0,24}team|four-person)\b/i,
    question: "What is Mike's team size?",
  },
  {
    id: "leadership",
    re: /\b(?:led a team|lead a team|leadership|team lead|engineering lead|tech lead)\b/i,
    question: "Did Mike lead a team?",
  },
  {
    id: "why-hire",
    re: /\b(?:why (?:should we |would we |would i )?hire|good fit|what makes (?:mike |him )?different|why mike)\b/i,
    question: "Why should we hire Mike?",
  },
  {
    id: "strongest",
    re: /\b(?:strongest project|best project|most impressive project)\b/i,
    question: "What is Mike's strongest project?",
  },
  {
    id: "assistant",
    re: /\b(?:how does (?:this |the )?(?:fact )?assistant work|how does the assistant work)\b/i,
    question: "How does this assistant work?",
  },
  {
    id: "testing",
    re: /\b(?:what testing|test coverage|how does mike test|quality of (?:his |mike'?s )?tests)\b/i,
    question: "What testing has Mike done?",
  },
];

export function matchRecruiterIntent(question: string): RecruiterIntent | null {
  for (const intent of INTENTS) {
    if (!intent.re.test(question)) continue;
    return { id: intent.id, answer: staticByQuestion(intent.question) };
  }
  return null;
}
