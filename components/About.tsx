import Image from "next/image";
import { profile } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container-edge">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              About
            </span>
            <h2 className="section-heading">
              Built where mistakes are expensive.
            </h2>
            <div className="mt-2 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <span className="relative inline-flex h-14 w-14 overflow-hidden rounded-full border border-white/20">
                <Image
                  src={profile.avatar}
                  alt={`Portrait of ${profile.name}`}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover object-top"
                />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-body font-semibold text-white">
                  {profile.name}
                </span>
                <span className="font-mono text-micro text-ink-300">
                  {profile.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 text-body text-ink-200">
            <p>
              I&rsquo;m Mike — an AI Engineer working across Zimbabwe and South
              Africa, remote-first. I build full-stack AI systems: the Next.js
              surface, the Python API, the retrieval layer, and the observability
              around it. Production backends in regulated insurance taught me to
              treat every model call as a fallible dependency.
            </p>
            <p>
              My strongest public proof is the RAG assistant on this page — open
              devtools and read the citations. Alongside that: shipped Flask web
              apps, a multi-tenant SOC platform on Railway (not an LLM product,
              but the kind of backend AI features need), and AWS/data work in
              clearly labelled reference and lab repos.
            </p>
            <p className="text-ink-300">
              Targeting {profile.targetRoles.join(", ")} — teams putting AI
              into high-stakes, regulated, or operationally serious products.
              Same positioning as my{" "}
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer noopener"
                className="text-white underline-offset-4 transition hover:text-accent-glow hover:underline"
              >
                GitHub profile
              </a>{" "}
              and{" "}
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="text-white underline-offset-4 transition hover:text-accent-glow hover:underline"
              >
                LinkedIn
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
