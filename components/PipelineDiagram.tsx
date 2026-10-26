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
      {/* Steps — flex row, compact enough for ~360px screens */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {STEPS.map((step, i) => {
          const isActive    = activeStep === i;
          const isCompleted = activeStep !== null && i < activeStep;
          const isPending   = activeStep !== null && i > activeStep;

          return (
            <div key={step.id} className="flex items-center shrink-0">
              {/* Node */}
              <div
                className={[
                  "px-2.5 py-2 rounded-lg border text-center transition-all duration-300",
                  isActive
                    ? "border-accent bg-accent text-page shadow-sm"
                    : isCompleted
                    ? "border-ink/[0.08] bg-surface/80 text-ink-muted"
                    : isPending
                    ? "border-ink/[0.05] bg-transparent text-ink-faint"
                    : "border-ink/[0.07] bg-transparent text-ink-muted",
                ].join(" ")}
                style={{ minWidth: 60 }}
              >
                <p className={[
                  "text-[0.7rem] font-semibold tracking-tight leading-none",
                  isActive ? "text-page" : "",
                ].join(" ")}>
                  {step.label}
                </p>
                <p className={[
                  "text-[0.625rem] font-mono mt-0.5 leading-none",
                  isActive ? "text-page/70" : "text-ink-faint",
                ].join(" ")}>
                  {step.sub}
                </p>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div className="px-1 shrink-0">
                  <svg
                    width="16"
                    height="8"
                    viewBox="0 0 16 8"
                    aria-hidden
                    className={[
                      "transition-colors duration-300",
                      isCompleted ? "text-accent/50" : "text-ink/15",
                    ].join(" ")}
                  >
                    <line x1="0" y1="4" x2="11" y2="4" stroke="currentColor" strokeWidth="1.25" />
                    <polyline points="8,1 11,4 8,7" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retrieved chunk labels — visible after retrieve step */}
      {chunks && chunks.length > 0 && activeStep !== null && activeStep >= 2 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite" aria-label="Retrieved chunks">
          {chunks.map((c) => (
            <span
              key={c.title}
              className="rounded border border-ink/[0.07] bg-surface/60 px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-muted"
            >
              {c.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
