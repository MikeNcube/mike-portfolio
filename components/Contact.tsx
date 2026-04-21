import { profile } from "@/lib/content";

export default function Contact() {
  return (
    <section id="contact" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-8 sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-grid-dim opacity-40" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-signal/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                Contact
              </span>
              <h2 className="mt-4 font-display text-display-lg tracking-tightest text-white text-balance">
                Have an AI system worth building properly?
              </h2>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-200">
                I take on senior engineering roles, focused contracts, and
                platform-level engagements where systems thinking actually
                matters. If that sounds like your team, let&rsquo;s talk.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={`mailto:${profile.email}`}
                className="btn-primary justify-center"
              >
                {profile.email}
                <span aria-hidden>→</span>
              </a>
              <a
                href="https://www.linkedin.com/in/mike-ncube"
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost justify-center"
              >
                LinkedIn
                <span aria-hidden>↗</span>
              </a>
              <a
                href="https://github.com/MikeNcube"
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost justify-center"
              >
                GitHub
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
            <InfoRow
              label="Availability"
              value="Senior / contract · remote-first"
            />
            <InfoRow
              label="Focus"
              value="Agentic AI · RAG · LLM workflows · Python backends"
            />
            <InfoRow label="Based" value={profile.location} />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono uppercase tracking-[0.18em]">{label}</div>
      <div className="mt-1.5 text-[14.5px] text-white">{value}</div>
    </div>
  );
}
