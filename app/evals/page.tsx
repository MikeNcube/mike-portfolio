import type { Metadata } from "next";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { EVAL_QUESTIONS } from "@/evals/eval";

// Dynamic so fs.existsSync works at request time even without results.json
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eval results · RAG assistant",
  description:
    "Methodology and results for the portfolio RAG assistant evaluation suite.",
};

type EvalCheck = { label: string; pass: boolean; detail?: string };
type EvalResult = {
  id: string;
  question: string;
  description: string;
  pass: boolean;
  response: string;
  sources: Array<{ title: string; url: string }>;
  checks: EvalCheck[];
  durationMs: number;
};
type EvalData = {
  runAt: string;
  baseUrl: string;
  summary: { passed: number; total: number; pct: number };
  results: EvalResult[];
};

function loadResults(): EvalData | null {
  try {
    const file = path.join(process.cwd(), "evals", "results.json");
    if (!existsSync(file)) return null;
    const data = JSON.parse(readFileSync(file, "utf-8")) as EvalData;
    // Sanity-check: real results must have a summary.passed number
    if (typeof data?.summary?.passed !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export default function EvalsPage() {
  const data = loadResults();

  return (
    <main className="pt-24 pb-20">
      <div className="container-edge" style={{ maxWidth: 780 }}>

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">Eval results</p>
          <h1
            className="font-display-section font-medium text-ink mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.025em" }}
          >
            RAG assistant evaluation
          </h1>
          <p className="text-base text-ink-muted max-w-prose">
            {EVAL_QUESTIONS.length} questions covering answer correctness, citation correctness,
            out-of-scope refusals, and prompt-injection resistance. Run against any deployment
            to generate results.
          </p>
        </div>

        {/* Methodology — concise public summary only */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-ink mb-3">What is tested</h2>
          <p className="text-sm text-ink-muted leading-relaxed max-w-prose">
            Each of the questions below is tested against the live assistant. Checks include:
            API response success, answer correctness (must-contain phrases), absence of
            hallucinations (must-not-contain phrases), correct refusal for out-of-scope and
            prompt-injection attempts, and source citation presence where expected.
          </p>
        </section>

        {/* Questions */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-ink mb-4">Questions ({EVAL_QUESTIONS.length})</h2>
          <div className="space-y-3">
            {EVAL_QUESTIONS.map((q, i) => (
              <div
                key={q.id}
                className="flex gap-3 rounded-xl border border-ink/[0.07] p-4"
              >
                <span className="font-mono text-micro text-ink-muted w-5 shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{q.question}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{q.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {q.expectRefusal && (
                      <span className="text-micro font-mono text-ink-muted bg-surface rounded px-1.5 py-0.5">
                        expects refusal
                      </span>
                    )}
                    {q.expectSources && (
                      <span className="text-micro font-mono text-ink-muted bg-surface rounded px-1.5 py-0.5">
                        expects sources
                      </span>
                    )}
                    {(q.mustContain ?? []).map((p) => (
                      <span key={p} className="text-micro font-mono text-signal bg-surface rounded px-1.5 py-0.5">
                        must contain: {p}
                      </span>
                    ))}
                    {(q.meaningChecks ?? []).map((check) => (
                      <span key={check.label} className="text-micro font-mono text-signal bg-surface rounded px-1.5 py-0.5">
                        meaning: {check.anyOf.join(" or ")}
                      </span>
                    ))}
                    {(q.mustNotContain ?? []).map((p) => (
                      <span key={p} className="text-micro font-mono text-ink-muted bg-surface rounded px-1.5 py-0.5 line-through">
                        not: {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results — or placeholder if none */}
        {data ? (
          <section>
            <div className="flex gap-6 mb-6">
              <Stat label="Passed" value={`${data.summary.passed}/${data.summary.total}`} />
              <Stat label="Score" value={`${data.summary.pct}%`} />
              <Stat
                label="Run at"
                value={new Date(data.runAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
            </div>
            <p className="text-sm text-ink-muted mb-6">
              Tested against{" "}
              <a href={data.baseUrl} target="_blank" rel="noreferrer noopener" className="link">
                {data.baseUrl.replace("https://", "")}
              </a>
            </p>
            <div className="space-y-3">
              {data.results.map((r) => (
                <details
                  key={r.id}
                  className="rounded-xl border border-ink/[0.07] overflow-hidden"
                >
                  <summary className="flex cursor-pointer items-start justify-between gap-3 p-4 hover:bg-ink/[0.02]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-mono text-micro ${r.pass ? "text-signal" : "text-red-600 dark:text-red-400"}`}>
                          {r.pass ? "PASS" : "FAIL"}
                        </span>
                        <span className="text-micro font-mono text-ink-muted">{r.durationMs}ms</span>
                      </div>
                      <p className="text-sm font-medium text-ink">{r.question}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{r.description}</p>
                    </div>
                  </summary>
                  <div className="border-t border-ink/[0.07] p-4 space-y-3 bg-surface/30">
                    <div>
                      <p className="text-xs text-ink-muted mb-1 uppercase tracking-wider">Response</p>
                      <p className="text-sm text-ink-muted leading-relaxed">{r.response}</p>
                    </div>
                    {r.sources.filter((s) => s.url.startsWith("http")).length > 0 && (
                      <div>
                        <p className="text-xs text-ink-muted mb-1 uppercase tracking-wider">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {r.sources
                            .filter((s) => s.url.startsWith("http"))
                            .map((s) => (
                              <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener" className="link text-xs">
                                {s.title}
                              </a>
                            ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-ink-muted mb-1 uppercase tracking-wider">Checks</p>
                      <ul className="space-y-1">
                        {r.checks.map((c) => (
                          <li key={c.label} className="flex items-start gap-2 text-xs">
                            <span className={`font-mono ${c.pass ? "text-signal" : "text-red-600 dark:text-red-400"}`}>
                              {c.pass ? "✓" : "✗"}
                            </span>
                            <span className="font-mono text-ink-muted">{c.label}</span>
                            {c.detail && <span className="text-ink-faint">{c.detail}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-ink/[0.07] bg-surface/40 p-8 text-center">
            <p className="text-base font-medium text-ink mb-2">
              Results will appear after the first run against a live deployment.
            </p>
            <p className="text-sm text-ink-muted">
              Once the eval suite runs and{" "}
              <code className="font-mono text-micro bg-surface rounded px-1.5 py-0.5">evals/results.json</code>{" "}
              is committed, scores appear here automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
