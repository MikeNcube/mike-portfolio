export default function About() {
  return (
    <section id="about" className="border-t border-white/5 py-24 sm:py-28">
      <div className="container-edge">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              About
            </span>
            <h2 className="section-heading">Operator, not observer.</h2>
          </div>

          <div className="flex flex-col gap-5 text-[15.5px] leading-relaxed text-ink-200">
            <p>
              I build AI systems end-to-end — the agent logic, the Python
              backend, the data pipeline feeding it, and the observability
              around it. I care about the architecture decisions a team has to
              live with six months after launch.
            </p>
            <p>
              My default domains: <span className="text-white">agentic AI</span>
              , <span className="text-white">LLM workflow automation</span>,{" "}
              <span className="text-white">FastAPI / Flask services</span>, and{" "}
              <span className="text-white">
                data pipelines with real SLIs
              </span>
              . I work well with teams shipping AI into regulated or
              high-stakes environments — fintech, insurance, automotive,
              enterprise SaaS.
            </p>
            <p className="text-ink-300">
              Available for senior AI engineering roles, contract work, and
              consulting engagements on AI platform design.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
