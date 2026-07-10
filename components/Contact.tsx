import { profile } from "@/lib/content";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container-edge">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Contact
            </span>
            <h2 className="section-heading text-balance">
              Ready to schedule a technical conversation?
            </h2>
            <p className="max-w-md text-body text-ink-200">
              Typical path: a 30-minute intro, then a take-home or live system
              design focused on RAG, Python backends, or regulated workflows.
              I respond within 24 hours.
            </p>

            <dl className="flex flex-col gap-4 border-t border-white/10 pt-6">
              <InfoRow label="Email">
                <a
                  href={`mailto:${profile.email}?subject=Interview%20%E2%80%94%20AI%20Engineering`}
                  className="text-white underline-offset-4 transition hover:text-accent-glow hover:underline"
                >
                  {profile.email}
                </a>
              </InfoRow>
              <InfoRow label="GitHub">
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-white underline-offset-4 transition hover:text-accent-glow hover:underline"
                >
                  github.com/MikeNcube ↗
                </a>
              </InfoRow>
              <InfoRow label="LinkedIn">
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-white underline-offset-4 transition hover:text-accent-glow hover:underline"
                >
                  Mike Ncube ↗
                </a>
              </InfoRow>
              <InfoRow label="Availability">
                <span className="text-white">
                  Full-time / contract · remote-first · {profile.location}
                </span>
              </InfoRow>
            </dl>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="mono w-28 shrink-0 uppercase tracking-[0.18em]">
        {label}
      </dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}
