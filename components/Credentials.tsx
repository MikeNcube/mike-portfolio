import SectionHeader from "./SectionHeader";
import { capabilities, certifications } from "@/lib/content";

export default function Credentials() {
  const core = certifications.filter((c) => c.tier === "core");
  const supporting = certifications.filter((c) => c.tier === "supporting");

  return (
    <section id="credentials" className="section">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Credentials"
          title="Coursework that backs the work."
          description="Core AI certifications listed first. Agentic AI is trained coursework — my public shipped proof is the RAG demo and production Python backends."
        />

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {core.map((cert) => (
            <li
              key={cert.name}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="font-display text-body font-semibold leading-snug tracking-tight text-white">
                {cert.name}
              </p>
              <p className="mt-1.5 font-mono text-micro text-ink-400">
                {cert.provider}
              </p>
            </li>
          ))}
        </ul>

        {supporting.length > 0 && (
          <div className="mt-8">
            <p className="mono mb-3 uppercase tracking-[0.18em] text-ink-400">
              Also completed
            </p>
            <ul className="flex flex-wrap gap-2">
              {supporting.map((cert) => (
                <li key={cert.name} className="chip">
                  {cert.name} · {cert.provider}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {capabilities.map((c) => (
            <li
              key={c.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <h3 className="font-display text-body font-semibold leading-snug tracking-tight text-white">
                {c.label}
              </h3>
              <p className="mt-1.5 text-body-sm text-ink-300">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
