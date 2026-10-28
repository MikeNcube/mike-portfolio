// Mechanism tests from the second strict live retest of fix/assistant-grounding.
// Each family uses its own paraphrases of a failure class, never the retest's
// wording, so a fix has to hold for the mechanism and not for one phrasing.
// Most cases run the static path with no model, as most live answers did.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../lib/answer";
import { isContactRequest } from "../lib/contact-intent";
import { findUnsupportedClaims } from "../lib/grounding";
import { stripUnaskedYesNo } from "../lib/question-form";
import { KNOWLEDGE_CHUNKS } from "../lib/knowledge";
import { resetProviderCircuits } from "../lib/providers";
import { resetQuotaForTests } from "../lib/quota";
import { isRefusal } from "../lib/refusal";
import type { RetrievedChunk } from "../lib/rag";
import { STATIC_ANSWERS } from "../lib/static-answers";

const EMAIL = /mikencube03@gmail\.com/;

function lead(text: string): string {
  return text.split(/(?<=[.!?](?:\s*\[\d+\])*)\s+(?=[A-Z])/)[0] ?? text;
}

function kb(id: string, score = 0.9): RetrievedChunk {
  const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === id);
  assert.ok(chunk, `missing chunk ${id}`);
  return { ...chunk, score };
}

function canned(question: string, score = 0.95): RetrievedChunk {
  const answer = STATIC_ANSWERS.find((s) => s.question === question);
  assert.ok(answer, `missing static answer ${question}`);
  return { id: `static:${question}`, title: answer.question, sourceUrl: "static", text: answer.answer, score, cannedAnswer: answer };
}

function cited(...ids: string[]) {
  return ids.map((id) => {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === id);
    assert.ok(chunk, `missing chunk ${id}`);
    return { id, text: `${chunk.title}\n${chunk.text}` };
  });
}

function unsupported(text: string, ids: string[], question?: string): string[] {
  return findUnsupportedClaims(text, cited(...ids), { question }).flatMap((p) => p.words);
}

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("contact intent is recognised by structure, before retrieval", () => {
  const requests = [
    "How would a recruiter get in touch with Mike?",
    "What is the quickest way to reach him?",
    "Who should I talk to about bringing Mike on board?",
    "Where can we forward an interview invitation for Mike?",
    "How do we go about hiring Mike?",
    "Where should I submit a contract proposal for Mike?",
    "Can I message Mike directly?",
    "Where can I leave a message for Mike?",
    "What is Mike's e-mail address?",
    "Which channel is best for sending Mike an employment offer?",
  ];

  for (const question of requests) {
    it(`answers with the email: ${question}`, async () => {
      // Retrieval and the model both point at the wrong topic; neither may win.
      const result = await answerQuestion({
        question,
        retrieveFn: async () => [canned("What is Mike's strongest project?"), canned("What is Mike's current job title?")],
        generateGemini: async () => "Mike's title is Applied AI Engineer and Systems Architect [2].",
      });
      assert.match(result.response, EMAIL, `${question} -> ${result.response}`);
      assert.doesNotMatch(result.response, /strongest|Applied AI Engineer and Systems Architect/, result.response);
    });
  }

  it("does not treat other senses of contact words as a request for Mike's details", () => {
    for (const question of [
      "Why should we hire Mike?",
      "Is Mike available for hire?",
      "How does Mike reach production quality?",
      "Does ZDI email the requester a link?",
      "What title is on Mike's email signature?",
    ]) {
      assert.equal(isContactRequest(question), false, question);
    }
  });

  it("keeps the LinkedIn link when the visitor names LinkedIn as the channel", async () => {
    const result = await answerQuestion({ question: "Can I reach Mike on LinkedIn?" });
    assert.match(result.response, /linkedin\.com/);
  });
});

describe("personal data and privacy route to the real PII sentences", () => {
  for (const question of [
    "What does Mike do to safeguard customer data?",
    "How are personally identifiable details protected in Mike's work?",
    "Is sensitive information masked in his projects?",
    "How does Mike approach data privacy in his builds?",
    "How is the personal information of insured members kept safe?",
  ]) {
    it(`leads with a PII control: ${question}`, async () => {
      for (const retrieveFn of [
        undefined,
        async () => [canned("What has Mike built at Zororo-Phumulani?"), canned("Walk me through Proactive Sentinel's architecture."), kb("digi-app-form", 0.5)],
      ]) {
        const result = await answerQuestion({ question, retrieveFn });
        assert.equal(isRefusal(result.response), false, `${question} -> ${result.response}`);
        assert.match(lead(result.response), /\bPII\b/, `${question} -> ${result.response}`);
        assert.doesNotMatch(lead(result.response), /MITRE|shipped Digi App Form/, result.response);
      }
    });
  }

  it("answers from a project's own PII sentence, or says plainly that it has none", async () => {
    const claims = await answerQuestion({ question: "How does the claims platform protect PII?" });
    assert.match(lead(claims.response), /PII encrypted at the app layer/, claims.response);
    const crm = await answerQuestion({ question: "Is personal data encrypted in the CRM?" });
    assert.match(crm.response, /^The CRM sources do not mention/, crm.response);
    assert.doesNotMatch(crm.response, /round-robin|40 people/, crm.response);
  });
});

describe("model and API failures route to the engineering defaults", () => {
  for (const question of [
    "What does Mike's code do when the model provider is unavailable?",
    "If an LLM call times out in his systems, what happens?",
    "How does Mike cope with hallucinations?",
    "What is his plan when the AI returns garbage?",
    "How does Mike deal with rate limits from model APIs?",
  ]) {
    it(`names validation, retries and a fallback: ${question}`, async () => {
      const result = await answerQuestion({
        question,
        retrieveFn: async () => [canned("What AI tools does Mike use?"), kb("stack", 0.6)],
      });
      assert.match(lead(result.response), /fallible|fallback|retries/, `${question} -> ${result.response}`);
      assert.doesNotMatch(lead(result.response), /AWS Bedrock|Anthropic Claude API/, result.response);
    });
  }
});

describe("maturity labels answer tag and badge wording", () => {
  for (const question of [
    "What does it mean when one of Mike's projects is tagged lab?",
    "Explain the badges on his GitHub repositories.",
    "How are Mike's repositories labelled?",
    "Which of his repos are prototype and which are lab?",
  ]) {
    it(`explains production, prototype and lab: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), /production, prototype, or lab/, `${question} -> ${result.response}`);
      assert.doesNotMatch(lead(result.response), /github\.com/, result.response);
    });
  }
});

describe("assistant answers lead with the asked fact", () => {
  it("names the generating model first", async () => {
    for (const question of ["Which model generates the answers here?", "What LLM produces your responses?"]) {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), /Gemini 2\.5 Flash.*Groq.*static/, `${question} -> ${result.response}`);
    }
  });

  it("gives the similarity cutoff first", async () => {
    for (const question of ["What is the minimum similarity score for retrieval?", "What relevance threshold does retrieval use?"]) {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), /0\.35/, `${question} -> ${result.response}`);
    }
  });

  it("describes the fallback first when Gemini is unavailable", async () => {
    const result = await answerQuestion({ question: "Does the chatbot keep working when Gemini fails?" });
    assert.match(lead(result.response), /Groq/, result.response);
  });
});

describe("yes/no openers only answer yes/no questions", () => {
  it("drops a yes/no opener for wh-questions", async () => {
    for (const question of ["Where does ZDI run today?", "What does the CRM use Celery for?"]) {
      const result = await answerQuestion({ question });
      assert.doesNotMatch(result.response, /^(?:Yes|No)\b/, `${question} -> ${result.response}`);
    }
  });

  it("says the sources do not state a tool's purpose", async () => {
    const result = await answerQuestion({ question: "What does the CRM use Celery for?" });
    assert.match(result.response, /do not say what it is used for/, result.response);
  });

  it("keeps yes/no for yes/no questions", async () => {
    const result = await answerQuestion({ question: "Does the CRM use Redis?" });
    assert.match(result.response, /^Yes\b/, result.response);
  });
});

describe("listed and unlisted technology", () => {
  it("leads with the listed technology, then names the unlisted one", async () => {
    const result = await answerQuestion({ question: "Has Mike worked with Postgres or MongoDB?" });
    assert.match(lead(result.response), /PostgreSQL/, result.response);
    assert.match(result.response, /MongoDB isn't listed in Mike's portfolio/);
    assert.doesNotMatch(lead(result.response), /Flask|React|Bedrock/, result.response);
  });

  it("refuses an unlisted language once, without padding from unrelated chunks", async () => {
    const result = await answerQuestion({ question: "Does Mike write Golang microservices?" });
    assert.equal(isRefusal(result.response), true, result.response);
    assert.match(result.response, /Golang isn't listed/);
    assert.doesNotMatch(result.response, /\bGo and Go\b|funeral|claims/i);
  });

  it("says plainly that no certification is listed for a listed technology", async () => {
    const result = await answerQuestion({ question: "Does Mike hold an AWS certification?" });
    assert.match(lead(result.response), /No AWS certification is listed/, result.response);
  });
});

describe("project aspects", () => {
  it("states that no test framework is named, or names the one that is", async () => {
    const sentinel = await answerQuestion({ question: "Which testing library does Proactive Sentinel use?" });
    assert.match(lead(sentinel.response), /do not name a test framework/, sentinel.response);
    const os = await answerQuestion({ question: "Which test framework does Zororo AI OS use?" });
    assert.match(lead(os.response), /pytest/, os.response);
  });

  it("says ZDI approvals involve no AI when AI is the asked agent", async () => {
    const result = await answerQuestion({ question: "Does an LLM decide ZDI approvals?" });
    assert.match(lead(result.response), /no AI in approvals/, result.response);
  });
});

describe("details below a project overview", () => {
  it("answers a detail from the project's own sentence", async () => {
    const result = await answerQuestion({ question: "Which hash function ties a ZDI signature to its content revision?" });
    assert.match(lead(result.response), /SHA-256/, result.response);
  });

  it("keeps the overview when it already covers the asked detail", async () => {
    const result = await answerQuestion({ question: "Once a ZDI manager signs off, where does the request go?" });
    assert.match(lead(result.response), /Accounts/, result.response);
  });

  it("answers a project's privacy aspect from its own encryption sentence", async () => {
    const result = await answerQuestion({ question: "Is PII encrypted in Proactive Sentinel, and how?" });
    assert.match(lead(result.response), /AES-256-GCM/, result.response);
  });

  it("treats the claims extraction pipeline as its own project", async () => {
    const result = await answerQuestion({ question: "Which model reads documents in the claims extraction pipeline?" });
    assert.match(lead(result.response), /Claude vision/, result.response);
    assert.doesNotMatch(result.response, /Gemini|Bedrock/, result.response);
  });

  it("does not offer the current employer as an earlier one", async () => {
    for (const question of ["What did Mike do before joining Zororo?", "Who was Mike's previous employer?"]) {
      const result = await answerQuestion({ question });
      assert.match(result.response, /do not list earlier employers/, `${question} -> ${result.response}`);
    }
  });

  it("reads 'status of their case' as a feature, not the project's status, and adds no email", async () => {
    const result = await answerQuestion({ question: "How can claimants track the status of their case on the claims operations platform?" });
    assert.match(lead(result.response), /case-tracking/, result.response);
    assert.doesNotMatch(result.response, EMAIL, result.response);
  });

  it("leads with the per-IP limit for request-cap questions about this chat", async () => {
    const result = await answerQuestion({ question: "How is the chat's per-IP request cap enforced?" });
    assert.match(lead(result.response), /20 requests per 10 minutes/, result.response);
    assert.doesNotMatch(lead(result.response), /fallible/, result.response);
  });

  it("schedules time with Mike through his email, but refuses reading questions", async () => {
    const booking = await answerQuestion({ question: "Can I schedule an interview with Mike?" });
    assert.match(booking.response, EMAIL);
    const reading = await answerQuestion({ question: "What books does Mike read?" });
    assert.equal(isRefusal(reading.response), true, reading.response);
  });
});

describe("review findings: broad words must not pull in a confident answer", () => {
  it("refuses contact questions aimed at someone else", async () => {
    for (const question of ["How do I contact my insurer?", "What's the best way to reach out to our customers?"]) {
      const result = await answerQuestion({ question });
      assert.doesNotMatch(result.response, /^Email Mike/, `${question} -> ${result.response}`);
    }
  });

  it("does not read a bare threshold as the retrieval cutoff", async () => {
    const result = await answerQuestion({ question: "What is Mike's threshold for stress?" });
    assert.doesNotMatch(result.response, /0\.35/, result.response);
  });

  it("answers a project's label from its status, never 'does not mention labelled'", async () => {
    const result = await answerQuestion({ question: "Is Cube tagged as production?" });
    assert.match(result.response, /prototype/, result.response);
    assert.doesNotMatch(result.response, /do not mention/, result.response);
  });

  it("names the aspect, not the visitor's verb, when a project's sources are silent", async () => {
    const result = await answerQuestion({ question: "How does Mike redact PII in the CRM?" });
    assert.match(result.response, /do not mention personal-data handling/, result.response);
  });

  it("answers which repos are prototypes from the labels", async () => {
    const result = await answerQuestion({ question: "Which of his repos are only prototypes?" });
    assert.match(result.response, /Sitewarden/, result.response);
    assert.doesNotMatch(lead(result.response), /github\.com/, result.response);
  });

  it("needs the asked failure in the lead, not just the named technology", async () => {
    const result = await answerQuestion({ question: "What happens when Gemini rate-limits the chat assistant?" });
    assert.match(lead(result.response), /Groq|fallback|retries/, result.response);
  });

  it("keeps a yes/no opener when a request opener wraps a yes/no question", () => {
    assert.equal(stripUnaskedYesNo("Tell me, is ZDI live?", "No. ZDI is not yet live [1]."), "No. ZDI is not yet live [1].");
    assert.equal(stripUnaskedYesNo("Where is ZDI deployed?", "No. ZDI is not yet live [1]."), "ZDI is not yet live [1].");
  });

  it("rejects a wh-question's topic words that the cited block never states", () => {
    const words = unsupported(
      "The assistant handles PII masking in the retrieved chunks [1].",
      ["portfolio-rag-assistant"],
      "How does the assistant handle PII masking in the retrieved chunks?",
    );
    assert.ok(words.includes("pii") && words.includes("masking"), words.join(","));
  });
});

describe("validator: question words, synonyms and every cited block", () => {
  it("accepts words a wh-question supplied", () => {
    assert.deepEqual(
      unsupported("Send offers to mikencube03@gmail.com [1].", ["availability"], "Where should I send an offer for Mike?"),
      [],
    );
    assert.deepEqual(
      unsupported("Mike's frontend is Next.js, TypeScript and React [1].", ["stack"], "What front-end stack does Mike use?"),
      [],
    );
  });

  it("accepts synonyms and inflections of the cited block's words", () => {
    assert.deepEqual(
      unsupported("The cutoff is 0.35 cosine similarity, and chunks below it are dropped [1].", ["portfolio-rag-assistant"], "What is the retrieval cutoff?"),
      [],
    );
    assert.deepEqual(unsupported("His approach is informed by regulated financial services [1].", ["engineering-approach"]), []);
    assert.deepEqual(
      unsupported("The underlying design lets Mike swap the model without changing business logic [1].", ["cube-agent"]),
      [],
    );
  });

  it("accepts a multi-word term from any block the answer cites", () => {
    assert.deepEqual(
      unsupported("Mike uses GitHub Actions for continuous integration [2]. Sitewarden lists CI with import rules [2]. Infra lists pytest [1].", ["stack", "sitewarden"], "Which CI does Mike use?"),
      [],
    );
  });

  it("still rejects invented qualifiers and purposes", () => {
    assert.ok(unsupported("ZDI approvals are rule-based [1].", ["zdi-signature-workflow"], "How are ZDI approvals decided?").includes("rule-based"));
    const purpose = unsupported("Proactive Sentinel uses Redis for caching/deduplication [1].", ["proactive-sentinel-overview"]);
    assert.ok(purpose.includes("caching") && purpose.includes("deduplication"), purpose.join(","));
    assert.ok(unsupported("PII encryption happens at the API-level gateway [1].", ["zororo-crm"]).includes("api-level"));
  });

  it("does not let a yes/no question vouch for its own claim", () => {
    const words = unsupported(
      "Yes, Proactive Sentinel uses Redis for caching [1].",
      ["proactive-sentinel-overview"],
      "Does Proactive Sentinel use Redis for caching?",
    );
    assert.ok(words.includes("caching"), words.join(","));
  });

  it("does not let a wh-question introduce a word the knowledge base never uses", () => {
    const words = unsupported("Mike caches model responses in Redis [1].", ["stack"], "How does Mike cache model responses?");
    assert.ok(words.includes("caches"), words.join(","));
  });

  it("does not let another project's block vouch for a project sentence", () => {
    const words = unsupported("The CRM encrypts PII at the app layer [1][2].", ["zororo-crm", "zororo-claims"], "How does the CRM protect PII?");
    assert.ok(words.includes("encrypts"), words.join(","));
  });
});
