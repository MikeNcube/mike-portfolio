import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { flagshipProjects } from "@/lib/content";

export default function Flagship() {
  return (
    <section id="flagship" className="py-28 sm:py-36">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Flagship AI Systems"
          title="Three systems. Each one built as production-grade, not a demo."
          description="Selected for hiring impact: agentic orchestration, LLM-backed backends, and automated data pipelines — written up as systems, with the problem, the architectural decisions, and the outcome."
        />

        <div className="mt-14 flex flex-col gap-8">
          {flagshipProjects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} variant="flagship" index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
