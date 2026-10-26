import Link from "next/link";
import type { Project } from "@/lib/content";

type Props = {
  project: Project;
  prev: Project;
  next: Project;
};

function statusColor(status: Project["status"]): string {
  switch (status) {
    case "Live demo": return "text-signal";
    case "Shipped":   return "text-signal";
    case "Prototype": return "text-accent";
    case "Built":     return "text-accent";
    case "Paused":    return "text-ink/50";
    case "Reference": return "text-ink/50";
    case "Lab":       return "text-ink/50";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default function ProjectDetail({ project, prev, next }: Props) {
  const systemOverview = project.systemOverview ?? project.built;

  return (
    <article className="pt-24 sm:pt-32 pb-20">
      <div className="container-edge">
        {/* Breadcrumb */}
        <div className="mb-10 flex items-center justify-between text-sm text-ink/40">
          <Link
            href="/#work"
            className="group inline-flex items-center gap-1.5 transition hover:text-ink"
          >
            <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span>
            Back to work
          </Link>
          <span className="font-mono text-micro">{project.year}</span>
        </div>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className={`font-mono text-sm ${statusColor(project.status)}`}>
              {project.status}
            </span>
            <span className="text-ink/20">·</span>
            <span className="text-sm text-ink/40">{project.domain}</span>
          </div>
          <h1
            className="font-display-hero font-medium text-ink text-balance mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.07, letterSpacing: "-0.03em" }}
          >
            {project.name}
          </h1>
          <p className="text-base text-ink/55">{project.role}</p>
          <p className="mt-3 text-lg text-ink/70 max-w-2xl text-pretty leading-[1.55]">{project.tagline}</p>
        </header>

        {/* Main content */}
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:items-start">

          {/* Sidebar metadata */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-ink/[0.08] p-5 space-y-4 text-sm">
              <Row label="Status" value={project.status} />
              <Row label="Domain" value={project.domain} />
              <Row label="Year" value={project.year} />

              <div className="pt-3 border-t border-ink/[0.07]">
                {project.repoUrl ? (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link text-sm"
                  >
                    View on GitHub
                  </a>
                ) : (
                  <p className="text-ink/40">Private codebase — architecture walk-through in interview.</p>
                )}
              </div>

              {project.demoUrl && (
                <div className="pt-2">
                  <a href={project.demoUrl} className="link text-sm">
                    {project.demoLabel ?? "Live demo"}
                  </a>
                </div>
              )}

              <div className="pt-3 border-t border-ink/[0.07]">
                <p className="text-xs text-ink/35 mb-2 uppercase tracking-wider font-mono">Stack</p>
                <p className="text-ink/60 text-sm leading-relaxed">{project.stack.join(" · ")}</p>
              </div>
            </div>
          </aside>

          {/* Body */}
          <div className="space-y-10 max-w-2xl">
            <ContentSection title="Problem">
              <p>{project.problem}</p>
            </ContentSection>

            <ContentSection title="What I built">
              <p>{systemOverview}</p>
            </ContentSection>

            {project.engineeringDecisions && project.engineeringDecisions.length > 0 && (
              <ContentSection title="Engineering decisions">
                <ol className="space-y-3">
                  {project.engineeringDecisions.map((d, i) => (
                    <li key={i} className="flex gap-3 text-sm text-ink/65 leading-relaxed">
                      <span className="font-mono text-micro text-ink/30 mt-1 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p>{d}</p>
                    </li>
                  ))}
                </ol>
              </ContentSection>
            )}

            <div className="rounded-xl border border-ink/[0.08] bg-surface/40 p-5">
              <p className="text-xs text-ink/35 mb-2 uppercase tracking-wider font-mono">Outcome</p>
              <p className="text-base text-ink/75">{project.outcome}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Case study navigation"
          className="mt-16 border-t border-ink/[0.07] pt-8 grid gap-4 sm:grid-cols-2"
        >
          <Link
            href={`/projects/${prev.slug}`}
            className="group rounded-xl border border-ink/[0.08] p-5 transition hover:border-ink/[0.15]"
          >
            <p className="text-xs text-ink/35 mb-1 font-mono uppercase tracking-wider">Previous</p>
            <p className="text-base font-medium text-ink group-hover:text-accent transition-colors">
              ← {prev.name}
            </p>
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="group rounded-xl border border-ink/[0.08] p-5 transition hover:border-ink/[0.15] sm:text-right"
          >
            <p className="text-xs text-ink/35 mb-1 font-mono uppercase tracking-wider">Next</p>
            <p className="text-base font-medium text-ink group-hover:text-accent transition-colors">
              {next.name} →
            </p>
          </Link>
        </nav>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/35 mb-0.5 font-mono uppercase tracking-wider">{label}</p>
      <p className="text-ink/70">{value}</p>
    </div>
  );
}

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display-section font-medium text-ink mb-4"
        style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <div className="text-base text-ink/65 leading-relaxed text-pretty">{children}</div>
    </section>
  );
}
