import type { MetadataRoute } from "next";
import { allProjects } from "@/lib/content";

const BASE_URL = "https://mike-portfolio-tawny.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const projectEntries = allProjects.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: project.slug === "portfolio-rag-assistant" ? 0.9 : 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...projectEntries,
  ];
}
