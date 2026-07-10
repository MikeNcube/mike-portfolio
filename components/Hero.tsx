import Image from "next/image";
import { profile } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="relative pt-32 sm:pt-40">
      <div className="container-edge">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:items-start">
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
              full-stack RAG &amp; Python backends.
            </h1>

            <p
              className="max-w-xl text-pretty text-body-lg text-ink-200 animate-fade-up"
              style={{ animationDelay: "120ms" }}
            >
              {profile.oneLiner} Public proof: a live RAG assistant on this
              page, plus production Python platforms in regulated insurance and
              security.
            </p>

            <div
              className="flex flex-wrap items-center gap-3 pt-1 animate-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              <a href="#assistant" className="btn-primary">
                Ask my AI about my work
              </a>
              <a href="#work" className="btn-ghost">
                View work
              </a>
              <a
                href={`mailto:${profile.email}?subject=Interview%20%E2%80%94%20AI%20Engineering`}
                className="btn-ghost"
              >
                Email for interview
              </a>
            </div>
          </div>

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
                <p className="font-display text-title tracking-tight text-white">
                  {profile.name}
                </p>
                <p className="text-body-sm leading-snug text-ink-200">
                  {profile.subHeadline}
                </p>
                <p className="font-mono text-micro text-ink-400">
                  {profile.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption">
          <span className="font-mono uppercase tracking-[0.2em] text-ink-400">
            Stack
          </span>
          <span className="h-px flex-1 bg-white/10" aria-hidden />
          {[
            "Python",
            "Next.js",
            "Flask",
            "RAG",
            "PostgreSQL",
            "Redis",
            "Docker",
            "Railway",
            "AWS (labs)",
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
