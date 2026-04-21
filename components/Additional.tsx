import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { additionalProjects } from "@/lib/content";

export default function Additional() {
  return (
    <section className="border-t border-white/5 py-24 sm:py-28">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Additional Work"
          title="Secondary projects and tooling."
          description="Lower-priority work kept for completeness — frontend platforms, internal tooling, and developer-experience improvements."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {additionalProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}
