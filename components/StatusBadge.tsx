import type { ProjectStatus } from "@/lib/content";

const STYLES: Record<ProjectStatus, string> = {
  "Live demo":            "text-signal",
  "Shipped":              "text-signal",
  "Rolling out":          "text-signal",
  "Approved · standby":   "text-accent",
  "Prototype":            "text-accent",
  "Built":                "text-accent",
  "Paused":               "text-ink-muted",
  "Reference":            "text-ink-muted",
  "Lab":                  "text-ink-muted",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`font-mono text-micro uppercase tracking-wide ${STYLES[status]}`}>
      {status}
    </span>
  );
}
