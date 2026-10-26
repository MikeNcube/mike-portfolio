import Image from "next/image";
import { profile } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="pt-28 sm:pt-36 pb-16 sm:pb-24">
      <div className="container-edge">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-16">

          {/* Text column — renders at full opacity immediately, no animation */}
          <div>
            <p className="mb-6 text-sm text-ink-muted">
              {profile.availability}
            </p>

            {/* Fraunces display — optical size 72 for large display text */}
            <h1
              className="font-display-hero font-medium text-ink text-balance mb-6"
              style={{ fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)", lineHeight: 1.04 }}
            >
              I build AI systems<br />
              for regulated work.
            </h1>

            {/* Standfirst — DM Sans 18px, ink-muted (AA: 5.2:1 on light bg) */}
            <p className="text-lg text-ink-muted max-w-[520px] text-pretty mb-8 leading-[1.6]">
              Applied AI Engineer and Systems Architect at Zororo-Phumulani
              Funeral Assurance (FSP 48558) since 2022. Six-plus years in
              software, about three in generative AI. Python, RAG, LangGraph,
              FastAPI, PostgreSQL.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <a href="#assistant" className="btn-primary">
                Try the assistant
              </a>
              <a
                href={`mailto:${profile.email}?subject=Hi%20Mike`}
                className="text-base link"
              >
                {profile.email}
              </a>
            </div>
          </div>

          {/* Portrait — desktop only; mobile is text-first */}
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-ink/[0.08]">
              <Image
                src={profile.portrait}
                alt="Mike S Ncube, Applied AI Engineer, Johannesburg, South Africa"
                width={640}
                height={760}
                priority
                className="aspect-[3/4] w-full object-cover object-top"
                sizes="320px"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
