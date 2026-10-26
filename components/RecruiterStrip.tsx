// Unused on homepage — kept for reference.
import { profile } from "@/lib/content";

export default function RecruiterStrip() {
  return (
    <section aria-label="Contact" className="py-8">
      <div className="container-edge">
        <p className="text-sm text-ink-muted">
          {profile.name} · {profile.role} · {profile.location}
        </p>
      </div>
    </section>
  );
}
