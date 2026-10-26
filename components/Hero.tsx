import Image from "next/image";
import { profile } from "@/lib/content";

// Warm-tone CSS filter to blend the cool studio shot with the cream page.
// sepia adds warmth; brightness and saturate keep it photographic not stylised.
const WARM_FILTER = "sepia(18%) brightness(0.96) saturate(0.82)";

export default function Hero() {
  return (
    <section id="top" className="pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="container-edge">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-16">

          {/* Text column — instant render, no entrance animation */}
          <div>
            <p className="mb-6 text-sm text-ink-muted">
              {profile.availability}
            </p>

            <h1
              className="font-display-hero font-medium text-ink text-balance mb-6"
              style={{ fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)", lineHeight: 1.04 }}
            >
              I build AI systems<br />
              for regulated work.
            </h1>

            {/* Mobile portrait — zoomed head-and-shoulders crop, 80px slot */}
            <div className="mb-6 lg:hidden">
              <div
                className="relative h-20 w-20 overflow-hidden rounded-2xl border border-ink/[0.08]"
                style={{ boxShadow: "0 2px 12px rgba(26,21,16,0.08)" }}
              >
                <Image
                  src={profile.portrait}
                  alt="Mike S Ncube"
                  width={160}
                  height={160}
                  priority
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    filter: WARM_FILTER,
                    objectPosition: "50% 12%",
                    transform: "scale(1.85)",
                    transformOrigin: "50% 12%",
                  }}
                  sizes="80px"
                />
              </div>
            </div>

            {/* Standfirst — DM Sans 18px, ink-muted (AA: 5.2:1 light, 7.0:1 dark) */}
            <p className="text-lg text-ink-muted max-w-[520px] text-pretty mb-8 leading-[1.6]">
              Applied AI Engineer and Systems Architect at Zororo-Phumulani
              Funeral Assurance (FSP 48558) since 2022. Production systems:
              Digi App Form, the lead-management CRM, and ZDI (approved for
              production rollout). Six-plus years in software, about three in
              generative AI.
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

          {/* Desktop portrait — full panel, warm-toned */}
          <div className="hidden lg:block">
            <div
              className="overflow-hidden rounded-2xl border border-ink/[0.08]"
              style={{ boxShadow: "0 4px 24px rgba(26,21,16,0.06)" }}
            >
              <Image
                src={profile.portrait}
                alt="Mike S Ncube, Applied AI Engineer, Johannesburg, South Africa"
                width={1024}
                height={1024}
                priority
                className="aspect-[3/4] w-full object-cover object-top"
                style={{ filter: WARM_FILTER }}
                sizes="300px"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
