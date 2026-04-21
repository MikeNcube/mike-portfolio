import Image from "next/image";
import { capabilities, profile } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-grid-dim opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-radial-soft" />

      <div className="container-edge relative">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          {/* Left: positioning */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-2 animate-fade-up">
              <span className="chip-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
                {profile.availability}
              </span>
              <span className="chip">
                <span className="font-mono text-[10.5px] text-ink-400">
                  {profile.location}
                </span>
              </span>
            </div>

            <p
              className="font-mono text-[13px] text-ink-300 animate-fade-up"
              style={{ animationDelay: "40ms" }}
            >
              Hey, I am <span className="text-white">{profile.name}</span> —
            </p>

            <h1
              className="font-display text-display-xl tracking-tightest text-white text-balance animate-fade-up"
              style={{ animationDelay: "80ms" }}
            >
              AI{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-br from-accent via-accent to-signal bg-clip-text text-transparent">
                  Engineer
                </span>
              </span>
              .
            </h1>

            <p
              className="max-w-xl text-pretty text-[16.5px] leading-relaxed text-ink-200 animate-fade-up"
              style={{ animationDelay: "140ms" }}
            >
              I design and build{" "}
              <span className="text-white">agentic AI systems</span>,{" "}
              <span className="text-white">applied LLM workflows</span>, and{" "}
              <span className="text-white">Python backends</span> (Flask /
              FastAPI) — with{" "}
              <span className="text-white">data pipelines</span> wired in
              end-to-end.
            </p>

            <div
              className="flex flex-wrap items-center gap-3 pt-1 animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              <a href="#flagship" className="btn-primary">
                See flagship systems
                <span aria-hidden>↓</span>
              </a>
              <a href="#contact" className="btn-ghost">
                Start a conversation
                <span aria-hidden>→</span>
              </a>
            </div>

            <ul
              className="mt-4 grid gap-3 sm:grid-cols-2 animate-fade-up"
              style={{ animationDelay: "260ms" }}
            >
              {capabilities.map((c) => (
                <li
                  key={c.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur sm:p-5"
                >
                  <div className="font-display text-[15px] font-semibold tracking-tight text-white">
                    {c.label}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: portrait + identity card */}
          <div
            className="relative animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-gradient-to-br from-accent/20 via-transparent to-signal/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_20px_80px_-20px_rgba(0,102,255,0.35)] backdrop-blur">
              <div className="relative overflow-hidden rounded-2xl border border-accent/30">
                <Image
                  src={profile.portrait}
                  alt={`${profile.name} — ${profile.headline}`}
                  width={640}
                  height={720}
                  priority
                  className="aspect-[4/5] w-full object-cover object-top"
                  sizes="(min-width: 1024px) 420px, 100vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(10,13,20,0.7)] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[rgba(10,13,20,0.65)] px-3 py-1.5 text-[11.5px] font-medium text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
                    On the grid
                  </span>
                  <span className="rounded-full border border-white/15 bg-[rgba(10,13,20,0.65)] px-3 py-1.5 font-mono text-[11px] text-white backdrop-blur">
                    {profile.location}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 px-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-[22px] font-bold tracking-tight text-white">
                    {profile.name}
                  </h2>
                  <span className="font-mono text-[11px] text-ink-400">
                    v2025
                  </span>
                </div>
                <p className="text-[13.5px] text-ink-200">
                  {profile.subHeadline}
                </p>
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {profile.tags.map((t) => (
                    <li key={t} className="chip-accent">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink-400 animate-fade-up"
          style={{ animationDelay: "320ms" }}
        >
          <span className="font-mono uppercase tracking-[0.2em]">Stack</span>
          <span className="h-px flex-1 bg-white/10" />
          {[
            "Python",
            "FastAPI",
            "Flask",
            "LangChain",
            "RAG",
            "AWS",
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
    </section>
  );
}
