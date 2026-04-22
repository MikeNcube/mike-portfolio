import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allProjects,
  getProjectBySlug,
  getProjectNeighbours,
} from "@/lib/content";
import ProjectDetail from "@/components/ProjectDetail";

export function generateStaticParams() {
  return allProjects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const project = getProjectBySlug(params.slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.name} · Case study`,
    description: project.tagline,
    openGraph: {
      title: project.name,
      description: project.tagline,
      type: "article",
    },
  };
}

export default function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = getProjectBySlug(params.slug);
  if (!project) notFound();
  const { prev, next } = getProjectNeighbours(params.slug);
  return <ProjectDetail project={project} prev={prev} next={next} />;
}
