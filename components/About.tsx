import Image from "next/image";
import { profile } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="border-t border-white/5 py-24 sm:py-28">
      <div className="container-edge">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              About
            </span>
            <h2 className="section-heading">Operator, not observer.</h2>
            <div className="mt-2 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <span className="relative inline-flex h-14 w-14 overflow-hidden rounded-full border-2 border-accent/40 ring-1 ring-white/10">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover object-top"
                />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-semibold text-white">
                  {profile.name}
                </span>
                <span className="font-mono text-[11.5px] text-ink-300">
                  {profile.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 text-[15.5px] leading-relaxed text-ink-200">
            <p>
              I&rsquo;m Mike — an AI Engineer working across Zimbabwe and
              South Africa. I build AI systems end-to-end: the agent logic,
              the retrieval layer, the Python backend, the data pipeline
              feeding it, and the observability wrapped around it.
            </p>
            <p>
              My default domains:{" "}
              <span className="text-white">agentic AI</span>,{" "}
              <span className="text-white">applied LLM workflows</span>,{" "}
              <span className="text-white">Flask / FastAPI services</span>, and{" "}
              <span className="text-white">data pipelines with real SLIs</span>
              . I work well with teams shipping AI into regulated or
              high-stakes environments — fintech, insurance, automotive,
              enterprise SaaS.
            </p>
            <p className="text-ink-300">
              Available for AI engineering roles, contract work, and
              consulting engagements on AI platform design.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
