"use client";

export type PipelineStep = 0 | 1 | 2 | 3 | 4 | null;

const STEPS = [
  { id: "embed",    label: "Embed",    sub: "query to vector" },
  { id: "retrieve", label: "Retrieve", sub: "cosine top 6" },
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
      <div className="diagram-flow flex flex-col md:flex-row md:flex-nowrap items-stretch gap-1.5">
        {STEPS.map((step, i) => {
          const isActive    = activeStep === i;
          const isCompleted = activeStep !== null && i < activeStep;
          const isPending   = activeStep !== null && i > activeStep;

          return (
            <div key={step.id} className="flex min-w-0 w-full items-center md:flex-1">
              <div
                className={[
                  "min-w-0 flex-1 rounded-[10px] border px-3 py-2.5 text-center transition-colors duration-300",
                  isActive
                    ? "border-accent bg-accent text-page shadow-sm"
                    : isCompleted
                    ? "border-ink/[0.09] bg-surface text-ink-muted"
                    : isPending
                    ? "border-ink/[0.06] bg-transparent text-ink-faint"
                    : "border-ink/[0.08] bg-surface/50 text-ink-muted",
                ].join(" ")}
              >
                <p
                  className={["diagram-label font-medium leading-snug", isActive ? "text-page" : ""].join(" ")}
                  style={{ fontSize: 14 }}
                >
                  {step.label}
                </p>
                <p
                  className={["diagram-label font-mono mt-0.5 leading-snug", isActive ? "text-page/80" : "text-ink-muted"].join(" ")}
                  style={{ fontSize: 14 }}
                >
                  {step.sub}
                </p>
              </div>

              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="diagram-arrow hidden md:inline-flex px-1 text-ink-faint select-none"
                  style={{ fontSize: 16 }}
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {chunks && chunks.length > 0 && activeStep !== null && activeStep >= 2 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite" aria-label="Retrieved sources">
          {chunks.map((c) => (
            <span
              key={c.title}
              className="diagram-label rounded-md border border-ink/[0.07] bg-surface/70 px-2 py-0.5 text-ink-muted"
              style={{ fontSize: 14 }}
            >
              {c.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
