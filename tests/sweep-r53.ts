import { readFileSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../lib/answer";
import { isRefusal } from "../lib/refusal";
import { resetQuotaForTests } from "../lib/quota";
import { resetProviderCircuits } from "../lib/providers";

// Blind set written by an agent that never saw the routing code or word lists.
// The odd rows were used as a development split during r53; the even rows were
// kept sealed. Floors sit just under the r53 result so regressions fail loudly.
const ANSWER_FLOOR = 0.85;
const UNKNOWN_TECH_FLOOR = 0.9;
const REFUSE_FLOOR = 0.95;

type BlindRow = {
  question: string;
  kind: "answer" | "refuse";
  mustMatch?: string;
  mustNotMatch?: string;
  unknownTerms?: string[];
};

const BLIND: BlindRow[] = readFileSync(new URL("./holdout/blind-r53.jsonl", import.meta.url), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as BlindRow);

function notesUnknown(response: string, term: string): boolean {
  return new RegExp(`${term}.*(?:isn't|aren't) listed|(?:isn't|aren't) listed.*${term}`, "i").test(response);
}

beforeEach(() => {
  resetQuotaForTests();
  resetProviderCircuits();
});

describe("r53 blind set", () => {
  it("answers, notes unknown technology, and refuses above the floors", async () => {
    const tally = { answer: [0, 0], unknown: [0, 0], refuse: [0, 0] };
    const failures: string[] = [];
    for (const row of BLIND) {
      const result = await answerQuestion({ question: row.question });
      const refused = isRefusal(result.response) && result.sources.length === 0;
      const bucket = row.kind === "refuse" ? "refuse" : row.unknownTerms ? "unknown" : "answer";
      let ok: boolean;
      if (row.kind === "refuse") {
        ok = refused;
      } else {
        ok = !refused
          && (!row.mustMatch || new RegExp(row.mustMatch, "i").test(result.response))
          && (!row.mustNotMatch || !new RegExp(row.mustNotMatch, "i").test(result.response))
          && (row.unknownTerms ?? []).every((term) => notesUnknown(result.response, term));
      }
      tally[bucket][1] += 1;
      if (ok) tally[bucket][0] += 1;
      else failures.push(`${row.kind} ${row.question} => ${result.response.slice(0, 160)}`);
    }
    const rate = (key: keyof typeof tally) => tally[key][0] / tally[key][1];
    console.log(
      `r53 blind: answer ${tally.answer[0]}/${tally.answer[1]}, `
        + `unknown-tech ${tally.unknown[0]}/${tally.unknown[1]}, refuse ${tally.refuse[0]}/${tally.refuse[1]}`,
    );
    const sample = failures.slice(0, 8).join("\n");
    assert.ok(rate("answer") >= ANSWER_FLOOR, `answer rate ${rate("answer")}\n${sample}`);
    assert.ok(rate("unknown") >= UNKNOWN_TECH_FLOOR, `unknown-tech rate ${rate("unknown")}\n${sample}`);
    assert.ok(rate("refuse") >= REFUSE_FLOOR, `refuse rate ${rate("refuse")}\n${sample}`);
  });
});
