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
            <h2 className="section-heading">
              Built where mistakes are expensive.
            </h2>
            <div className="mt-2 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <span className="relative inline-flex h-14 w-14 overflow-hidden rounded-full border border-white/20">
                <Image
                  src={profile.avatar}
                  alt={`Portrait of ${profile.name}`}
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
              I&rsquo;m Mike — an AI Engineer working across Zimbabwe and South
              Africa, remote-first. I build AI systems end-to-end: the agent
              logic, the retrieval layer, the Python backend, the data pipeline
              feeding it, and the observability wrapped around it.
            </p>
            <p>
              My background is regulated funeral-assurance and
              financial-services engineering — multi-step digital application
              flows, claims-workflow automation, and compliance-aware backends.
              That shaped how I build AI:{" "}
              <span className="text-white">
                every model call is a fallible dependency, every run is
                auditable, every pipeline is a contract.
              </span>
            </p>
            <p className="text-ink-300">
              Looking for Applied / Agentic AI Engineer, AI Platform Engineer,
              or Data Engineer (AI systems) roles — on a team putting AI into
              high-stakes, regulated, or operationally serious products.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
