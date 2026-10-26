"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { navSections, profile } from "@/lib/content";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const navBg = scrolled || open
    ? "border-ink/[0.08] bg-page/90 backdrop-blur-xl"
    : "border-transparent bg-transparent";

  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${navBg}`}>
      {/* Safe area for iPhone notch */}
      <div className="pt-safe" />
      <div className="container-edge flex h-14 items-center justify-between gap-4">

        {/* Logo / name */}
        <a
          href="#top"
          className="flex min-h-[44px] items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <span className="relative inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-ink/15">
            <Image
              src={profile.avatar}
              alt=""
              width={56}
              height={56}
              priority
              className="h-full w-full object-cover object-top"
            />
          </span>
          <span className="font-display text-[0.9375rem] font-semibold tracking-tight text-ink font-display-section">
            {profile.name}
          </span>
        </a>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="min-h-[44px] inline-flex items-center rounded-lg px-3.5 py-1 text-sm text-ink/60 transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          <a
            href={`mailto:${profile.email}?subject=Hi%20Mike`}
            className="hidden md:inline-flex btn-ghost text-sm"
          >
            Email me
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-ink/[0.06] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:hidden"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span aria-hidden className="relative block h-[14px] w-[18px]">
              <span className={`absolute inset-x-0 top-0 h-px bg-current transition-all ${open ? "top-[7px] rotate-45" : ""}`} />
              <span className={`absolute inset-x-0 top-[7px] h-px bg-current transition-all ${open ? "opacity-0" : ""}`} />
              <span className={`absolute inset-x-0 bottom-0 h-px bg-current transition-all ${open ? "top-[7px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-t border-ink/[0.08] bg-page/96 backdrop-blur-xl md:hidden"
        >
          <div className="container-edge flex flex-col py-3 pb-safe">
            {navSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className="min-h-[44px] flex items-center rounded-lg px-2 text-base text-ink/70 hover:text-ink"
              >
                {s.label}
              </a>
            ))}
            <a
              href={`mailto:${profile.email}?subject=Hi%20Mike`}
              onClick={() => setOpen(false)}
              className="mt-2 btn-primary text-sm w-full justify-center"
            >
              Email me
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
