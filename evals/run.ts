#!/usr/bin/env tsx
// Run the portfolio assistant eval suite.
//
// Usage:
//   GEMINI_API_KEY=your_key npx tsx evals/run.ts [--url http://localhost:3000]
//   GEMINI_API_KEY=your_key npx tsx evals/run.ts --url https://your-preview.vercel.app
//
// Results are written to evals/results.json and printed to stdout.
// Exit code 0 = all evals pass, 1 = one or more fail.

import { writeFileSync } from "fs";
import { EVAL_QUESTIONS, normaliseEvalText, type EvalResult } from "./eval";
import { isRefusal } from "../lib/refusal";
import { aiOsStatusAppearsOnce, hasRepeatedStatus } from "../lib/status-copy";
import { citationsMatchNamedProjects } from "../lib/answer";

function computesTwoPlusTwo(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /(?:2\s*\+\s*2|two plus two).{0,32}\b(?:4|four)\b/.test(t) ||
    /\b(?:4|four)\b.{0,32}(?:2\s*\+\s*2|two plus two)/.test(t) ||
    /\b(?:equals|is|are|makes)\s+(?:4|four)\b/.test(t) ||
    /(?:2\s*\+\s*2|two plus two)\s*(?:=|equals)/.test(t)
  );
}

const DEFAULT_URL = "http://localhost:3000";
const urlArg = process.argv.indexOf("--url");
const BASE_URL = urlArg >= 0 ? process.argv[urlArg + 1] : DEFAULT_URL;

async function runEval(q: typeof EVAL_QUESTIONS[0]): Promise<EvalResult> {
  const start = Date.now();
  let response = "";
  let sources: Array<{ id?: string; title: string; url: string }> = [];
  let fetchOk = false;

  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: q.question, audience: q.audience ?? "developer" }),
    });
    const data = await res.json();
    response = data.response ?? data.error ?? "";
    sources = data.sources ?? [];
    fetchOk = res.ok;
  } catch (err) {
    response = `FETCH_ERROR: ${err}`;
  }

  const durationMs = Date.now() - start;
  const haystack = normaliseEvalText(response);
  const checks: Array<{ label: string; pass: boolean; detail?: string }> = [];

  // 1. API returned successfully
  checks.push({ label: "api_ok", pass: fetchOk, detail: fetchOk ? undefined : response });

  // 2. Refusal check — email next to real content is not a refusal
  const refused = isRefusal(response);
  if (q.expectRefusal !== undefined) {
    checks.push({
      label: q.expectRefusal ? "is_refusal" : "not_refusal",
      pass: q.expectRefusal ? refused : !refused,
    });
  }

  // 3. mustContain checks
  for (const phrase of q.mustContain ?? []) {
    const pass = haystack.includes(normaliseEvalText(phrase));
    checks.push({ label: `contains:${phrase}`, pass });
  }

  // 3b. meaning checks — any listed phrase is enough
  for (const check of q.meaningChecks ?? []) {
    const pass = check.anyOf.some((phrase) => haystack.includes(normaliseEvalText(phrase)));
    checks.push({
      label: `meaning:${check.label}`,
      pass,
      detail: pass ? undefined : `expected one of: ${check.anyOf.join(", ")}`,
    });
  }

  // 4. mustNotContain checks
  for (const phrase of q.mustNotContain ?? []) {
    const pass = !haystack.includes(normaliseEvalText(phrase));
    checks.push({ label: `not_contains:${phrase}`, pass, detail: pass ? undefined : `Found forbidden phrase: "${phrase}"` });
  }

  // 4b. Math eval: fail if the model computes 2+2 instead of refusing
  if (q.id === "out-of-scope-math") {
    const computed = computesTwoPlusTwo(response);
    checks.push({
      label: "does_not_compute_2plus2",
      pass: !computed,
      detail: computed ? "Response computes 2+2 instead of refusing" : undefined,
    });
  }

  // 5. Source presence
  if (q.expectSources) {
    const linkSources = sources.filter((s) => s.url.startsWith("http"));
    checks.push({ label: "has_sources", pass: linkSources.length > 0, detail: `${linkSources.length} link source(s)` });
  } else if (q.expectRefusal) {
    // Refusals should have no sources
    checks.push({ label: "no_sources_on_refusal", pass: sources.length === 0, detail: `${sources.length} source(s) returned` });
  }

  if (q.expectCitation) {
    const hasInline = /\[\d+\]/.test(response);
    checks.push({
      label: "has_citation",
      pass: hasInline,
      detail: hasInline ? "inline [n]" : "no inline [n]",
    });
  }

  if (!q.expectRefusal && !refused) {
    const hasInline = /\[\d+\]/.test(response);
    checks.push({
      label: "has_inline_citation",
      pass: hasInline,
      detail: hasInline ? "inline [n]" : "non-refusal missing [n]",
    });
    const repeated = hasRepeatedStatus(response);
    checks.push({
      label: "no_repeated_status",
      pass: !repeated,
      detail: repeated ? "repeated status wording (built/built or prototype/Status: Prototype)" : undefined,
    });
    if (q.id === "zororo-ai-os-about") {
      const once = aiOsStatusAppearsOnce(response);
      checks.push({
        label: "status_meaning_once",
        pass: once,
        detail: once ? undefined : "early-stage / not-deployed meaning must appear once",
      });
    }
    const aligned = citationsMatchNamedProjects(response, sources);
    checks.push({
      label: "citations_match_named_projects",
      pass: aligned.pass,
      detail: aligned.failures.join("; ") || undefined,
    });
    if (q.id === "production-systems") {
      const expected = ["digi-app-form", "zororo-crm", "zdi-signature-workflow", "zororo-claims"];
      const ids = sources.map((s) => s.id);
      const orderById = expected.every((id, i) => ids[i] === id);
      const orderByTitle =
        /digi/i.test(sources[0]?.title ?? "")
        && /crm/i.test(sources[1]?.title ?? "")
        && /zdi/i.test(sources[2]?.title ?? "")
        && /claims/i.test(sources[3]?.title ?? "");
      const order = orderById || orderByTitle;
      const numbered =
        /Digi App Form \[1\]/i.test(response)
        && /Zororo CRM \[2\]/i.test(response)
        && /ZDI \[3\]/i.test(response)
        && /\[4\]/.test(response);
      checks.push({
        label: "production_citations_map",
        pass: order && aligned.pass && numbered,
        detail: order && numbered ? undefined : `ids ${ids.join(", ")}; ${aligned.failures.join("; ")}`,
      });
    }
  }

  const pass = checks.every((c) => c.pass);

  return { id: q.id, question: q.question, description: q.description, pass, response, sources, checks, durationMs };
}

async function main() {
  console.log(`\nRunning ${EVAL_QUESTIONS.length} evals against ${BASE_URL}\n`);

  const results: EvalResult[] = [];
  for (const q of EVAL_QUESTIONS) {
    process.stdout.write(`  ${q.id.padEnd(30)} `);
    const result = await runEval(q);
    results.push(result);
    const icon = result.pass ? "PASS" : "FAIL";
    console.log(`${icon}  (${result.durationMs}ms)`);
    if (!result.pass) {
      for (const c of result.checks.filter((c) => !c.pass)) {
        console.log(`    × ${c.label}${c.detail ? ": " + c.detail : ""}`);
      }
    }
    // Brief pause between requests to stay within free-tier rate limits
    await new Promise((r) => setTimeout(r, 1200));
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const pct = Math.round((passed / total) * 100);

  const output = {
    runAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: { passed, total, pct },
    results,
  };

  writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify(output, null, 2));

  console.log(`\n${passed}/${total} evals passed (${pct}%)`);
  console.log("Results written to evals/results.json\n");

  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
