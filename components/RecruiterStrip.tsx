import { profile } from "@/lib/content";

export default function RecruiterStrip() {
  return (
    <section
      aria-label="Roles and proof points for recruiters"
      className="border-y border-white/5 bg-white/[0.02] py-8 sm:py-10"
    >
      <div className="container-edge">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <p className="mono uppercase tracking-[0.18em] text-ink-400">
              Hiring for
            </p>
            <ul className="flex flex-wrap gap-2">
              {profile.targetRoles.map((role) => (
                <li key={role} className="chip-accent">
                  {role}
                </li>
              ))}
            </ul>
            <p className="text-body-sm text-ink-300">
              Full-time or contract · {profile.location}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="mono uppercase tracking-[0.18em] text-ink-400">
              30-second proof
            </p>
            <ul className="flex flex-col gap-3">
              {profile.proofPoints.map((point) => (
                <li
                  key={point.lead}
                  className="flex gap-3 text-body-sm"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal"
                  />
                  <span>
                    <span className="font-medium text-white">{point.lead}</span>
                    {" — "}
                    <span className="text-ink-300">{point.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={`mailto:${profile.email}?subject=Interview%20%E2%80%94%20AI%20Engineering`}
                className="btn-primary text-caption"
              >
                Request interview
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost text-caption"
              >
                LinkedIn ↗
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost text-caption"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
