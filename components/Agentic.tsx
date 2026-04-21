import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { agenticProjects } from "@/lib/content";

export default function Agentic() {
  return (
    <section id="agentic" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Agentic AI · LLM Orchestration"
          title="Systems that plan, act, verify — and can be replayed."
          description="Agentic work beyond chat: planner/executor/critic loops, typed tool calling, eval-gated model routing, and retrieval systems designed to be measured, not vibes-checked."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agenticProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
