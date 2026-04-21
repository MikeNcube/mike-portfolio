import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { pipelineProjects } from "@/lib/content";

export default function Pipelines() {
  return (
    <section id="pipelines" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Data Pipelines · Automation"
          title="Ingestion and automation that survive contact with reality."
          description="Contract-first ETL, document-intelligence pipelines, and replayable schedulers. Schema drift is detected, bad rows are quarantined, and freshness is a measured SLI — not a hope."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pipelineProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
