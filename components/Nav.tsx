"use client";

import { useEffect, useState } from "react";
import { navSections } from "@/lib/content";

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
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[rgba(7,8,10,0.72)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="container-edge flex h-16 items-center justify-between">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] font-mono text-[13px] font-semibold text-white transition group-hover:border-accent/50 group-hover:text-accent">
            M
            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
          </span>
          <span className="font-display text-[15px] font-medium tracking-tight text-white">
            Mike
            <span className="ml-1.5 font-mono text-[11px] font-normal text-ink-400">
              · AI Engineer
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {navSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full px-3 py-1.5 text-[13px] text-ink-200 transition hover:bg-white/[0.04] hover:text-white"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a href="#contact" className="btn-primary">
            Hire me
            <span aria-hidden>→</span>
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] md:hidden"
        >
          <span className="relative block h-3 w-4">
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
        <div className="border-t border-white/10 bg-[rgba(7,8,10,0.92)] backdrop-blur-xl md:hidden">
          <div className="container-edge flex flex-col gap-1 py-4">
            {navSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-100 hover:bg-white/[0.04]"
              >
                {s.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full justify-center"
            >
              Hire me →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
