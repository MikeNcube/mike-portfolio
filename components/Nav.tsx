"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { navSections, profile } from "@/lib/content";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-[rgba(10,13,20,0.85)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="container-edge flex h-16 items-center justify-between">
        <a
          href="#top"
          className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="relative inline-flex h-8 w-8 overflow-hidden rounded-full border border-white/20">
            <Image
              src={profile.avatar}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover object-top"
              priority
            />
          </span>
          <span className="font-display text-body font-semibold tracking-tight text-white">
            Mike Ncube
            <span className="ml-2 hidden font-mono text-micro font-normal text-ink-300 sm:inline">
              · AI Engineer
            </span>
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full px-3 py-1.5 text-caption text-ink-200 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href={`mailto:${profile.email}?subject=Interview%20%E2%80%94%20AI%20Engineering`}
            className="btn-primary"
          >
            Interview
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
        >
          <span aria-hidden className="relative block h-3 w-4">
            <span
              className={[
                "absolute left-0 top-0 h-px w-4 bg-white transition",
                open ? "translate-y-[6px] rotate-45" : "",
              ].join(" ")}
            />
            <span
              className={[
                "absolute left-0 top-[6px] h-px w-4 bg-white transition",
                open ? "opacity-0" : "",
              ].join(" ")}
            />
            <span
              className={[
                "absolute bottom-0 left-0 h-px w-4 bg-white transition",
                open ? "-translate-y-[6px] -rotate-45" : "",
              ].join(" ")}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-t border-white/10 bg-[rgba(10,13,20,0.96)] backdrop-blur-xl md:hidden"
        >
          <div className="container-edge flex flex-col gap-1 py-4">
            {navSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-body-sm text-ink-100 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {s.label}
              </a>
            ))}
            <a
              href={`mailto:${profile.email}?subject=Interview%20%E2%80%94%20AI%20Engineering`}
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full justify-center"
            >
              Request interview
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
