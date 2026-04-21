import type { Project } from "@/lib/content";

type Props = {
  project: Project;
  variant?: "flagship" | "default" | "compact";
  index?: number;
};

export default function ProjectCard({
  project,
  variant = "default",
  index,
}: Props) {
  if (variant === "flagship") {
    return (
      <article className="card-lg shimmer-border group overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="flex w-full flex-col gap-5 lg:w-[58%]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-ink-400">
                {String((index ?? 0) + 1).padStart(2, "0")} / Flagship
              </span>
              <span className="h-px flex-1 bg-white/10" />
              <span className="font-mono text-[11px] text-ink-400">
                {project.year}
              </span>
            </div>

            <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[28px] text-balance">
              {project.name}
            </h3>

            <p className="text-[15.5px] leading-relaxed text-ink-200 text-pretty">
              {project.tagline}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <Block label="Problem" body={project.problem} />
              <Block label="Approach" body={project.approach} />
              <Block label="Outcome" body={project.outcome} />
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 border-white/10 lg:w-[42%] lg:border-l lg:pl-10">
            <Meta label="Domain" value={project.domain} />
            <Meta label="Role" value={project.role} />
            <div>
              <div className="mono mb-2 uppercase tracking-[0.18em]">
                System signals
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {project.signals.map((s) => (
                  <li key={s} className="chip-accent">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mono mb-2 uppercase tracking-[0.18em]">
                Stack
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="card group">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-display text-[17px] font-semibold leading-snug tracking-tight text-white">
            {project.name}
          </h4>
          <span className="font-mono text-[11px] text-ink-400">
            {project.year}
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-300">
          {project.tagline}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="card group flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="mono uppercase tracking-[0.18em] text-ink-400">
          {project.domain}
        </span>
        <span className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[11px] text-ink-400">
          {project.year}
        </span>
      </div>
      <h3 className="font-display text-[20px] font-semibold leading-snug tracking-tight text-white text-balance">
        {project.name}
      </h3>
      <p className="text-[14.5px] leading-relaxed text-ink-200 text-pretty">
        {project.tagline}
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <p className="text-[13.5px] leading-relaxed text-ink-300">
          <span className="text-ink-100">Approach · </span>
          {project.approach}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {project.signals.slice(0, 3).map((s) => (
            <span key={s} className="chip-accent">
              {s}
            </span>
          ))}
          {project.stack.slice(0, 3).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
      <div className="mono mb-1.5 uppercase tracking-[0.18em]">{label}</div>
      <p className="text-[13.5px] leading-relaxed text-ink-200">{body}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-3">
      <span className="mono uppercase tracking-[0.18em]">{label}</span>
      <span className="text-right text-[13.5px] text-white">{value}</span>
    </div>
  );
}
