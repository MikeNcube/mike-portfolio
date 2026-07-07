import Link from "next/link";
import type { Project } from "@/lib/content";
import StatusBadge from "./StatusBadge";

type Props = {
  project: Project;
  variant?: "flagship" | "compact";
  index?: number;
};

export default function ProjectCard({
  project,
  variant = "flagship",
  index,
}: Props) {
  const caseStudyHref = `/projects/${project.slug}`;

  if (variant === "compact") {
    return (
      <article className="card flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[17px] font-semibold leading-snug tracking-tight text-white">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-[14px] leading-relaxed text-ink-300">
          {project.tagline}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.stack.slice(0, 5).map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white underline-offset-4 transition hover:text-signal hover:underline"
            >
              GitHub repo ↗
            </a>
          )}
          <Link
            href={caseStudyHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-300 underline-offset-4 transition hover:text-white hover:underline"
          >
            Case study →
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="card-lg flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11.5px] text-ink-400">
          {String((index ?? 0) + 1).padStart(2, "0")}
        </span>
        <StatusBadge status={project.status} />
        <span className="font-mono text-[11.5px] text-ink-400">
          {project.domain}
        </span>
        <span className="h-px flex-1 bg-white/10" aria-hidden />
        <span className="font-mono text-[11.5px] text-ink-400">
          {project.year}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[27px] text-balance">
          {project.name}
        </h3>
        <p className="max-w-3xl text-[15.5px] leading-relaxed text-ink-200 text-pretty">
          {project.tagline}
        </p>
      </div>

      <dl className="grid gap-4 lg:grid-cols-3">
        <Block label="Problem" body={project.problem} />
        <Block label="What I built" body={project.built} />
        <Block label="Outcome" body={project.outcome} />
      </dl>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.stack.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        {project.repoUrl ? (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-primary"
          >
            GitHub repo ↗
          </a>
        ) : (
          <span className="text-[13.5px] text-ink-300">
            Private client work — code available to discuss in interview.
          </span>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} className="btn-ghost">
            {project.demoLabel ?? "Live demo"}
          </a>
        )}
        <Link href={caseStudyHref} className="btn-ghost">
          Case study →
        </Link>
      </div>
    </article>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
      <dt className="mono mb-1.5 uppercase tracking-[0.18em]">{label}</dt>
      <dd className="text-[13.5px] leading-relaxed text-ink-200">{body}</dd>
    </div>
  );
}
