import Image from "next/image";
import { capabilities, profile } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="relative pt-32 sm:pt-40">
      <div className="container-edge">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          {/* Left: positioning */}
          <div className="flex flex-col gap-7">
            <p className="animate-fade-up">
              <span className="chip-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                {profile.availability}
              </span>
            </p>

            <h1
              className="font-display text-display-xl tracking-tightest text-white text-balance animate-fade-up"
              style={{ animationDelay: "60ms" }}
            >
              AI Engineer —<br />
              production RAG &amp; agentic LLM systems.
            </h1>

            <p
              className="max-w-xl text-pretty text-[17px] leading-relaxed text-ink-200 animate-fade-up"
              style={{ animationDelay: "120ms" }}
            >
              {profile.oneLiner} Python backends, retrieval pipelines, and
              agent workflows — shipped on AWS and battle-tested against
              compliance audits, not just demos.
            </p>

            <div
              className="flex flex-wrap items-center gap-3 pt-1 animate-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              <a href="#work" className="btn-primary">
                View work
              </a>
              <a href="#assistant" className="btn-ghost">
                Ask my AI
              </a>
              <a href="#contact" className="btn-ghost">
                Contact
              </a>
            </div>

            <ul
              className="mt-6 grid gap-3 sm:grid-cols-2 animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              {capabilities.map((c) => (
                <li
                  key={c.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
                >
                  <h2 className="font-display text-[15px] font-semibold tracking-tight text-white">
                    {c.label}
                  </h2>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-300">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: portrait */}
          <div
            className="relative mx-auto w-full max-w-sm animate-fade-up lg:mx-0"
            style={{ animationDelay: "140ms" }}
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-4">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src={profile.portrait}
                  alt={`Portrait of ${profile.name}`}
                  width={640}
                  height={720}
                  priority
                  className="aspect-[4/5] w-full object-cover object-top"
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 384px, 100vw"
                />
              </div>
              <div className="flex flex-col gap-1.5 px-1 pb-1 pt-4">
                <p className="font-display text-[19px] font-semibold tracking-tight text-white">
                  {profile.name}
                </p>
                <p className="text-[13.5px] leading-snug text-ink-200">
                  {profile.subHeadline}
                </p>
                <p className="font-mono text-[11.5px] text-ink-400">
                  {profile.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
          <span className="font-mono uppercase tracking-[0.2em] text-ink-400">
            Stack
          </span>
          <span className="h-px flex-1 bg-white/10" aria-hidden />
          {[
            "Python",
            "FastAPI",
            "Flask",
            "LangChain / LangGraph",
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
