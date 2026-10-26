import Link from "next/link";
import type { Project } from "@/lib/content";
import RagDiagram from "./diagrams/RagDiagram";
import SitewardenDiagram from "./diagrams/SitewardenDiagram";
import CubeDiagram from "./diagrams/CubeDiagram";
import CrmDiagram from "./diagrams/CrmDiagram";
import ClaimsDiagram from "./diagrams/ClaimsDiagram";
import DigiFormDiagram from "./diagrams/DigiFormDiagram";
import SentinelDiagram from "./diagrams/SentinelDiagram";

const DIAGRAMS: Partial<Record<string, React.ReactNode>> = {
  "portfolio-rag-assistant": <RagDiagram />,
  "sitewarden":              <SitewardenDiagram />,
  "cube-agent":              <CubeDiagram />,
  "zororo-crm":              <CrmDiagram />,
  "claims-pipeline":         <ClaimsDiagram />,
  "digi-app-form":           <DigiFormDiagram />,
  "proactive-sentinel":      <SentinelDiagram />,
};

type Props = { project: Project; prev: Project; next: Project };

// All opacity-based text colors replaced with semantic tokens
// to ensure WCAG AA across light and dark modes:
//   text-ink-muted = #6B6258 light (5.2:1) / #A0988F dark (7.0:1)
//   text-ink-faint = #716860 light (4.9:1) / #8F877E dark (5.9:1)

function statusColor(status: Project["status"]): string {
  switch (status) {
    case "Live demo":  return "text-signal";
    case "Shipped":    return "text-signal";
    case "Prototype":  return "text-accent";
    case "Built":      return "text-accent";
    case "Paused":     return "text-ink-muted";
    case "Reference":  return "text-ink-muted";
    case "Lab":        return "text-ink-muted";
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
        <div className="mb-10 flex items-center justify-between text-sm text-ink-muted">
          <Link
            href="/#work"
            className="group inline-flex items-center gap-1.5 transition hover:text-ink"
          >
            <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span>
            Back to work
          </Link>
          <span className="text-ink-faint">{project.year}</span>
        </div>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className={`font-mono text-sm ${statusColor(project.status)}`}>
              {project.status}
            </span>
            <span className="text-ink-faint" aria-hidden>·</span>
            <span className="text-sm text-ink-muted">{project.domain}</span>
          </div>
          <h1
            className="font-display-hero font-medium text-ink text-balance mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.07, letterSpacing: "-0.03em" }}
          >
            {project.name}
          </h1>
          <p className="text-base text-ink-muted">{project.role}</p>
          <p className="mt-3 text-lg text-ink-muted max-w-2xl text-pretty leading-[1.55]">
            {project.tagline}
          </p>
        </header>

        {/* Main content */}
        <div className="grid gap-10 lg:grid-cols-[200px_1fr] lg:items-start">

          {/* Sidebar — dl contains only dt/dd groups; links sit outside */}
          <aside className="lg:sticky lg:top-20">
            <div className="rounded-xl border border-ink/[0.08] p-5 space-y-4 text-sm">
              <dl className="space-y-4">
                <Row label="Status" value={project.status} />
                <Row label="Domain" value={project.domain} />
                <Row label="Year" value={project.year} />
                <div>
                  <dt className="text-sm text-ink-muted mb-1">Stack</dt>
                  <dd className="text-ink-muted leading-relaxed">
                    {project.stack.join(" · ")}
                  </dd>
                </div>
              </dl>

              <div className="pt-3 border-t border-ink/[0.07] space-y-2">
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
                  <p className="text-sm text-ink-muted">
                    Private codebase. Architecture walk-through in interview.
                  </p>
                )}
                {project.demoUrl && (
                  <div>
                    <a href={project.demoUrl} className="link text-sm">
                      {project.demoLabel ?? "Live demo"}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Body — diagrams use the full 1fr column so 14px labels never scale down */}
          <div className="min-w-0 space-y-10">
            {DIAGRAMS[project.slug] && (
              <section>
                <h2
                  className="font-display-section font-medium text-ink mb-4"
                  style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", letterSpacing: "-0.02em" }}
                >
                  Architecture
                </h2>
                <div className="overflow-visible rounded-xl border border-ink/[0.07] bg-surface/40 p-4 sm:p-6">
                  {DIAGRAMS[project.slug]}
                </div>
              </section>
            )}

            <div className="max-w-2xl space-y-10">
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
                      <li key={i} className="flex gap-3 text-sm text-ink-muted leading-relaxed">
                        <span className="font-mono text-micro text-ink-faint mt-1 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p>{d}</p>
                      </li>
                    ))}
                  </ol>
                </ContentSection>
              )}

              <div className="rounded-xl border border-ink/[0.07] bg-surface/40 p-5">
                <p className="text-xs text-ink-muted mb-2 uppercase tracking-wider">Outcome</p>
                <p className="text-base text-ink">{project.outcome}</p>
              </div>
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
            <p className="text-xs text-ink-muted mb-1 uppercase tracking-wider">Previous</p>
            <p className="text-base font-medium text-ink group-hover:text-accent transition-colors">
              ← {prev.name}
            </p>
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="group rounded-xl border border-ink/[0.08] p-5 transition hover:border-ink/[0.15] sm:text-right"
          >
            <p className="text-xs text-ink-muted mb-1 uppercase tracking-wider">Next</p>
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
      <dt className="text-xs text-ink-muted mb-0.5 uppercase tracking-wider">{label}</dt>
      <dd className="text-ink text-sm">{value}</dd>
    </div>
  );
}

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="font-display-section font-medium text-ink mb-4"
        style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <div className="text-base text-ink-muted leading-relaxed text-pretty">{children}</div>
    </section>
  );
}
