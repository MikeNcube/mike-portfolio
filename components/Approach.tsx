import SectionHeader from "./SectionHeader";
import { engineeringApproach } from "@/lib/content";

export default function Approach() {
  return (
    <section id="approach" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeader
          eyebrow="How I Build Systems"
          title="An engineering mindset, not a stack list."
          description="These are the principles I bring to every AI system I ship — the difference between a prototype that demos well and a service that a team can actually run."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {engineeringApproach.map((a, i) => (
            <div
              key={a.title}
              className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] font-mono text-[12px] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[16.5px] font-semibold tracking-tight text-white">
                  {a.title}
                </h3>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-ink-200 text-pretty">
                {a.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                Working principle
              </span>
              <p className="mt-3 font-display text-[22px] font-medium leading-snug tracking-tight text-white sm:text-[26px] text-balance">
                “Every LLM call is a fallible dependency. Every agent run is an
                event. Every pipeline is a contract. Build for observability
                first — velocity follows.”
              </p>
            </div>
            <a href="#contact" className="btn-primary self-start">
              Let&rsquo;s build something
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
