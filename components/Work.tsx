import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import {
  clientProjects,
  flagshipProjects,
  workSections,
  type WorkSection,
} from "@/lib/content";

const SECTION_ORDER: WorkSection[] = ["ai-proof", "platform", "client"];

function projectsForSection(section: WorkSection) {
  if (section === "client") return clientProjects;
  return flagshipProjects.filter((p) => p.workSection === section);
}

export default function Work() {
  let index = 0;

  return (
    <section id="work" className="section">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Selected work"
          title="Proof you can inspect."
          description="Each project is labelled with an honest status. AI proof leads; production platforms follow; private client work is last."
        />

        <div className="mt-14 flex flex-col gap-16">
          {SECTION_ORDER.map((section) => {
            const projects = projectsForSection(section);
            if (projects.length === 0) return null;
            const meta = workSections[section];

            return (
              <div key={section} className="flex flex-col gap-8">
                <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-white">
                    {meta.title}
                  </h3>
                  <p className="max-w-3xl text-body text-ink-300">
                    {meta.description}
                  </p>
                </div>

                <div className="flex flex-col gap-8">
                  {projects.map((p) => {
                    const card = (
                      <ProjectCard
                        key={p.slug}
                        project={p}
                        index={index}
                        variant={
                          section === "ai-proof"
                            ? "flagship"
                            : section === "client"
                              ? "client"
                              : "summary"
                        }
                      />
                    );
                    index += 1;
                    return card;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
