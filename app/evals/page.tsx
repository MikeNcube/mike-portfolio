import type { Metadata } from "next";
import results from "@/evals/results.json";

export const metadata: Metadata = {
  title: "Eval results",
  description: "Portfolio RAG assistant evaluation results — answer correctness, citation, refusal, and prompt-injection tests.",
};

type Check = { label: string; pass: boolean; detail?: string };
type EvalResult = {
  id: string;
  question: string;
  description: string;
  pass: boolean;
  response: string;
  sources: Array<{ title: string; url: string }>;
  checks: Check[];
  durationMs: number;
};

export default function EvalsPage() {
  const data = results as {
    runAt: string;
    baseUrl: string;
    summary: { passed: number; total: number; pct: number };
    results: EvalResult[];
    note?: string;
  };

  return (
    <main className="pt-24 pb-20">
      <div className="container-edge max-w-3xl">
        <div className="mb-10">
          <p className="text-sm text-ink/40 uppercase tracking-widest mb-3 font-mono">Eval results</p>
          <h1
            className="font-display-section font-medium text-ink mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.025em" }}
          >
            RAG assistant evaluation
          </h1>

          {/* Summary */}
          <div className="flex gap-6 mt-6 mb-6">
            <Stat label="Passed" value={`${data.summary.passed}/${data.summary.total}`} />
            <Stat label="Score" value={`${data.summary.pct}%`} />
            <Stat label="Run at" value={new Date(data.runAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
          </div>

          <p className="text-sm text-ink/40">
            Tested against{" "}
            <a href={data.baseUrl} target="_blank" rel="noreferrer noopener" className="link">
              {data.baseUrl.replace("https://", "")}
            </a>
            {data.note && <> · {data.note}</>}
          </p>
        </div>

        {/* Eval categories */}
        <div className="mb-4 text-sm text-ink/50">
          <span className="mr-6">Tests: answer correctness · citation · out-of-scope refusals · prompt injection</span>
        </div>

        {/* Results list */}
        <div className="space-y-4">
          {data.results.map((r) => (
            <details
              key={r.id}
              className="rounded-xl border border-ink/[0.08] overflow-hidden"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-3 p-4 hover:bg-ink/[0.02]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-mono text-micro ${r.pass ? "text-signal" : "text-red-500"}`}>
                      {r.pass ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-micro font-mono text-ink/30">{r.durationMs}ms</span>
                  </div>
                  <p className="text-sm font-medium text-ink">{r.question}</p>
                  <p className="text-xs text-ink/40 mt-0.5">{r.description}</p>
                </div>
              </summary>

              <div className="border-t border-ink/[0.07] p-4 space-y-3 bg-surface/30">
                {/* Response */}
                <div>
                  <p className="text-xs text-ink/35 mb-1 font-mono uppercase tracking-wider">Response</p>
                  <p className="text-sm text-ink/70 leading-relaxed">{r.response}</p>
                </div>

                {/* Sources */}
                {r.sources.filter((s) => s.url.startsWith("http")).length > 0 && (
                  <div>
                    <p className="text-xs text-ink/35 mb-1 font-mono uppercase tracking-wider">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {r.sources.filter((s) => s.url.startsWith("http")).map((s) => (
                        <a
                          key={s.url}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="link text-xs"
                        >
                          {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checks */}
                <div>
                  <p className="text-xs text-ink/35 mb-2 font-mono uppercase tracking-wider">Checks</p>
                  <ul className="space-y-1">
                    {r.checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2 text-xs">
                        <span className={`font-mono ${c.pass ? "text-signal" : "text-red-500"}`}>
                          {c.pass ? "✓" : "✗"}
                        </span>
                        <span className="font-mono text-ink/50">{c.label}</span>
                        {c.detail && <span className="text-ink/35">{c.detail}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-ink/[0.07] text-sm text-ink/40">
          <p>
            Run these evals yourself:{" "}
            <code className="font-mono text-xs bg-surface rounded px-1.5 py-0.5">
              GEMINI_API_KEY=... npx tsx evals/run.ts --url https://your-url.vercel.app
            </code>
          </p>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/35 font-mono uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
