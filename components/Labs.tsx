import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { labProjects } from "@/lib/content";

export default function Labs() {
  return (
    <section id="labs" className="border-t border-white/5 py-24 sm:py-28">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Reference work & labs"
          title="Learning in public, labelled as such."
          description="Reference architectures and hands-on AWS labs. These aren't production claims — they're evidence of how I learn and document infrastructure work."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {labProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}
