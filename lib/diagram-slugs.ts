export const DIAGRAM_SLUGS = [
  "portfolio-rag-assistant",
  "sitewarden",
  "cube-agent",
  "zororo-crm",
  "zdi-signature-workflow",
  "zororo-ai-os",
  "zororo-claims",
  "ai-social-agent",
  "claims-pipeline",
  "digi-app-form",
  "proactive-sentinel",
] as const;

// True when this case study has an architecture diagram.
export function hasProjectDiagram(slug: string): boolean {
  return (DIAGRAM_SLUGS as readonly string[]).includes(slug);
}
