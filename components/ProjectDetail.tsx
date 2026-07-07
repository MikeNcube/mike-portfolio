import Link from "next/link";
import type { Project } from "@/lib/content";
import StatusBadge from "./StatusBadge";

type Props = {
  project: Project;
  prev: Project;
  next: Project;
};

export default function ProjectDetail({ project, prev, next }: Props) {
  const systemOverview = project.systemOverview ?? project.built;

  return (
    <article className="pt-28 sm:pt-32">
      <div className="container-edge">
        <div className="mb-10 flex items-center justify-between gap-3 text-[12px] text-ink-400">
          <Link
            href="/#work"
            className="group inline-flex items-center gap-2 text-ink-300 transition hover:text-white"
          >
            <span aria-hidden className="transition group-hover:-translate-x-0.5">
              ←
            </span>
            Back to portfolio
          </Link>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-ink-300">{project.domain}</span>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <span>{project.year}</span>
          </div>
        </div>

        <header className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Case study
            </span>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="font-display text-display-lg tracking-tightest text-white text-balance">
            {project.name}
          </h1>
          <p className="max-w-3xl text-[17px] leading-relaxed text-ink-200 text-pretty">
            {project.tagline}
          </p>
        </header>
      </div>

      <div className="container-edge mt-14 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card-lg flex flex-col gap-5">
            <MetaRow label="Status" value={project.status} />
            <MetaRow label="Domain" value={project.domain} />
            <MetaRow label="Year" value={project.year} />

            <div className="h-px w-full bg-white/10" aria-hidden />

            <div className="flex flex-col gap-1">
              <span className="mono uppercase tracking-[0.18em]">Repo</span>
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-2 text-[14px] text-white transition hover:text-signal"
                >
                  Open on GitHub
                  <span aria-hidden className="transition group-hover:translate-x-0.5">
                    ↗
                  </span>
                </a>
              ) : (
                <span className="text-[14px] text-ink-300">
                  Private client work — happy to walk through it in interview.
                </span>
              )}
            </div>

            {project.demoUrl && (
              <div className="flex flex-col gap-1">
                <span className="mono uppercase tracking-[0.18em]">Demo</span>
                <a
                  href={project.demoUrl}
                  className="group inline-flex items-center gap-2 text-[14px] text-white transition hover:text-signal"
                >
                  {project.demoLabel ?? "Open demo"}
                  <span aria-hidden className="transition group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              </div>
            )}

            <div className="h-px w-full bg-white/10" aria-hidden />

            <div>
              <div className="mono mb-2 uppercase tracking-[0.18em]">Stack</div>
              <ul className="flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-14">
          <Section title="Problem">
            <p>{project.problem}</p>
          </Section>

          <Section title="What I built">
            <p>{systemOverview}</p>
          </Section>

          {project.engineeringDecisions &&
            project.engineeringDecisions.length > 0 && (
              <Section title="Key engineering decisions">
                <ol className="flex flex-col gap-3">
                  {project.engineeringDecisions.map((d, i) => (
                    <li
                      key={i}
                      className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] font-mono text-[12px] text-ink-200"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[14.5px] leading-relaxed text-ink-100">
                        {d}
                      </p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="mono mb-2 uppercase tracking-[0.18em] text-signal">
              Outcome
            </div>
            <p className="text-[15.5px] leading-relaxed text-ink-100">
              {project.outcome}
            </p>
          </div>
        </div>
      </div>

      <div className="container-edge mt-20 border-t border-white/10 pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <NeighbourLink direction="prev" project={prev} />
          <NeighbourLink direction="next" project={next} />
        </div>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-display-md tracking-tightest text-white">
        {title}
      </h2>
      <div className="max-w-none text-[15.5px] leading-relaxed text-ink-200 text-pretty">
        {children}
      </div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mono uppercase tracking-[0.18em]">{label}</span>
      <span className="text-[14px] text-white">{value}</span>
    </div>
  );
}

function NeighbourLink({
  direction,
  project,
}: {
  direction: "prev" | "next";
  project: Project;
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={[
        "group card flex flex-col gap-2",
        isNext ? "sm:col-start-2 sm:text-right" : "",
      ].join(" ")}
    >
      <span className="mono uppercase tracking-[0.18em]">
        {isNext ? "Next" : "Previous"}
      </span>
      <span className="font-display text-[16.5px] font-semibold tracking-tight text-white transition group-hover:text-signal">
        {isNext ? "→ " : "← "}
        {project.name}
      </span>
      <span className="line-clamp-2 text-[13px] text-ink-300">
        {project.tagline}
      </span>
    </Link>
  );
}
