import SectionHeader from "./SectionHeader";
import { interviewGuide } from "@/lib/content";

export default function InterviewGuide() {
  return (
    <section id="interview" className="section">
      <div className="container-edge">
        <SectionHeader
          eyebrow="For hiring managers"
          title="Deciding whether to interview? Start here."
          description="Three concrete steps — each with a time estimate — to evaluate my AI engineering and backend depth before scheduling a call."
        />

        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {interviewGuide.map((step, i) => (
            <li key={step.title} className="card-lg flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-micro text-ink-400">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <span className="chip text-micro">{step.time}</span>
              </div>
              <h3 className="font-display text-body-lg font-semibold leading-snug tracking-tight text-white">
                {step.title}
              </h3>
              <p className="flex-1 text-body-sm text-ink-300">
                {step.body}
              </p>
              <a
                href={step.href}
                target={step.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  step.href.startsWith("http")
                    ? "noreferrer noopener"
                    : undefined
                }
                className="btn-ghost w-fit text-caption"
              >
                {step.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
