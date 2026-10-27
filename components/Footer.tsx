import { profile } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="border-t border-ink/[0.07] pb-safe">
      <div className="container-edge flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
        <p className="text-sm text-ink-muted">
          {profile.name} · Applied AI Engineer · Johannesburg
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="text-sm text-ink-muted transition hover:text-ink"
        >
          {profile.email}
        </a>
      </div>
    </footer>
  );
}
