import Link from "next/link";
import {
  flagshipProjects,
  PRODUCTION_SLUGS,
  WORK_ORDER,
  statusLabel,
  type Project,
} from "@/lib/content";

function statusClass(status: Project["status"]): string {
  switch (status) {
    case "Live demo":            return "text-signal";
    case "Shipped":              return "text-signal";
    case "Rolling out":          return "text-signal";
    case "Approved · standby":   return "text-accent";
    case "Prototype":            return "text-accent";
    case "Built":                return "text-accent";
    case "Paused":       return "text-ink-muted";
    case "Reference":    return "text-ink-muted";
    case "Lab":          return "text-ink-muted";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

const PRODUCTION = new Set<string>(PRODUCTION_SLUGS);

function projectsFor(slugs: readonly string[]): Project[] {
  return slugs
    .map((slug) => flagshipProjects.find((p) => p.slug === slug))
    .filter((p): p is Project => p !== undefined);
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <div
      role="listitem"
      className="group border-b border-ink/[0.07] py-4"
    >
      <div className="flex items-baseline gap-4 sm:gap-6">
        <span
          className="font-mono text-micro text-ink-faint shrink-0 w-14 sm:w-16"
          aria-label={`Year: ${project.year}`}
        >
          {project.year}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <Link
              href={`/projects/${project.slug}`}
              className="text-base font-semibold text-ink tracking-tight hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              {project.name}
            </Link>
            <span className={`font-mono text-micro ${statusClass(project.status)}`}>
              {statusLabel(project.status)}
            </span>
            {project.privateRepo && (
              <span className="font-mono text-micro text-ink-muted sm:hidden">Private repo</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-muted text-pretty">
            {project.tagline.split(/\./)[0]}.
          </p>
          <p className="mt-0.5 text-micro font-mono text-ink-faint">
            {project.stack.slice(0, 4).join(" · ")}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {project.privateRepo ? (
            <span className="text-sm text-ink-muted">Private repo</span>
          ) : project.repoUrl ? (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm text-accent link"
            >
              GitHub
            </a>
          ) : null}
          <Link
            href={`/projects/${project.slug}`}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Case study
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Work() {
  const production = projectsFor(PRODUCTION_SLUGS);
  const other = projectsFor(WORK_ORDER.filter((slug) => !PRODUCTION.has(slug)));

  return (
    <section id="work" className="section">
      <div className="container-edge">
        <div className="mb-10">
          <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">Work</p>
          <h2
            className="font-display-section font-medium text-ink mb-3"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.025em" }}
          >
            Selected projects.
          </h2>
          <p className="text-base text-ink-muted max-w-[520px]">
            Production systems first, then demos and prototypes. Each links to a case study.
          </p>
        </div>

        <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">
          Production systems
        </p>
        <div role="list" className="border-t border-ink/[0.07] mb-10">
          {production.map((p) => (
            <ProjectRow key={p.slug} project={p} />
          ))}
        </div>

        <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">
          More work
        </p>
        <div role="list" className="border-t border-ink/[0.07]">
          {other.map((p) => (
            <ProjectRow key={p.slug} project={p} />
          ))}
        </div>

        <p className="mt-8 text-sm text-ink-muted">
          Reference work and labs at{" "}
          <a
            href="https://github.com/MikeNcube"
            target="_blank"
            rel="noreferrer noopener"
            className="link"
          >
            github.com/MikeNcube
          </a>
          .
        </p>
      </div>
    </section>
  );
}
