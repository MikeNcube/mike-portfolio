// Regression tests for Mike's r4 decisions on fix/assistant-grounding: the two
// misread questions from the live retest with three paraphrases each, the
// contact channels (WhatsApp, a direct line), and the over-refusals the
// knowledge base can answer. Neighbouring questions guard each mechanism.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../lib/answer";
import { analyseQuestion, isCredentialAsk } from "../lib/concepts";
import { asksForMikesNumber } from "../lib/contact-intent";
import { namedProjects } from "../lib/intent";
import { KNOWLEDGE_CHUNKS } from "../lib/knowledge";
import { resetProviderCircuits } from "../lib/providers";
import { resetQuotaForTests } from "../lib/quota";
import { isRefusal } from "../lib/refusal";

const EMAIL = /mikencube03@gmail\.com/;
const PRIMARY = /078 136 0508/;
const SECONDARY = /071 846 0107/;

function lead(text: string): string {
  return text.split(/(?<=[.!?](?:\s*\[\d+\])*)\s+(?=[A-Z])/)[0] ?? text;
}

async function ask(question: string) {
  return answerQuestion({ question });
}

function assertRefused(question: string, response: string, sources: unknown[]): void {
  assert.ok(isRefusal(response) && sources.length === 0, `${question} -> ${response}`);
}

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("AI companies and vendors answer with the providers in the KB", () => {
  for (const question of [
    "Which AI companies does Mike build with?",
    "What AI vendors does Mike build on?",
    "Which LLM providers power Mike's work?",
    "Which model companies does Mike rely on?",
  ]) {
    it(question, async () => {
      const result = await ask(question);
      assert.ok(!isRefusal(result.response), `${question} -> ${result.response}`);
      for (const provider of [/Anthropic Claude/, /Gemini/, /Groq/, /OpenAI/, /Bedrock/]) {
        assert.match(result.response, provider, result.response);
      }
      assert.doesNotMatch(result.response, /shipped Digi App Form/, result.response);
    });
  }

  it("keeps an employment question about AI companies on the employer", async () => {
    const result = await ask("Which AI companies has Mike worked for?");
    assert.match(lead(result.response), /Zororo-Phumulani/, result.response);
  });

  it("keeps a rate-limit question about model APIs on failure handling", async () => {
    const result = await ask("How does Mike deal with rate limits from model APIs?");
    assert.match(result.response, /fallible|fallback|retries/, result.response);
  });

  it("reads a supplier after built products as the asked thing", async () => {
    const result = await ask("Which AI vendors has Mike built products on?");
    assert.match(result.response, /Anthropic Claude/, result.response);
  });

  it("does not let 'projects' as framing turn a vendor question into the built list", async () => {
    const result = await ask("Which AI providers turn up across Mike's projects?");
    assert.match(result.response, /Anthropic Claude/, result.response);
    assert.doesNotMatch(result.response, /shipped Digi App Form/, result.response);
  });

  it("reads 'build' as a noun when nothing makes it a verb", () => {
    assert.ok(!analyseQuestion("What's the proof-point build on Mike's CV?").concepts.includes("skills"));
  });
});

describe("a staff group named as the users of a system names that system", () => {
  for (const question of [
    "What did Mike build for the claims team?",
    "What has Mike built for claims staff?",
    "What did Mike make for the claims department?",
    "Which systems did Mike develop to support the claims unit?",
  ]) {
    it(question, async () => {
      const result = await ask(question);
      assert.match(lead(result.response), /claims operations platform/, result.response);
      assert.match(result.response, /claims document extraction pipeline/, result.response);
      assert.doesNotMatch(result.response, /tech lead|lead-management CRM/, result.response);
    });
  }

  it("names the claims systems, not a team Mike leads", () => {
    const ids = namedProjects("What did Mike build for the claims team?").map((p) => p.id);
    assert.deepEqual(ids, ["claims", "claims-pipeline"]);
    assert.ok(!analyseQuestion("What did Mike build for the claims team?").concepts.includes("team"));
  });

  it("refuses a question about the staff group itself", async () => {
    for (const question of ["How big is the claims team?", "Did Mike lead the claims team?"]) {
      const result = await ask(question);
      assertRefused(question, result.response, result.sources);
    }
  });
});

describe("WhatsApp and a direct line are Mike's numbers", () => {
  for (const question of [
    "Is there a WhatsApp line for Mike?",
    "Is Mike on WhatsApp?",
    "Can I WhatsApp Mike?",
    "What's Mike's WhatsApp number?",
    "Does Mike have a direct line?",
    "What's Mike's direct line?",
    "Is there a direct phone line to Mike?",
  ]) {
    it(question, async () => {
      const result = await ask(question);
      assert.match(result.response, EMAIL, result.response);
      assert.match(result.response, PRIMARY, result.response);
      assert.match(result.response, SECONDARY, result.response);
      assert.match(result.response, /WhatsApp/, result.response);
    });
  }

  it("states WhatsApp on both numbers in the contact chunk", () => {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === "availability");
    assert.ok(chunk);
    assert.match(chunk.text, /WhatsApp on both numbers/);
  });

  it("does not read a line manager or a system's messages as Mike's number", async () => {
    assert.equal(asksForMikesNumber("Does Mike have a line manager?"), false);
    for (const question of ["Does Mike have a line manager?", "Does the CRM send WhatsApp messages?"]) {
      const result = await ask(question);
      assert.doesNotMatch(result.response, PRIMARY, result.response);
    }
  });

  it("keeps the phone as a device personal", async () => {
    const result = await ask("What phone does Mike use?");
    assertRefused("What phone does Mike use?", result.response, result.sources);
  });
});

describe("over-refusals the knowledge base covers", () => {
  it("answers an exam code with the certifications fact", async () => {
    for (const question of ["any AZ-900 or AI-900?", "Has Mike passed SAA-C03?", "Does he hold DP-100?"]) {
      const result = await ask(question);
      assert.match(lead(result.response), /No such certification is listed/, `${question} -> ${result.response}`);
    }
  });

  it("does not read a KB cipher name as an exam code", async () => {
    assert.equal(isCredentialAsk("Does Sentinel use AES-256?"), false);
    const result = await ask("Does Sentinel use AES-256?");
    assert.doesNotMatch(result.response, /certification/i, result.response);
  });

  it("answers the claims extractor by its pipeline's review safeguards", async () => {
    for (const question of [
      "if the claims extractor misreads a field how is that caught",
      "How does the claims extractor flag a bad field?",
    ]) {
      const result = await ask(question);
      assert.match(result.response, /needs-review flag/, `${question} -> ${result.response}`);
    }
  });

  it("answers a number-one achievement from the strongest-project facts", async () => {
    for (const question of ["What is his number one achievement?", "What's Mike's biggest accomplishment?"]) {
      const result = await ask(question);
      assert.match(lead(result.response), /do not rank a strongest project/, `${question} -> ${result.response}`);
    }
  });

  it("keeps 'number one' a ranking word, so a skill question stays on skills", async () => {
    const result = await ask("What is his number one skill?");
    assert.match(result.response, /stack/, result.response);
    assert.doesNotMatch(result.response, PRIMARY, result.response);
  });
});

describe("judged misses from the final live run", () => {
  it("does not call private test suites public", async () => {
    const result = await ask("Does Mike write evals for his LLM work?");
    assert.doesNotMatch(result.response, /\bpublic tests\b/i, result.response);
  });

  it("says the KB lists no LLM in Zororo's live systems before the safeguards", async () => {
    const result = await ask("How are hallucinations kept out of Zororo's production systems?");
    assert.match(lead(result.response), /no LLM in Zororo-Phumulani's live systems/, result.response);
  });

  it("answers one named technology with the projects that use it", async () => {
    const result = await ask("How much has Mike worked with LangGraph?");
    assert.match(result.response, /Sitewarden \[\d\] uses it/, result.response);
    assert.doesNotMatch(result.response, /Anthropic Claude/, result.response);
  });

  it("does not answer a staff-group question with the overview of everything built", async () => {
    const result = await ask("What software did Mike make for Zororo's claims staff?");
    assert.match(lead(result.response), /claims operations platform/, result.response);
  });

  it("reads 'let's go' as wording and 'was let go' as a dismissal", async () => {
    const stack = await ask("right, let's go: what backend does Mike use?");
    assert.match(stack.response, /FastAPI/, stack.response);
    const dismissal = await ask("Was Mike let go from a job?");
    assertRefused("Was Mike let go from a job?", dismissal.response, dismissal.sources);
  });

  it("answers AI labs as model suppliers even when 'builds on' frames the question", async () => {
    const result = await ask("Which AI labs supply the models Mike builds on?");
    assert.match(result.response, /Anthropic Claude/, result.response);
  });

  it("answers a project detail from the one sentence that holds it, not the overview", async () => {
    const correction = await ask("What does ZDI do when a submission is returned for correction?");
    assert.match(lead(correction.response), /^A return for correction creates a new revision/, correction.response);
    const quotation = await ask("Where in ZDI does the requester add a quotation?");
    assert.match(lead(quotation.response), /attaches a quotation/, quotation.response);
  });

  it("answers a lowercase subject named only in a source title", async () => {
    const result = await ask("Explain the recommender pipeline");
    assert.match(result.response, /reference architecture/, result.response);
  });
});

describe("a place word does not anchor a personal question onto a profile answer", () => {
  it("refuses what Mike owns and where he has been", async () => {
    for (const question of ["Is Mike a homeowner in Gauteng?", "What cities has Mike visited?", "Has he taken any trips overseas?"]) {
      const result = await ask(question);
      assertRefused(question, result.response, result.sources);
    }
  });

  it("still answers a link visit and where he can work from", async () => {
    const github = await ask("Can I visit Mike's GitHub?");
    assert.match(github.response, /github\.com\/MikeNcube/, github.response);
    const where = await ask("Which countries can Mike work from?");
    assert.match(where.response, /remote-first/, where.response);
  });
});
