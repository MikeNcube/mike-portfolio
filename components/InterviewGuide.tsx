import SectionHeader from "./SectionHeader";
import { interviewGuide } from "@/lib/content";

export default function InterviewGuide() {
  return (
    <section id="interview" className="border-t border-white/5 py-24 sm:py-28">
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
                <span className="font-mono text-[12px] text-ink-400">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <span className="chip text-[11px]">{step.time}</span>
              </div>
              <h3 className="font-display text-[17px] font-semibold tracking-tight text-white">
                {step.title}
              </h3>
              <p className="flex-1 text-[14px] leading-relaxed text-ink-300">
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
                className="btn-ghost w-fit text-[13px]"
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
