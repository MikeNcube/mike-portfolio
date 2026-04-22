import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/content";

type Props = {
  project: Project;
  prev: Project;
  next: Project;
};

const DEFAULT_ARCH = "/architecture-placeholder.svg";
const DEFAULT_SHOT = "/demo-placeholder.svg";

export default function ProjectDetail({ project, prev, next }: Props) {
  const systemOverview = project.systemOverview ?? project.approach;
  const architecture = project.architectureImage ?? DEFAULT_ARCH;
  const screenshots =
    project.screenshots && project.screenshots.length > 0
      ? project.screenshots
      : [{ src: DEFAULT_SHOT, caption: "Demo preview · placeholder" }];

  const engineeringDecisions =
    project.engineeringDecisions && project.engineeringDecisions.length > 0
      ? project.engineeringDecisions
      : [
          "Typed contracts at the edges — validation, not vibes.",
          "Idempotent steps so retries and replays are safe by default.",
          "Structured logs with trace IDs across services and LLM calls.",
        ];

  return (
    <article className="pt-28 sm:pt-32">
      <div className="container-edge">
        <div className="mb-10 flex items-center justify-between gap-3 text-[12px] text-ink-400">
          <Link
            href="/#flagship"
            className="group inline-flex items-center gap-2 text-ink-300 transition hover:text-white"
          >
            <span
              aria-hidden
              className="transition group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Back to portfolio
          </Link>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-ink-300">{project.domain}</span>
            <span className="h-3 w-px bg-white/15" />
            <span>{project.year}</span>
          </div>
        </div>

        <header className="flex flex-col gap-5">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Case study
          </span>
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
            <MetaRow label="Role" value={project.role} />
            <MetaRow label="Domain" value={project.domain} />
            <MetaRow label="Year" value={project.year} />

            <div className="h-px w-full bg-white/10" />

            <LinkRow
              label="Demo"
              href={project.demoUrl}
              fallback="Coming soon"
            />
            <LinkRow
              label="Repo"
              href={project.repoUrl}
              fallback="Private · available on request"
            />

            <div className="h-px w-full bg-white/10" />

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
          </div>
        </aside>

        <div className="flex flex-col gap-14">
          <Section title="Problem">
            <p>{project.problem}</p>
          </Section>

          <Section title="System Overview">
            <p>{systemOverview}</p>
          </Section>

          <Section title="Architecture">
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="relative aspect-[12/7] w-full">
                <Image
                  src={architecture}
                  alt={`${project.name} — architecture diagram`}
                  fill
                  sizes="(min-width: 1024px) 820px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-white/10 px-4 py-3 font-mono text-[11px] text-ink-400">
                Architecture overview · swap with project-specific diagram
                under <code className="text-ink-200">/public</code>.
              </figcaption>
            </figure>
          </Section>

          <Section title="Key Engineering Decisions">
            <ol className="flex flex-col gap-3">
              {engineeringDecisions.map((d, i) => (
                <li
                  key={i}
                  className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] font-mono text-[12px] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-ink-100">
                    {d}
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Tech Stack">
            <ul className="flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Screenshots">
            <div className="grid gap-5 sm:grid-cols-2">
              {screenshots.map((s, i) => (
                <figure
                  key={i}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                >
                  <div className="relative aspect-[12/7] w-full">
                    <Image
                      src={s.src}
                      alt={s.caption}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="border-t border-white/10 px-4 py-3 font-mono text-[11px] text-ink-400">
                    {s.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-8">
            <div className="mono mb-2 uppercase tracking-[0.18em] text-accent">
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

function LinkRow({
  label,
  href,
  fallback,
}: {
  label: string;
  href?: string;
  fallback: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mono uppercase tracking-[0.18em]">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-2 text-[14px] text-white transition hover:text-accent"
        >
          Open
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            ↗
          </span>
        </a>
      ) : (
        <span className="text-[14px] text-ink-300">{fallback}</span>
      )}
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
      <span className="font-display text-[16.5px] font-semibold tracking-tight text-white transition group-hover:text-accent">
        {isNext ? "→ " : "← "}
        {project.name}
      </span>
      <span className="line-clamp-2 text-[13px] text-ink-300">
        {project.tagline}
      </span>
    </Link>
  );
}
