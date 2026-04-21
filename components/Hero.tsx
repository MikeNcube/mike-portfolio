import { stats } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-grid-dim opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-radial-soft" />

      <div className="container-edge relative">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-2 animate-fade-up">
            <span className="chip-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
              Available for senior AI engineering roles
            </span>
            <span className="chip">
              <span className="font-mono text-[10.5px] text-ink-400">v2025</span>
              Shipping production AI systems
            </span>
          </div>

          <h1
            className="font-display text-display-xl tracking-tightest text-white text-balance animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            AI Engineer building{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-white via-white to-accent/80 bg-clip-text text-transparent">
                agentic systems
              </span>
              <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-accent/60 to-transparent" />
            </span>
            ,<br className="hidden sm:block" />
            LLM workflows, and{" "}
            <span className="bg-gradient-to-r from-white to-ink-200 bg-clip-text text-transparent">
              Python backends
            </span>{" "}
            that ship.
          </h1>

          <p
            className="max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-200 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            I design and ship{" "}
            <span className="text-white">agentic AI systems</span>,{" "}
            <span className="text-white">LLM workflow automation</span>, and{" "}
            <span className="text-white">Python backends</span> (FastAPI /
            Flask) for teams that need reliability, observability, and
            production-grade architecture — not prototypes.
          </p>

          <div
            className="flex flex-wrap items-center gap-3 pt-2 animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <a href="#flagship" className="btn-primary">
              See flagship systems
              <span aria-hidden>↓</span>
            </a>
            <a href="#contact" className="btn-ghost">
              Start a conversation
              <span aria-hidden>→</span>
            </a>
            <span className="ml-1 hidden items-center gap-2 text-[12.5px] text-ink-400 sm:inline-flex">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
              recruiter-ready
            </span>
          </div>

          <div
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur"
              >
                <div className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[12.5px] text-ink-300">{s.label}</div>
              </div>
            ))}
          </div>

          <div
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink-400 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <span className="font-mono uppercase tracking-[0.2em]">Stack</span>
            <span className="h-px flex-1 bg-white/10" />
            {[
              "Python",
              "FastAPI",
              "Flask",
              "LLM orchestration",
              "RAG",
              "PostgreSQL",
              "Redis",
              "Docker",
              "TypeScript",
            ].map((t) => (
              <span key={t} className="text-ink-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
