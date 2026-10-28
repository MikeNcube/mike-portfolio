import { profile } from "@/lib/content";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container-edge">
        <div className="mb-10">
          <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">Contact</p>
          <h2
            className="font-display-section font-medium text-ink mb-3"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.025em" }}
          >
            Get in touch.
          </h2>
          <p className="text-base text-ink-muted max-w-[480px]">
            Available for full-time or contract roles, remote from Johannesburg.
            I respond within 24 hours.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Links column */}
          <div className="flex flex-col gap-3 text-sm">
            <a href={`mailto:${profile.email}?subject=Hi%20Mike`} className="text-base link">
              {profile.email}
            </a>
            <a href={`tel:${profile.phonePrimary.tel}`} className="link">
              {profile.phonePrimary.display} ({profile.phonePrimary.international})
            </a>
            <a href={`tel:${profile.phoneSecondary.tel}`} className="link">
              {profile.phoneSecondary.display}
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer noopener" className="link">
              github.com/MikeNcube
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer noopener" className="link">
              linkedin.com/in/mike-ncube-669563a7
            </a>
            <p className="text-ink-muted mt-2">Johannesburg · Remote-first</p>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-ink/[0.08] bg-surface/40 p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
