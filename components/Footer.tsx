import Image from "next/image";
import { profile } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-white/5">
      <div className="container-edge flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-7 w-7 overflow-hidden rounded-full border border-white/15">
            <Image
              src={profile.avatar}
              alt={profile.name}
              width={56}
              height={56}
              className="h-full w-full object-cover object-top"
            />
          </span>
          <p className="text-sm text-ink-300">
            {profile.name} · {profile.headline} · {profile.location}
          </p>
        </div>
        <a
          href={`mailto:${profile.email}?subject=Interview%20%E2%80%94%20AI%20Engineering`}
          className="font-mono text-[12px] text-ink-200 underline-offset-4 transition hover:text-signal hover:underline"
        >
          {profile.email}
        </a>
      </div>
    </footer>
  );
}
