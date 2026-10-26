"use client";

export type PipelineStep = 0 | 1 | 2 | 3 | 4 | null;

const STEPS = [
  { id: "embed",    label: "Embed",    sub: "query → vector" },
  { id: "retrieve", label: "Retrieve", sub: "cosine top-4" },
  { id: "gate",     label: "Gate",     sub: "score ≥ 0.35" },
  { id: "generate", label: "Generate", sub: "grounded" },
  { id: "cite",     label: "Cite",     sub: "sources" },
] as const;

interface Props {
  activeStep: PipelineStep;
  chunks?: Array<{ title: string }>;
}

export default function PipelineDiagram({ activeStep, chunks }: Props) {
  return (
    <div
      role="img"
      aria-label={
        activeStep !== null
          ? `RAG pipeline: ${STEPS[activeStep].label} in progress`
          : "RAG pipeline: embed, retrieve, gate, generate, cite"
      }
    >
      {/* Steps row — wraps to scroll on very narrow screens */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1 select-none">
        {STEPS.map((step, i) => {
          const isActive    = activeStep === i;
          const isCompleted = activeStep !== null && i < activeStep;
          const isPending   = activeStep !== null && i > activeStep;

          return (
            <div key={step.id} className="flex items-center shrink-0">
              {/* Node */}
              <div
                className={[
                  "px-3 py-2.5 rounded-xl border text-center transition-all duration-300",
                  isActive
                    ? "border-accent bg-accent text-page shadow-sm scale-[1.04]"
                    : isCompleted
                    ? "border-ink/[0.09] bg-surface text-ink-muted"
                    : isPending
                    ? "border-ink/[0.05] bg-transparent text-ink-faint"
                    : "border-ink/[0.08] bg-surface/50 text-ink-muted",
                ].join(" ")}
                style={{ minWidth: 72 }}
              >
                <p className={[
                  "text-[13px] font-semibold tracking-tight leading-none",
                  isActive ? "text-page" : "",
                ].join(" ")}>
                  {step.label}
                </p>
                <p className={[
                  "text-[11px] font-mono mt-1 leading-none",
                  isActive ? "text-page/75" : "text-ink-faint",
                ].join(" ")}>
                  {step.sub}
                </p>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div className="px-1 shrink-0" aria-hidden>
                  <svg
                    width="18"
                    height="10"
                    viewBox="0 0 18 10"
                    className={`transition-colors duration-300 ${isCompleted ? "text-accent/60" : "text-ink/15"}`}
                  >
                    <line x1="0" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" />
                    <polyline points="9,2 12,5 9,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retrieved chunks — visible after retrieve/gate step */}
      {chunks && chunks.length > 0 && activeStep !== null && activeStep >= 2 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite" aria-label="Retrieved sources">
          {chunks.map((c) => (
            <span
              key={c.title}
              className="rounded-md border border-ink/[0.07] bg-surface/70 px-2 py-0.5 font-mono text-[11px] text-ink-muted"
            >
              {c.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
