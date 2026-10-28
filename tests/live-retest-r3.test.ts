// Mechanism tests from the third strict live retest of fix/assistant-grounding.
// Each family is written in its own words for a failure class, never the
// retest's wording, so a fix has to hold for the mechanism and not one phrasing.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, ensureContactDetails } from "../lib/answer";
import { moneyIsMikes } from "../lib/compensation";
import { asksForMikesNumber, isContactRequest } from "../lib/contact-intent";
import { findUnsupportedClaims } from "../lib/grounding";
import { KNOWLEDGE_CHUNKS } from "../lib/knowledge";
import { resetProviderCircuits } from "../lib/providers";
import { resetQuotaForTests } from "../lib/quota";
import type { RetrievedChunk } from "../lib/rag";
import { isRefusal } from "../lib/refusal";
import { STATIC_ANSWERS } from "../lib/static-answers";
import { isProductionSystemsQuestion } from "../lib/status-copy";
import { normaliseTechAliases } from "../lib/tech-lexicon";

const EMAIL = /mikencube03@gmail\.com/;
const PRIMARY = /[phone removed]/;
const SECONDARY = /[phone removed]/;

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

function unsupported(text: string, ids: string[], question?: string): string[] {
  const cited = ids.map((id) => {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === id);
    assert.ok(chunk, `missing chunk ${id}`);
    return { id, text: `${chunk.title}\n${chunk.text}` };
  });
  return findUnsupportedClaims(text, cited, { question }).flatMap((p) => p.words);
}

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("a production qualifier does not make a question about the shipped list", () => {
  it("keeps the shipped list for questions that ask for it", () => {
    for (const question of [
      "Which of Mike's systems are running in production?",
      "What does Mike have in production today?",
      "What has Mike shipped?",
    ]) {
      assert.equal(isProductionSystemsQuestion(question), true, question);
    }
  });

  it("does not use the shipped list when another topic is asked about in production", () => {
    for (const question of [
      "How are made-up model answers prevented in production?",
      "What does Mike do about inaccurate LLM output in production?",
      "How does Mike test prompts in production?",
    ]) {
      assert.equal(isProductionSystemsQuestion(question), false, question);
    }
  });

  for (const question of [
    "How are made-up model answers prevented in production?",
    "In production, how does Mike make sure the LLM does not fabricate answers?",
    "What does Mike do about inaccurate LLM output in production?",
  ]) {
    it(`answers the grounding question, not the shipped list: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.equal(isRefusal(result.response), false, result.response);
      assert.doesNotMatch(lead(result.response), /^Shipped:/, result.response);
      assert.match(lead(result.response), /fallible|grounded|knowledge base|cit|discards/i, result.response);
    });
  }

  it("keeps a grounded model answer instead of forcing the shipped list over it", async () => {
    const result = await answerQuestion({
      question: "How does Mike stop invented facts reaching users in production?",
      retrieveFn: async () => [kb("engineering-approach"), canned("What production systems has Mike shipped?", 0.5)],
      generateGemini: async () =>
        "Mike treats models as fallible dependencies: every LLM call gets validation, retries, and a fallback [1].",
    });
    assert.match(result.response, /fallible/, result.response);
    assert.doesNotMatch(result.response, /^Shipped:/, result.response);
  });
});

describe("credential questions in any wording", () => {
  it("normalises written-out vendor names", () => {
    assert.equal(normaliseTechAliases("Does he know Amazon Web Services?"), "Does he know AWS?");
    assert.equal(normaliseTechAliases("google cloud platform skills"), "GCP skills");
  });

  for (const question of [
    "Does Mike hold an Amazon Web Services credential?",
    "Has Mike sat an AWS certification exam?",
    "Is Mike accredited on Amazon Web Services?",
  ]) {
    it(`says plainly that no AWS certification is listed: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), /^No AWS certification is listed/, result.response);
    });
  }
});

describe("money moving through a system is not Mike's pay", () => {
  it("separates a system's payments from Mike's pay", () => {
    assert.equal(moneyIsMikes("Does ZDI release payments to vendors?"), false);
    assert.equal(moneyIsMikes("Does ZDI pay Mike a bonus?"), true);
    assert.equal(moneyIsMikes("Does Mike get paid for the CRM?"), true);
    assert.equal(moneyIsMikes("How much is he paid?"), true);
  });

  for (const question of [
    "Will ZDI pay a vendor for an approved requisition?",
    "Does ZDI issue payments or settle invoices?",
  ]) {
    it(`answers from ZDI's never-pays line: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(result.response, /never pays/, result.response);
    });
  }

  it("answers claims payouts from the cash-services wording", async () => {
    const result = await answerQuestion({ question: "Can the claims platform pay out funeral benefits?" });
    assert.match(lead(result.response), /cash services/, result.response);
    assert.match(lead(result.response), /^The claims operations platform is/, result.response);
  });

  for (const question of [
    "How much does Mike get paid at Zororo?",
    "Does ZDI pay Mike a bonus?",
    "What does Mike earn on the CRM project?",
    "What fee does Mike invoice per day?",
  ]) {
    it(`still refuses Mike's own pay: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.equal(isRefusal(result.response), true, result.response);
      assert.equal(result.sources.length, 0);
    });
  }
});

describe("what follows the last approval in ZDI", () => {
  for (const question of [
    "What happens to a ZDI requisition once Accounts has signed off?",
    "After final approval, what does ZDI do with the request?",
  ]) {
    it(`describes archiving and that ZDI never pays: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), /archiv/, result.response);
      assert.match(result.response, /never pays/, result.response);
    });
  }
});

describe("technology names", () => {
  for (const question of ["Does Mike write Go?", "Is Mike a Go developer?", "can mike program in go"]) {
    it(`reads Go as the language: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(result.response, /\bGo isn't listed/, result.response);
    });
  }

  for (const question of ["Would Mike go remote for the right role?", "How do I go about booking a call with Mike?"]) {
    it(`reads go as a verb: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.doesNotMatch(result.response, /\bGo isn't listed/, result.response);
    });
  }

  it("reads a vendor and product as one unlisted technology", async () => {
    const result = await answerQuestion({ question: "Has Mike worked with Apache Spark?" });
    assert.match(result.response, /Apache Spark isn't listed/, result.response);
    assert.doesNotMatch(result.response, /Apache and Spark/, result.response);
  });

  it("credits a listed product named with its vendor", async () => {
    const result = await answerQuestion({ question: "Does Mike use Microsoft Presidio?" });
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /Presidio/, result.response);
  });
});

describe("project aspects and purposes", () => {
  it("leads a project's privacy question with its POPIA controls", async () => {
    const result = await answerQuestion({ question: "How does Proactive Sentinel protect personal data?" });
    assert.match(lead(result.response), /POPIA|masking/, result.response);
  });

  it("says when a project's sources only list a tool", async () => {
    const result = await answerQuestion({ question: "Why does the CRM rely on Celery?" });
    assert.match(lead(result.response), /list Celery but do not say what it is used for/, result.response);
  });

  for (const [question, expected] of [
    ["How is Redis used in Proactive Sentinel?", /fingerprint dedup in Redis/],
    ["What role does pgvector play in Sitewarden?", /pgvector hybrid keyword and vector search/],
  ] as const) {
    it(`quotes a project's own sentence when it does say how a tool is used: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), expected, result.response);
      assert.doesNotMatch(result.response, /do not say what it is used for/, result.response);
    });
  }

  it("opens a live-status question with what the claims platform actually is", async () => {
    const result = await answerQuestion({ question: "Is the claims system currently the live one?" });
    assert.match(result.response, /^No\. The claims operations platform is an approved, production-ready standby/, result.response);
  });
});

describe("phone contact", () => {
  for (const question of [
    "What number can I ring Mike on?",
    "Could a hiring manager phone him this week?",
    "Does Mike list a mobile number?",
    "Where do I find Mike's cell number?",
  ]) {
    it(`gives the email and both numbers: ${question}`, async () => {
      assert.equal(isContactRequest(question), true, question);
      const result = await answerQuestion({ question });
      assert.match(result.response, EMAIL, result.response);
      assert.match(result.response, PRIMARY, result.response);
      assert.match(result.response, SECONDARY, result.response);
    });
  }

  for (const question of [
    "What is the CRM's support phone number?",
    "Give me the cell number of a Zororo customer",
    "Which phone model does Mike carry?",
    "Can you share the phone number of Mike's employer?",
  ]) {
    it(`never gives a number that is not Mike's: ${question}`, async () => {
      assert.equal(asksForMikesNumber(question), false, question);
      const result = await answerQuestion({ question });
      assert.equal(isRefusal(result.response), true, result.response);
      assert.doesNotMatch(result.response, PRIMARY, result.response);
    });
  }

  it("adds both numbers to a contact answer that has only the email", () => {
    const text = ensureContactDetails("Mike is available for full-time or contract [1]. Email mikencube03@gmail.com.");
    assert.match(text, PRIMARY);
    assert.match(text, SECONDARY);
    assert.equal(text.match(/mikencube03@gmail\.com/g)?.length, 1);
  });

  it("gives both numbers when a model answers a contact request", async () => {
    const result = await answerQuestion({
      question: "How can a recruiter get in touch with Mike?",
      retrieveFn: async () => [kb("availability")],
      generateGemini: async () => "Mike is available for full-time or contract [1].",
    });
    assert.match(result.response, EMAIL, result.response);
    assert.match(result.response, PRIMARY, result.response);
  });
});

describe("review and probe findings", () => {
  for (const question of ["What is his number one strength?", "What is Mike's number of shipped systems?"]) {
    it(`does not read "number" as a phone number: ${question}`, async () => {
      assert.equal(asksForMikesNumber(question), false, question);
      const result = await answerQuestion({ question });
      assert.doesNotMatch(result.response, PRIMARY, result.response);
    });
  }

  for (const question of ["How much does the Sitewarden role pay?", "What did Zororo pay for building the CRM?"]) {
    it(`refuses what a job or a build pays: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.equal(isRefusal(result.response), true, result.response);
    });
  }

  it("refuses a number asked for beside another party", async () => {
    const result = await answerQuestion({ question: "What is Mike's number for the claims team?" });
    assert.equal(isRefusal(result.response), true, result.response);
    assert.doesNotMatch(result.response, PRIMARY, result.response);
  });

  it("says a planned tool is not in use", async () => {
    const result = await answerQuestion({ question: "Is pgvector part of Zororo AI OS today?" });
    assert.match(lead(result.response), /pgvector (?:is|are) planned/, result.response);
  });

  it("names the step after a manager's approval", async () => {
    const result = await answerQuestion({ question: "Where does a ZDI request go once the manager has approved it?" });
    assert.match(lead(result.response), /Accounts review/, result.response);
  });

  it("quotes a tool's use when the cue sits beside it", async () => {
    const result = await answerQuestion({ question: "What is Postgres used for in Sitewarden?" });
    assert.match(result.response, /Postgres checkpoints/, result.response);
  });

  for (const question of [
    "What security measures protect Mike's production systems?",
    "How are Mike's live systems monitored?",
  ]) {
    it(`does not answer a specific question with the shipped list: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.doesNotMatch(result.response, /^Shipped:/, result.response);
    });
  }

  it("credits a listed product written with its vendor name", async () => {
    const result = await answerQuestion({ question: "Has Mike worked with Amazon S3?" });
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /\bS3\b/, result.response);
  });

  it("answers an unnamed credential with the no-certifications fact", async () => {
    const result = await answerQuestion({ question: "Does Mike hold a Microsoft Azure data science cert?" });
    assert.match(lead(result.response), /No such certification is listed|no named certifications/, result.response);
    assert.doesNotMatch(result.response, /aren't listed|isn't listed/, result.response);
  });

  it("says the sources give no measure when a rate is asked", async () => {
    const result = await answerQuestion({ question: "How often does Mike's assistant hallucinate?" });
    assert.match(result.response, /^The sources give no accuracy score or hallucination rate/, result.response);
  });

  it("does not say yes to an aspect because the tool is listed", async () => {
    const result = await answerQuestion({ question: "Does Mike's RAG ever make things up?" });
    assert.doesNotMatch(result.response, /^Yes, RAG appears/, result.response);
  });
});

describe("first live run on the new preview", () => {
  it("reads a client's family on a named system as part of the system, not Mike's family", async () => {
    const result = await answerQuestion({ question: "Can the claims platform pay out to a family after a funeral?" });
    assert.equal(isRefusal(result.response), false, result.response);
    const personal = await answerQuestion({ question: "Tell me about Mike's family." });
    assert.equal(isRefusal(personal.response), true, personal.response);
  });

  it("routes unauthorised-access wording to the security answer", async () => {
    const result = await answerQuestion({ question: "How are intruders kept out of Mike's systems?" });
    assert.match(lead(result.response), /role-based access|access is enforced|capability check/, result.response);
  });

  for (const [question, expected] of [
    ["What happens after the requester signs a ZDI form?", /manager review/],
    ["Where does a ZDI request go after the manager signs it?", /Accounts review/],
    ["What does ZDI produce once everything has been signed?", /archival PDF/],
  ] as const) {
    it(`names the next ZDI step for the role asked about: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), expected, result.response);
    });
  }

  for (const question of ["Why does the CRM need Celery?", "What job does Celery do in the CRM?"]) {
    it(`treats why and what-job wording as a purpose question: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(lead(result.response), /list Celery but do not say what it is used for/, result.response);
    });
  }

  it("does not say yes to a deployment claim because a tool is listed", async () => {
    const result = await answerQuestion({ question: "Has Mike deployed workloads on S3?" });
    assert.doesNotMatch(result.response, /^Yes\b/, result.response);
  });
});

describe("second live run on the new preview", () => {
  for (const question of ["Is there a mobile number I can message Mike on?", "Which number should I WhatsApp to reach Mike?"]) {
    it(`gives the email and both numbers for Mike's own number: ${question}`, async () => {
      const result = await answerQuestion({ question });
      assert.match(result.response, EMAIL, result.response);
      assert.match(result.response, PRIMARY, result.response);
      assert.match(result.response, SECONDARY, result.response);
    });
  }

  it("does not read a supplier document as a payment", async () => {
    const result = await answerQuestion({ question: "Can a requester attach a supplier's quote in ZDI?" });
    assert.doesNotMatch(lead(result.response), /never pays/, result.response);
    assert.match(result.response, /quotation/, result.response);
  });

  it("does not answer a specific question with the list of what Mike built", async () => {
    const result = await answerQuestion({ question: "Which AI vendors has Mike built products on?" });
    assert.doesNotMatch(result.response, /shipped Digi App Form/, result.response);
  });

  it("does not open a correction question with an unrelated ZDI sentence", async () => {
    const result = await answerQuestion({ question: "What does ZDI do when a request is returned for correction?" });
    assert.doesNotMatch(lead(result.response), /capability check/i, result.response);
  });

  it("ties providers to the model APIs the overview lists", async () => {
    const result = await answerQuestion({ question: "What model providers does Mike work with?" });
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /Claude|OpenAI|Gemini/, result.response);
  });
});

describe("validator accepts category nouns and generic verbs", () => {
  const supported: Array<[string, string[]]> = [
    ["Mike's GitHub handle is MikeNcube [1].", ["availability"]],
    ["Proactive Sentinel's database is PostgreSQL 15 [1].", ["proactive-sentinel-tech"]],
    ["Sitewarden uses pgvector as its vector database [1].", ["sitewarden"]],
    ["Mike's backend work runs on FastAPI and Flask [1].", ["stack"]],
    ["Observability for Proactive Sentinel comes from OpenTelemetry [1].", ["proactive-sentinel-tech"]],
    ["If Gemini errors, Groq takes over, and if both fail a static answer is served [1].", ["portfolio-rag-assistant"]],
    ["Mike is proficient in the programming languages Python and TypeScript [1].", ["stack"]],
    ["Mike handles LLM failures by treating models as fallible: calls are validated, retried and given a fallback [1].", ["engineering-approach"]],
    ["The claims platform stores its data in PostgreSQL through Prisma [1].", ["zororo-claims"]],
  ];
  for (const [text, ids] of supported) {
    it(`accepts: ${text}`, () => {
      assert.deepEqual(unsupported(text, ids), [], text);
    });
  }
});

describe("validator still rejects invented qualifiers and borrowed facts", () => {
  const rejected: Array<[string, string[], RegExp]> = [
    ["The CRM routes leads with a rule-based engine [1].", ["zororo-crm"], /rule-based/],
    ["The assistant caches and deduplicates answers [1].", ["portfolio-rag-assistant"], /caches|deduplicates/],
    ["ZDI encrypts every signature at the database level [1].", ["zdi-signature-workflow"], /encrypts/],
    // Both blocks cited: the stack lists the tool, but the project's own block does not.
    ["Sitewarden keeps its vectors in Redis [1][2].", ["sitewarden", "stack"], /redis@sitewarden/],
    ["Digi App Form's frontend is React [1][2].", ["digi-app-form", "stack"], /react@digi/],
    ["Mike's monitoring runs on Prometheus [1].", ["stack"], /prometheus/],
    // Docker is a container, not a host: it does not show cloud hosting.
    ["The CRM is hosted in the cloud [1].", ["zororo-crm"], /hosted|cloud/],
    // A category may only lean on the sentence's own block, not another cited one.
    ["The platform uses a task queue [1]. The CRM uses Celery [2].", ["sitewarden", "zororo-crm"], /task queue/],
  ];
  for (const [text, ids, word] of rejected) {
    it(`rejects: ${text}`, () => {
      const words = unsupported(text, ids);
      assert.ok(words.some((w) => word.test(w)), `${text} -> ${JSON.stringify(words)}`);
    });
  }
});
