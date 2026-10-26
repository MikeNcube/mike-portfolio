import type { ProjectStatus } from "@/lib/content";

const STYLES: Record<ProjectStatus, string> = {
  "Live demo":  "text-signal",
  "Shipped":    "text-signal",
  "Prototype":  "text-accent",
  "Built":      "text-accent",
  "Paused":     "text-ink/45",
  "Reference":  "text-ink/45",
  "Lab":        "text-ink/45",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`font-mono text-micro uppercase tracking-wide ${STYLES[status]}`}>
      {status}
    </span>
  );
}
