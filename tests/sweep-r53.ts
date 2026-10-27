import { readFileSync, existsSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, EMAIL_FALLBACK } from "../lib/answer";
import { validateModelSentences } from "../lib/grounding";
import { isRefusal } from "../lib/refusal";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";

type HoldoutRow = {
  question: string;
  kind: "answer" | "refuse" | "safe";
  mustMatch?: string;
  mustNotMatch?: string;
  unknownTerms?: string[];
};

async function ask(question: string) {
  return answerQuestion({ question });
}

const WRONG_HIJACK = /shift-based|manager sends a requester|over 40 people as tech lead|FIFA|parliament|Pretoria|Cape Town is the capital/i;

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("r53 fixtures: keyword path", () => {
  it("refuses pay-per-year instead of years-of-experience", async () => {
    const result = await ask("What does Mike get paid per year?");
    assert.equal(isRefusal(result.response), true, result.response);
    assert.equal(result.response, EMAIL_FALLBACK);
    assert.doesNotMatch(result.response, /six-plus years/);
  });

  it("refuses FIFA trophy instead of tech-lead", async () => {
    const result = await ask("Which team lifted the trophy at the last FIFA tournament?");
    assert.equal(isRefusal(result.response), true, result.response);
    assert.doesNotMatch(result.response, /tech lead|four-person|Digi App Form/i);
  });

  it("refuses the seat of the South African parliament", async () => {
    const result = await ask("Which city is the seat of the South African parliament?");
    assert.equal(isRefusal(result.response), true, result.response);
    assert.doesNotMatch(result.response, /Johannesburg|Zororo-Phumulani/);
  });

  it("notes EKS/k8s as not listed or refuses, without a confident dump", async () => {
    const result = await ask("EKS or k8s?");
    if (isRefusal(result.response)) {
      assert.equal(result.sources.length, 0);
      return;
    }
    assert.match(result.response, /isn't listed|aren't listed/i);
    assert.doesNotMatch(result.response, /manager sends a requester/i);
  });

  it("answers remote-only roles from remote-first sources", async () => {
    const result = await ask("Remote roles only?");
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /remote/i);
    assert.doesNotMatch(result.response, WRONG_HIJACK);
  });

  it("answers why-hire over other candidates", async () => {
    const result = await ask("Why hire Mike over other candidates?");
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /hire Mike over other candidates|Digi App Form|shipped/i);
    assert.doesNotMatch(result.response, WRONG_HIJACK);
  });

  it("answers years of Python from the KB or refuses, never a wrong topic", async () => {
    const result = await ask("Years of Python?");
    if (isRefusal(result.response)) {
      assert.equal(result.sources.length, 0);
      return;
    }
    assert.match(result.response, /Python|six-plus years/i);
    assert.doesNotMatch(result.response, /Johannesburg is|FIFA|parliament/i);
  });

  it("refuses Mike's manager at Zororo instead of the ZDI manager-workflow dump", async () => {
    const result = await ask("Who is Mike's manager at Zororo?");
    assert.equal(isRefusal(result.response), true, result.response);
    assert.doesNotMatch(result.response, /manager sends a requester|secure link/i);
  });
});

describe("r53 fixtures: model path", () => {
  it("keeps a correct model refusal as a refusal", async () => {
    const result = await answerQuestion({
      question: "Which team lifted the trophy at the last FIFA tournament?",
      generateGemini: async () => "I don't have information about that.",
    });
    assert.equal(isRefusal(result.response), true, result.response);
    assert.doesNotMatch(result.response, /tech lead|Digi App Form|four-person/i);
  });

  it("does not override a model refusal with a canned identity miss", async () => {
    const result = await answerQuestion({
      question: "Who is Mike's manager at Zororo?",
      generateGemini: async () => "I do not have that information in the context.",
    });
    assert.equal(isRefusal(result.response), true, result.response);
    assert.doesNotMatch(result.response, /manager sends a requester/i);
  });

  it("strips five years of kubernetes/terraform when the cited chunk lacks those claims", async () => {
    const stripped = validateModelSentences(
      "Mike has five years of hands-on kubernetes and terraform experience [1].",
      ["Mike has six-plus years in software, about three focused on generative AI."],
      "How many years of Kubernetes experience does Mike have?",
    );
    assert.equal(stripped, "");
    const result = await answerQuestion({
      question: "How many years of Kubernetes experience does Mike have?",
      generateGemini: async () =>
        "Mike has five years of hands-on kubernetes and terraform experience [1].",
    });
    assert.doesNotMatch(result.response, /five years/i);
    assert.doesNotMatch(result.response, /hands-on kubernetes/i);
  });

  it("strips led-the-CRM-team-of-40-as-tech-lead when the cited chunk lacks those claims", async () => {
    const stripped = validateModelSentences(
      "Mike led the CRM team of 40 people as tech lead [1].",
      ["Shipped live production system: lead-management CRM used by over 40 people across around 10 roles."],
      "Did Mike lead a team of 40 as tech lead?",
    );
    assert.equal(stripped, "");
    const result = await answerQuestion({
      question: "Did Mike lead a team of 40 as tech lead?",
      generateGemini: async () => "Mike led the CRM team of 40 people as tech lead [1].",
    });
    assert.doesNotMatch(result.response, /led the CRM team of 40/i);
    assert.doesNotMatch(result.response, /as tech lead/i);
  });

  it("falls through cleanly when the provider throws", async () => {
    const result = await answerQuestion({
      question: "Where is Mike based?",
      generateGemini: async () => {
        throw new Error("429");
      },
    });
    assert.equal(isRefusal(result.response), false, result.response);
    assert.match(result.response, /Johannesburg/);
  });
});

describe("r53 fresh held-out paraphrases", () => {
  const holdoutPath = new URL("./holdout/r53.jsonl", import.meta.url);
  const rows: HoldoutRow[] = existsSync(holdoutPath)
    ? readFileSync(holdoutPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as HoldoutRow)
    : [];
  const frozen = rows.length > 0;

  it("loads 40 held-out paraphrases authored after the code freeze", { skip: !frozen }, () => {
    assert.equal(rows.length, 40, `holdout size ${rows.length}`);
  });

  it("has zero confident wrong answers on the keyword path", { skip: !frozen }, async () => {
    assert.ok(rows.length >= 40);
    const failures: string[] = [];
    for (const row of rows) {
      const result = await ask(row.question);
      const label = `keyword ${row.kind} ${row.question} => ${result.response}`;
      try {
        assert.doesNotMatch(result.response, WRONG_HIJACK, label);
        if (row.kind === "refuse") {
          assert.equal(isRefusal(result.response), true, label);
          assert.equal(result.sources.length, 0, label);
        } else if (row.kind === "answer") {
          assert.equal(isRefusal(result.response), false, label);
          if (row.mustMatch) assert.match(result.response, new RegExp(row.mustMatch, "i"), label);
          if (row.mustNotMatch) {
            assert.doesNotMatch(result.response, new RegExp(row.mustNotMatch, "i"), label);
          }
          if (row.unknownTerms) {
            for (const term of row.unknownTerms) {
              assert.match(
                result.response,
                new RegExp(`${term}.*isn't listed|isn't listed.*${term}`, "i"),
                label,
              );
            }
          }
        } else {
          if (isRefusal(result.response)) {
            assert.equal(result.sources.length, 0, label);
          } else {
            if (row.mustMatch) assert.match(result.response, new RegExp(row.mustMatch, "i"), label);
            if (row.mustNotMatch) {
              assert.doesNotMatch(result.response, new RegExp(row.mustNotMatch, "i"), label);
            }
          }
        }
      } catch (err) {
        failures.push(`${label}\n${err instanceof Error ? err.message : String(err)}`);
      }
    }
    assert.equal(failures.length, 0, failures.slice(0, 8).join("\n\n"));
  });

  it("has zero confident wrong answers on the stubbed model-refusal path", { skip: !frozen }, async () => {
    assert.ok(rows.length >= 40);
    const failures: string[] = [];
    for (const row of rows) {
      const result = await answerQuestion({
        question: row.question,
        generateGemini: async () => "I don't have information about that.",
      });
      const label = `model ${row.kind} ${row.question} => ${result.response}`;
      try {
        assert.doesNotMatch(result.response, WRONG_HIJACK, label);
        if (isRefusal(result.response)) {
          assert.doesNotMatch(result.response, /tech lead|manager sends a requester/i, label);
          continue;
        }
        if (row.kind === "refuse") {
          assert.fail(label);
        }
        if (row.mustMatch) assert.match(result.response, new RegExp(row.mustMatch, "i"), label);
        if (row.mustNotMatch) {
          assert.doesNotMatch(result.response, new RegExp(row.mustNotMatch, "i"), label);
        }
      } catch (err) {
        failures.push(`${label}\n${err instanceof Error ? err.message : String(err)}`);
      }
    }
    assert.equal(failures.length, 0, failures.slice(0, 8).join("\n\n"));
  });
});
