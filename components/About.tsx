import { engineeringApproach, profile } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container-edge">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">

          {/* Bio */}
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">About</p>
            <h2
              className="font-display-section font-medium text-ink mb-6"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.025em" }}
            >
              Mike S Ncube.
            </h2>

            <div className="space-y-4 text-base text-ink-muted leading-relaxed">
              <p>
                Applied AI Engineer and Systems Architect at{" "}
                <strong className="text-ink font-medium">Zororo-Phumulani Funeral Assurance</strong>{" "}
                (FSP 48558), where I have been the sole AI engineer since 2022. I built
                the lead-management CRM used by over 40 people, the claims document
                extraction pipeline, and the regulated insurance intake platform
                from scratch in a four-person IT team.
              </p>
              <p>
                Six-plus years in software, about three focused on generative AI.
                My strongest public proof is the live assistant above: open devtools,
                read the network calls, click the citations. No formal degree.
                Capability evidenced by shipped systems and a{" "}
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link"
                >
                  public GitHub portfolio
                </a>
                .
              </p>
            </div>
          </div>

          {/* How I build — 4 one-line principles */}
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-6">How I build</p>
            {/* dl > div > dt/dd — valid per HTML5 spec (one div level only) */}
            <dl className="space-y-5">
              {engineeringApproach.map((item) => (
                <div key={item.title}>
                  <dt className="flex gap-3 items-start text-base font-semibold text-ink">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {item.title}
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink-muted pl-[1.375rem]">{item.body}</dd>
                </div>
              ))}
            </dl>

            {/* Training */}
            <div className="mt-8 pt-8 border-t border-ink/[0.07]">
              <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-4">Training</p>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li>AWS Becoming an AI Practitioner Series — Sep 2026</li>
                <li>Retrieval-Augmented Generation — DeepLearning.AI</li>
                <li>Generative AI with LLMs — DeepLearning.AI</li>
                <li>Agentic AI — DeepLearning.AI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
