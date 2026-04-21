import SectionHeader from "./SectionHeader";
import ProjectCard from "./ProjectCard";
import { backendProjects } from "@/lib/content";

export default function Backend() {
  return (
    <section id="backend" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Backend Engineering · FastAPI / Flask"
          title="Python services engineered to be boring — in the best way."
          description="Typed contracts, OpenAPI-first design, structured logging, trace IDs, idempotency, tenant isolation. The unglamorous infrastructure that makes AI products reliable enough to sell."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {backendProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
