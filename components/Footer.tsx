export default function Footer() {
  return (
    <footer className="mt-32 border-t border-white/5">
      <div className="container-edge flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] font-mono text-[12px] text-white">
            M
          </div>
          <p className="text-sm text-ink-300">
            Mike · AI Engineer · Systems-first.
          </p>
        </div>
        <p className="font-mono text-[11px] text-ink-400">
          © {new Date().getFullYear()} · Built with intent, not templates.
        </p>
      </div>
    </footer>
  );
}
