import SectionHeader from "./SectionHeader";
import { engineeringApproach } from "@/lib/content";

export default function Approach() {
  return (
    <section id="approach" className="section">
      <div className="container-edge">
        <SectionHeader
          eyebrow="How I build"
          title="Defaults shaped by regulated environments."
          description="My background is funeral-assurance and financial-services engineering — domains where a bad record is an audit finding. These are the defaults that survive there."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {engineeringApproach.map((item, i) => (
            <div key={item.title} className="card flex gap-4">
              <span
                aria-hidden
                className="font-mono text-micro text-ink-400"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-body-lg font-semibold leading-snug tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-body-sm text-ink-300">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
