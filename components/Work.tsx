import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { clientProjects, flagshipProjects } from "@/lib/content";

export default function Work() {
  return (
    <section id="work" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Selected work"
          title="Systems that shipped."
          description="Problem, what I built, and the outcome — with the repository one click away. Every status label is honest: production means deployed, lab means lab."
        />

        <div className="mt-14 flex flex-col gap-8">
          {flagshipProjects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
          {clientProjects.map((p, i) => (
            <ProjectCard
              key={p.slug}
              project={p}
              index={flagshipProjects.length + i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
