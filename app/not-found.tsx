import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-edge flex min-h-[70vh] flex-col items-center justify-center gap-6 py-32 text-center">
      <p className="font-mono text-micro text-ink-muted uppercase tracking-widest">404</p>
      <h1
        className="font-display-section font-medium text-ink"
        style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
      >
        Page not found.
      </h1>
      <p className="max-w-md text-base text-ink-muted">
        That page doesn&rsquo;t exist. Return to the homepage or try the live assistant.
      </p>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </section>
  );
}
