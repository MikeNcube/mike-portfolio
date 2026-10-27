import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, citedFallbackFromChunks, EMAIL_FALLBACK } from "../lib/answer";
import { matchRecruiterIntent } from "../lib/intent";
import { isRefusal } from "../lib/refusal";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";
import { KNOWLEDGE_CHUNKS } from "../lib/knowledge";
import type { RetrievedChunk } from "../lib/rag";

const kbChunks: RetrievedChunk[] = KNOWLEDGE_CHUNKS
  .filter((c) => c.sourceUrl.startsWith("http"))
  .map((c) => ({ ...c, score: 0.9 }));

const modes = ["none", "gemini-refuse", "groq-refuse"] as const;
type SweepMode = (typeof modes)[number];

async function ask(question: string, mode: SweepMode) {
  return answerQuestion({
    question,
    retrieveFn: async () => kbChunks,
    ...(mode === "gemini-refuse"
      ? {
          generateGemini: async () => "I don't have information about that.",
          generateGroq: async () => EMAIL_FALLBACK,
        }
      : {}),
    ...(mode === "groq-refuse"
      ? {
          generateGemini: async () => {
            throw new Error("429");
          },
          generateGroq: async () => "I don't have information about that.",
        }
      : {}),
  });
}

export const B19_CASES: Array<{
  question: string;
  intent?: string;
  refuse?: boolean;
  match?: RegExp;
  notMatch?: RegExp;
}> = [
  {
    question: "Which city does Mike live in?",
    intent: "location",
    match: /Johannesburg/,
    notMatch: /Digi App Form|lead-management CRM|shift-based/i,
  },
  {
    question: "Would Mike consider a contract role?",
    intent: "contract",
    match: /full-time or contract/,
    notMatch: /routing contract/i,
  },
  { question: "Can Mike start next month?", refuse: true },
  {
    question: "Does Mike manage people?",
    intent: "team",
    match: /four-person/,
    notMatch: /over 40 people/,
  },
  {
    question: "Who is Mike's current employer?",
    intent: "employer",
    match: /Zororo-Phumulani/,
  },
  {
    question: "Give me a quick summary of who Mike is",
    intent: "who",
    match: /Applied AI Engineer/,
  },
  {
    question: "What position does Mike want?",
    intent: "roles",
    match: /Generative AI Engineer/,
  },
  {
    question: "What did Mike study?",
    intent: "education",
    match: /no formal degree/,
  },
  {
    question: "How many engineers does Mike work with?",
    intent: "team",
    match: /four-person/,
  },
  {
    question: "Which LLM frameworks has Mike used?",
    intent: "ai-tools",
    match: /LangGraph/,
  },
  {
    question: "Is Mike a strong candidate?",
    intent: "why-hire",
    match: /regulated funeral-assurance/,
    notMatch: /document-heavy/,
  },
  {
    question: "What is Mike's most impressive build?",
    intent: "strongest",
    match: /Digi App Form/,
  },
  {
    question: "How does Mike keep code reliable?",
    intent: "testing",
    match: /44 passing tests/,
  },
  {
    question: "How does Mike approach testing and quality?",
    intent: "testing",
    match: /525 backend tests/,
  },
  {
    question: "What is the chatbot built with?",
    intent: "assistant",
    match: /Gemini embedding-001/,
  },
];

function twenty(prefix: string, stems: string[]): string[] {
  const out: string[] = [];
  for (const stem of stems) {
    out.push(stem);
    if (out.length >= 20) return out.slice(0, 20);
  }
  while (out.length < 20) {
    out.push(`${prefix} ${out.length + 1}: ${stems[out.length % stems.length]}`);
  }
  return out.slice(0, 20);
}

export const PARAPHRASES: Record<string, { questions: string[]; match: RegExp }> = {
  location: {
    match: /Johannesburg/,
    questions: twenty("location", [
      "Which city does Mike live in?",
      "What city is Mike in?",
      "Where is Mike located these days?",
      "Where does he live now?",
      "What country is Mike from?",
      "Where is Mike based out of?",
      "Which city is Mike based in?",
      "Where does Mike currently live?",
      "What city does he live in?",
      "Where is he located?",
      "Mike lives where?",
      "Which country does Mike live in?",
      "Which city does Mike reside in?",
      "What city does Mike live in now?",
      "Where is Mike's home base?",
      "Is Mike based in a specific city?",
      "Where does Mike reside?",
      "Which city does he reside in?",
      "Where is Mike living?",
      "What city is Mike based in?",
    ]),
  },
  employer: {
    match: /Zororo-Phumulani/,
    questions: twenty("employer", [
      "Who is Mike's current employer?",
      "Which company does Mike work for?",
      "What firm employs Mike?",
      "Who employs Mike?",
      "Which company is Mike at?",
      "Where does Mike work these days?",
      "What company is Mike with?",
      "Who does he work for now?",
      "What is the name of Mike's employer?",
      "Which organisation does Mike work at?",
      "What company employs him?",
      "Where is Mike employed?",
      "Who is his employer?",
      "Which firm does Mike work for?",
      "What company does he work at?",
      "Who is Mike employed by?",
      "Which company currently employs Mike?",
      "What is Mike's company?",
      "Where does he work at the moment?",
      "Who is Mike employed by now?",
    ]),
  },
  title: {
    match: /Applied AI Engineer/,
    questions: twenty("title", [
      "What is Mike's current job title?",
      "What title does Mike hold?",
      "What is his current job?",
      "What is Mike's current position title?",
      "What job title does Mike have?",
      "What is Mike's present job title?",
      "What title is Mike using?",
      "What is the current title Mike holds?",
      "What is Mike's current job?",
      "What is Mike's job title today?",
      "What current job does Mike have?",
      "What title should I put for Mike?",
      "What is Mike's official job title?",
      "What current title does he have?",
      "What is Mike's role title?",
      "What job title is on Mike's CV?",
      "What is his job title currently?",
      "What current job title does Mike use?",
      "What is Mike's title at work?",
      "What title does he currently hold?",
    ]),
  },
  roles: {
    match: /Generative AI Engineer/,
    questions: twenty("roles", [
      "What roles is Mike looking for?",
      "What position does Mike want?",
      "What is Mike seeking?",
      "What target roles does Mike have?",
      "What role does he want next?",
      "What is Mike open to?",
      "What positions is Mike seeking?",
      "What job does Mike want?",
      "What is Mike looking for next?",
      "Which roles is he looking for?",
      "What does Mike want in a role?",
      "What position is Mike seeking?",
      "What roles does Mike want?",
      "What is he looking for in a role?",
      "What target role should we consider?",
      "What kind of role is Mike seeking?",
      "What role is Mike seeking next?",
      "What roles is he open to?",
      "What position does he want next?",
      "What is Mike's target role?",
    ]),
  },
  contract: {
    match: /full-time or contract/,
    questions: twenty("contract", [
      "Would Mike consider a contract role?",
      "Is Mike open to contract work?",
      "Does Mike take freelance work?",
      "Would Mike do consulting?",
      "Is contract work an option for Mike?",
      "Can Mike work on a contract?",
      "Would he consider freelance?",
      "Is Mike available on contract?",
      "Does Mike accept contract roles?",
      "Would Mike take a consulting gig?",
      "Is Mike open to part-time contract work?",
      "Can we hire Mike on contract?",
      "Would Mike consider freelance engineering?",
      "Is Mike doing contract work?",
      "Does he take contract engagements?",
      "Would Mike consult for us?",
      "Is freelance on the table for Mike?",
      "Can Mike join on a contract?",
      "Would Mike accept a contract?",
      "Is Mike open to consulting work?",
    ]),
  },
  education: {
    match: /no formal degree/,
    questions: twenty("education", [
      "What did Mike study?",
      "What is Mike's education?",
      "Does Mike have a degree?",
      "What did he study at university?",
      "What qualifications does Mike have?",
      "Where did Mike go to university?",
      "What is his education background?",
      "Did Mike study computer science?",
      "What did Mike study in school?",
      "Has Mike got a formal degree?",
      "What university did Mike attend?",
      "What is Mike's qualification?",
      "What did Mike study formally?",
      "Does he hold a degree?",
      "What education does Mike list?",
      "What has Mike studied?",
      "Is there a degree on Mike's CV?",
      "What college did Mike go to?",
      "What is Mike's study background?",
      "What did Mike study for?",
    ]),
  },
  team: {
    match: /four-person/,
    questions: twenty("team", [
      "Does Mike manage people?",
      "How many engineers does Mike work with?",
      "What is Mike's team size?",
      "Did Mike lead a team?",
      "How big is the team Mike works with?",
      "Does Mike have colleagues?",
      "How many people does Mike work with?",
      "Does Mike have reports?",
      "Who does Mike work with on the team?",
      "Does Mike manage a team?",
      "How many engineers are on Mike's team?",
      "Does Mike manage people at work?",
      "Does Mike lead engineers?",
      "What team does Mike sit in?",
      "How large is Mike's team?",
      "Does Mike have direct reports?",
      "Who are Mike's colleagues?",
      "Does Mike manage anyone?",
      "How many engineers are teammates of Mike?",
      "What leadership does Mike have on the team?",
    ]),
  },
  skills: {
    match: /Python/,
    questions: twenty("skills", [
      "What are Mike's main skills?",
      "What is Mike's tech stack?",
      "What stack does Mike use?",
      "What skills should I know about?",
      "What are Mike's core skills?",
      "What tech does Mike's stack include?",
      "What skills does Mike bring?",
      "What is on Mike's stack?",
      "What main skills does he have?",
      "What stack is Mike using?",
      "What skills are on Mike's CV?",
      "What is Mike's listed stack?",
      "What skills does Mike list?",
      "What does Mike's tech stack look like?",
      "What are his primary skills?",
      "What stack has Mike used?",
      "What skills does Mike advertise?",
      "What is the stack Mike works in?",
      "What main skills should a recruiter know?",
      "What skills is Mike known for?",
    ]),
  },
  languages: {
    match: /TypeScript|Python/,
    questions: twenty("languages", [
      "What programming languages does Mike use?",
      "What languages does Mike write in?",
      "Which languages is Mike fluent in for code?",
      "What languages does he program in?",
      "What programming language does Mike prefer?",
      "Which languages has Mike used?",
      "What languages are on Mike's stack?",
      "What code languages does Mike know?",
      "What languages does Mike ship in?",
      "Which programming languages are listed?",
      "What languages can Mike write?",
      "What language does Mike use on the backend?",
      "What languages does Mike code with?",
      "Which languages should we expect from Mike?",
      "What programming languages are in the KB?",
      "What languages has Mike shipped?",
      "What languages does Mike actually use?",
      "What languages does his stack list?",
      "What coding languages does Mike have?",
      "What languages does Mike develop in?",
    ]),
  },
  "ai-tools": {
    match: /LangGraph|Claude|Gemini/,
    questions: twenty("ai-tools", [
      "Which LLM frameworks has Mike used?",
      "What AI tools does Mike use?",
      "What LLM tools has Mike worked with?",
      "Which AI tools are on Mike's stack?",
      "What frameworks does Mike use for LLMs?",
      "What AI tool stack does Mike have?",
      "Which LLM framework has Mike shipped?",
      "What AI tools should we ask Mike about?",
      "What LLM frameworks are listed?",
      "Which AI tools has Mike actually used?",
      "What AI tools does Mike use day to day?",
      "What LLM stack does Mike know?",
      "Which frameworks has Mike used with LLMs?",
      "What AI tooling does Mike list?",
      "What LLM tools are in the stack?",
      "Which AI frameworks has Mike used?",
      "What AI tools does he reach for?",
      "What LLM frameworks does Mike know?",
      "Which AI tools are mentioned for Mike?",
      "What AI tools has Mike integrated?",
    ]),
  },
  who: {
    match: /Applied AI Engineer/,
    questions: twenty("who", [
      "Give me a quick summary of who Mike is",
      "Who is Mike?",
      "Who is Mike Ncube?",
      "Give me a bio of Mike",
      "Introduce Mike",
      "Can you introduce Mike Ncube?",
      "What is a short summary of who Mike is?",
      "Tell me who is Mike",
      "Give me an introduction to Mike",
      "Who is this Mike person?",
      "Give a summary of who Mike is",
      "What is Mike's bio?",
      "Give me a brief about Mike",
      "Who is Mike in short?",
      "Provide a summary of who Mike is",
      "What should I know about who Mike is?",
      "Give me an introduction of Mike",
      "Who is he in one paragraph?",
      "Write a short bio of Mike",
      "What is the summary of Mike?",
    ]),
  },
  "why-hire": {
    match: /regulated funeral-assurance|Digi App Form/,
    questions: twenty("why-hire", [
      "Is Mike a strong candidate?",
      "Why should we hire Mike?",
      "What makes Mike different?",
      "Is Mike a good fit?",
      "Why hire Mike?",
      "What makes him a strong candidate?",
      "Should we hire Mike?",
      "Why would I hire Mike?",
      "Is Mike a good fit for this team?",
      "What makes Mike worth hiring?",
      "Why is Mike a strong hire?",
      "Give me the why-hire pitch for Mike",
      "What makes Mike stand out?",
      "Why would we hire Mike then?",
      "Is Mike a strong fit?",
      "What is the case for hiring Mike?",
      "Why Mike over another engineer?",
      "What makes Mike a good hire?",
      "Should we hire Mike in?",
      "Why is Mike different from other candidates?",
    ]),
  },
  strongest: {
    match: /Digi App Form/,
    questions: twenty("strongest", [
      "What is Mike's most impressive build?",
      "What is Mike's strongest project?",
      "What is his best project?",
      "What is the most impressive project Mike has?",
      "What is Mike's best build?",
      "Which project is Mike's strongest?",
      "What is the most impressive thing Mike built?",
      "What is Mike's most impressive standout project?",
      "What is the most impressive project we should review first?",
      "What is his most impressive work?",
      "What is Mike's most impressive flagship project?",
      "What is the best build on Mike's CV?",
      "What is Mike's most impressive system?",
      "Which build is Mike's most impressive one?",
      "What is the strongest project to review?",
      "What is Mike's strongest top project?",
      "What is the most impressive shipped project?",
      "What is Mike's most impressive headline project?",
      "What is his most impressive build?",
      "What is the most impressive project that represents Mike?",
    ]),
  },
  assistant: {
    match: /Gemini embedding-001|Next\.js/,
    questions: twenty("assistant", [
      "What is the chatbot built with?",
      "How does this assistant work?",
      "How does the assistant work?",
      "What is this chatbot built with?",
      "How does the fact assistant work?",
      "What is this assistant built with?",
      "How does the chatbot work?",
      "What powers this assistant?",
      "How is the chatbot built?",
      "What is the assistant built from?",
      "How does this chatbot answer?",
      "What is this assistant made with?",
      "How does the on-site assistant work?",
      "What stack is this chatbot on?",
      "How is this assistant implemented?",
      "What is the chatbot using?",
      "How does the portfolio chatbot work?",
      "What built this assistant?",
      "How does this chat assistant work?",
      "What is the assistant running on?",
    ]),
  },
  testing: {
    match: /44 passing tests|525 backend tests|89 tests/,
    questions: twenty("testing", [
      "How does Mike keep code reliable?",
      "How does Mike approach testing and quality?",
      "What testing has Mike done?",
      "What is Mike's test coverage like?",
      "How does Mike test his work?",
      "What quality of tests does Mike have?",
      "How reliable is Mike's test suite?",
      "What testing does Mike actually do?",
      "How does Mike handle quality?",
      "What tests has Mike published?",
      "How does Mike keep systems reliable?",
      "What is Mike's approach to quality?",
      "How does Mike ensure reliability?",
      "What testing evidence does Mike have?",
      "How thorough is Mike's testing?",
      "What does Mike do for test quality?",
      "How does Mike keep code quality high?",
      "What reliability practices does Mike use?",
      "How does Mike test his systems?",
      "What quality bar do Mike's tests show?",
    ]),
  },
  years: {
    match: /six-plus years/,
    questions: twenty("years", [
      "How many years of experience does Mike have?",
      "How long has Mike been an engineer?",
      "How many years has Mike been doing this?",
      "How long has he been in software?",
      "What is Mike's years of experience?",
      "How many years has Mike shipped software?",
      "How long has Mike been working as an engineer?",
      "How many years of software experience?",
      "How long has Mike been building systems?",
      "How many years has Mike got?",
      "How long has Mike been in the industry?",
      "How many years of experience are we talking?",
      "How long has Mike been writing software?",
      "How many years has Mike focused on this?",
      "How long has Mike been an Applied AI Engineer?",
      "How many years of engineering does Mike have?",
      "How long has Mike been doing generative AI?",
      "How many years has Mike been at this craft?",
      "How long has Mike been a software engineer?",
      "How many years should I put for Mike?",
    ]),
  },
  remote: {
    match: /remote-first/,
    questions: twenty("remote", [
      "Does Mike work remotely?",
      "Is Mike remote-first?",
      "Does Mike work remote?",
      "Can Mike work from home?",
      "Is Mike a remote engineer?",
      "Does he work remotely now?",
      "Is remote-first how Mike works?",
      "Does Mike do remote work?",
      "Is Mike working remotely?",
      "Can Mike be fully remote?",
      "Does Mike prefer remote?",
      "Is Mike remote today?",
      "Does Mike work from home usually?",
      "Is Mike set up for remote work?",
      "Does Mike take remote roles?",
      "Is Mike already remote?",
      "Does Mike work remotely from South Africa?",
      "Is remote work how Mike operates?",
      "Does Mike only work remotely?",
      "Does Mike stay remote?",
    ]),
  },
  linkedin: {
    match: /linkedin\.com\/in\/mike-ncube-669563a7/,
    questions: twenty("linkedin", [
      "What is Mike's LinkedIn?",
      "Can I have Mike's LinkedIn?",
      "Where is Mike's LinkedIn profile?",
      "What is the LinkedIn URL?",
      "Share Mike's LinkedIn",
      "Does Mike have a LinkedIn?",
      "What LinkedIn should I open?",
      "Give me the LinkedIn link",
      "Where can I find Mike on LinkedIn?",
      "What is his LinkedIn handle?",
      "Link me Mike's LinkedIn",
      "What is the LinkedIn for Mike Ncube?",
      "Do you have Mike's LinkedIn URL?",
      "Which LinkedIn is Mike's?",
      "Show the LinkedIn profile",
      "What LinkedIn profile does Mike use?",
      "Where is Mike listed on LinkedIn?",
      "Can you paste Mike's LinkedIn?",
      "What is Mike Ncube's LinkedIn?",
      "Need Mike's LinkedIn please",
    ]),
  },
};

const misleadingChunks: RetrievedChunk[] = [
  {
    id: "zororo-claims",
    title: "Claims operations platform",
    sourceUrl: "https://github.com/MikeNcube",
    text: "It takes over if the current claims system fails. Shift-based routing is used in claims. Digi App Form is mentioned here.",
    score: 0.95,
  },
  {
    id: "zororo-crm",
    title: "Lead-management CRM",
    sourceUrl: "https://github.com/MikeNcube",
    text: "The CRM is used by over 40 people. Manager routing contract. Start of the month.",
    score: 0.94,
  },
];

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("round 49 sweep-new paraphrases", () => {
  it("matches B19 phrasings to concept intents or honest refusal", () => {
    for (const item of B19_CASES) {
      if (item.refuse) {
        assert.equal(matchRecruiterIntent(item.question), null, item.question);
        continue;
      }
      const hit = matchRecruiterIntent(item.question);
      assert.ok(hit, item.question);
      assert.equal(hit.id, item.intent, item.question);
    }
  });

  for (const mode of modes) {
    it(`answers B19 cases with ${mode}`, async () => {
      for (const item of B19_CASES) {
        const result = await ask(item.question, mode);
        const label = `${mode} ${item.question}`;
        if (item.refuse) {
          assert.equal(result.response, EMAIL_FALLBACK, label);
          continue;
        }
        assert.equal(isRefusal(result.response), false, `${label} => ${result.response}`);
        if (item.match) assert.match(result.response, item.match, label);
        if (item.notMatch) assert.doesNotMatch(result.response, item.notMatch, label);
      }
    });
  }

  for (const mode of modes) {
    it(`answers 20 paraphrases per intent with ${mode}`, async () => {
      for (const [id, spec] of Object.entries(PARAPHRASES)) {
        assert.equal(spec.questions.length, 20, id);
        for (const question of spec.questions) {
          const intent = matchRecruiterIntent(question);
          assert.ok(intent, `${id} ${question}`);
          assert.equal(intent.id, id, `${id} ${question}`);
          const result = await ask(question, mode);
          assert.equal(isRefusal(result.response), false, `${mode} ${question} => ${result.response}`);
          assert.match(result.response, spec.match, `${mode} ${question} => ${result.response}`);
        }
      }
    });
  }

  it("refuses ordinary city/contract/start/manage/people chunk matches", () => {
    for (const question of [
      "Which city does Mike live in?",
      "Would Mike consider a contract role?",
      "Can Mike start next month?",
      "Does Mike manage people?",
    ]) {
      assert.equal(citedFallbackFromChunks(question, misleadingChunks), null, question);
    }
  });
});
