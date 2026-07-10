import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-edge flex min-h-[70vh] flex-col items-center justify-center gap-6 py-32 text-center">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        404
      </span>
      <h1 className="font-display text-display-md tracking-tightest text-white">
        Route not found.
      </h1>
      <p className="max-w-md text-body text-ink-300">
        That page doesn&rsquo;t exist. Return to the homepage or try the live RAG
        demo.
      </p>
      <Link href="/" className="btn-primary">
        Back to portfolio <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
