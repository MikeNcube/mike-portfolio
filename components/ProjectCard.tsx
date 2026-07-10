import Link from "next/link";
import type { Project } from "@/lib/content";
import StatusBadge from "./StatusBadge";

type Props = {
  project: Project;
  variant?: "flagship" | "compact" | "summary" | "client";
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
          <h3 className="font-display text-body-lg font-semibold leading-snug tracking-tight text-white">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="font-mono text-micro text-ink-300">{project.role}</p>
        <p className="text-body-sm text-ink-300">
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
              className="inline-flex items-center gap-1.5 text-caption font-medium text-white underline-offset-4 transition hover:text-accent-glow hover:underline"
            >
              GitHub repo ↗
            </a>
          )}
          <Link
            href={caseStudyHref}
            className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-300 underline-offset-4 transition hover:text-white hover:underline"
          >
            Case study →
          </Link>
        </div>
      </article>
    );
  }

  if (variant === "summary" || variant === "client") {
    return (
      <article className="card flex flex-col gap-5">
        <CardHeader project={project} index={index} compact />

        <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
          <p className="mono mb-1.5 uppercase tracking-[0.18em]">Outcome</p>
          <p className="text-body-sm text-ink-200">
            {project.outcome}
          </p>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.stack.slice(0, 6).map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>

        <CardActions project={project} caseStudyHref={caseStudyHref} compact />
      </article>
    );
  }

  return (
    <article className="card-lg flex flex-col gap-6">
      <CardHeader project={project} index={index} />

      <dl className="grid gap-4 lg:grid-cols-3">
        <Block label="Problem" body={project.problem} />
        <Block label="What I built" body={project.built} />
        <Block label="Outcome" body={project.outcome} />
      </dl>

      <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
        {project.stack.map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>

      <CardActions project={project} caseStudyHref={caseStudyHref} />
    </article>
  );
}

function CardHeader({
  project,
  index,
  compact = false,
}: {
  project: Project;
  index?: number;
  compact?: boolean;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {index !== undefined && (
          <span className="font-mono text-micro text-ink-400">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <StatusBadge status={project.status} />
        <span className="font-mono text-micro text-ink-400">
          {project.domain}
        </span>
        <span className="h-px flex-1 bg-white/10" aria-hidden />
        <span className="font-mono text-micro text-ink-400">
          {project.year}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h3
          className={[
            "font-display font-semibold leading-tight tracking-tight text-white text-balance",
            compact ? "text-xl" : "text-2xl sm:text-title-lg",
          ].join(" ")}
        >
          {project.name}
        </h3>
        <p className="font-mono text-micro text-ink-300">{project.role}</p>
        <p className="max-w-3xl text-body text-ink-200 text-pretty">
          {project.tagline}
        </p>
      </div>
    </>
  );
}

function CardActions({
  project,
  caseStudyHref,
  compact = false,
}: {
  project: Project;
  caseStudyHref: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-3",
        compact ? "pt-1" : "border-t border-white/10 pt-5",
      ].join(" ")}
    >
      {project.repoUrl ? (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={compact ? "btn-ghost text-caption" : "btn-primary"}
        >
          GitHub repo ↗
        </a>
      ) : (
        <span className="text-body-sm text-ink-300">
          Private client work — architecture walk-through in interview.
        </span>
      )}
      {project.demoUrl && (
        <a href={project.demoUrl} className="btn-ghost text-caption">
          {project.demoLabel ?? "Live demo"}
        </a>
      )}
      <Link href={caseStudyHref} className="btn-ghost text-caption">
        Full case study →
      </Link>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
      <dt className="mono mb-1.5 uppercase tracking-[0.18em]">{label}</dt>
      <dd className="text-body-sm text-ink-200">{body}</dd>
    </div>
  );
}
