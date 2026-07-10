import type { ProjectStatus } from "@/lib/content";

// AA-checked foreground colours on the site's dark background.
const STYLES: Record<ProjectStatus, string> = {
  Production: "border-signal/40 text-signal",
  Shipped: "border-signal/40 text-signal",
  "Live demo": "border-accent-glow/50 text-accent-glow",
  Reference: "border-white/20 text-ink-200",
  Lab: "border-white/20 text-ink-200",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-micro uppercase tracking-[0.12em] ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
