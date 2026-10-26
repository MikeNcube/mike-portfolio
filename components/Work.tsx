import Link from "next/link";
import { flagshipProjects, type Project } from "@/lib/content";

const WORK_ORDER = [
  "portfolio-rag-assistant",
  "sitewarden",
  "cube-agent",
  "zororo-crm",
  "claims-pipeline",
  "digi-app-form",
  "proactive-sentinel",
];

function statusLabel(status: Project["status"]): string {
  switch (status) {
    case "Live demo":  return "live";
    case "Shipped":    return "shipped";
    case "Prototype":  return "prototype";
    case "Paused":     return "paused";
    case "Built":      return "built";
    case "Reference":  return "reference";
    case "Lab":        return "lab";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusClass(status: Project["status"]): string {
  switch (status) {
    case "Live demo": return "text-signal";
    case "Shipped":   return "text-signal";
    case "Prototype": return "text-accent";
    case "Built":     return "text-accent";
    case "Paused":    return "text-ink-muted";
    case "Reference": return "text-ink-muted";
    case "Lab":       return "text-ink-muted";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default function Work() {
  const projects = WORK_ORDER.map((slug) =>
    flagshipProjects.find((p) => p.slug === slug),
  ).filter((p): p is Project => p !== undefined);

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
            Production systems, prototypes, and demos. Each links to a case study with architecture notes.
          </p>
        </div>

        <div role="list">
          {projects.map((p) => (
            <div
              key={p.slug}
              role="listitem"
              className="group border-b border-ink/[0.07] py-4 first:border-t first:border-ink/[0.07]"
            >
              {/* Main row */}
              <div className="flex items-baseline gap-4 sm:gap-6">
                {/* Year — supplemental, smaller */}
                <span
                  className="font-mono text-micro text-ink-faint shrink-0 w-14 sm:w-16"
                  aria-label={`Year: ${p.year}`}
                >
                  {p.year}
                </span>

                {/* Name + status + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <Link
                      href={`/projects/${p.slug}`}
                      className="text-base font-semibold text-ink tracking-tight hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                    >
                      {p.name}
                    </Link>
                    <span className={`font-mono text-micro ${statusClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted text-pretty">
                    {/* First sentence only */}
                    {p.tagline.split(/\./)[0]}.
                  </p>
                  {/* Stack — faint supplemental */}
                  <p className="mt-0.5 text-micro font-mono text-ink-faint">
                    {p.stack.slice(0, 4).join(" · ")}
                  </p>
                </div>

                {/* Link(s) — desktop right */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  {p.repoUrl && (
                    <a
                      href={p.repoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-accent link"
                    >
                      GitHub
                    </a>
                  )}
                  <Link
                    href={`/projects/${p.slug}`}
                    className="text-sm text-ink-muted hover:text-ink transition-colors"
                  >
                    Case study
                  </Link>
                </div>
              </div>
            </div>
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
