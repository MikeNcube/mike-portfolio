"use client";

import { useEffect, useRef, useState } from "react";
import PipelineDiagram, { type PipelineStep } from "./PipelineDiagram";
import { profile } from "@/lib/content";

type Source = { title: string; url: string };
type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const SUGGESTIONS = [
  "Who is Mike Ncube?",
  "How does the RAG pipeline work technically?",
  "What production systems has Mike shipped?",
  "Walk me through Proactive Sentinel's architecture.",
];

function usePipelineSteps(loading: boolean) {
  const [step, setStep] = useState<PipelineStep>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (loading) {
      setStep(0);
      timers.current = [
        setTimeout(() => setStep(1), 380),
        setTimeout(() => setStep(2), 760),
        setTimeout(() => setStep(3), 1140),
      ];
    } else {
      setStep(null);
    }

    return () => { timers.current.forEach(clearTimeout); };
  }, [loading]);

  const complete = () => {
    timers.current.forEach(clearTimeout);
    setStep(4);
    timers.current = [setTimeout(() => setStep(null), 1000)];
  };

  return { step, complete };
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSources, setLastSources] = useState<Source[]>([]);
  const [limiterLabel, setLimiterLabel] = useState("Per-instance cap");
  const logRef = useRef<HTMLDivElement>(null);
  const lastAnswerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { step: pipelineStep, complete: pipelineComplete } = usePipelineSteps(loading);
  const hasMessages = messages.length > 0 || loading;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: { limiter?: { distributed?: boolean } }) => {
        if (cancelled) return;
        setLimiterLabel(data.limiter?.distributed ? "Rate-limited (Redis)" : "Per-instance cap");
      })
      .catch(() => {
        if (!cancelled) setLimiterLabel("Per-instance cap");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    if (loading) {
      log.scrollTop = log.scrollHeight;
      return;
    }
    const answer = lastAnswerRef.current;
    if (!answer) {
      log.scrollTop = log.scrollHeight;
      return;
    }
    const logRect = log.getBoundingClientRect();
    const ansRect = answer.getBoundingClientRect();
    log.scrollTop += ansRect.top - logRect.top;
  }, [messages, loading]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setLastSources([]);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await res.json();
      pipelineComplete();

      if (res.ok) {
        const sources: Source[] = (data.sources ?? []).filter(
          (s: Source) => s.url.startsWith("http"),
        );
        setLastSources(sources);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response, sources },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error ?? "Something went wrong. Please try again." },
        ]);
      }
    } catch {
      pipelineComplete();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const inputHasText = input.trim().length > 0;

  return (
    <section id="assistant" className="section">
      <div className="container-edge">
        <div className="mb-8">
          <p className="text-xs text-ink-muted uppercase tracking-[0.15em] mb-3">Live demo</p>
          <h2
            className="font-display-section font-medium text-ink mb-3"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.025em" }}
          >
            Ask the assistant.
          </h2>
          <p className="text-base text-ink-muted max-w-[540px]">
            Grounded in my CV and public repos. Refuses out-of-scope questions and cites sources.{" "}
            <a
              href="https://github.com/MikeNcube/mike-portfolio/blob/main/lib/rag.ts"
              target="_blank"
              rel="noreferrer noopener"
              className="link"
            >
              Source code
            </a>
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          {/* Pipeline — tied to live assistant state */}
          <div className="mb-4 rounded-xl border border-ink/[0.07] bg-surface/40 p-3 sm:p-4">
            <PipelineDiagram
              activeStep={pipelineStep}
              chunks={lastSources.map((s) => ({ title: s.title }))}
            />
          </div>

          {/* Chat panel */}
          <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-surface/40">

            {/* Suggestions — compact, shown when no messages */}
            {!hasMessages && (
              <div className="p-4 sm:p-5">
                <p className="text-sm text-ink-muted mb-3">
                  Ask about my projects, stack, or availability:
                </p>
                <ul className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-lg border border-ink/[0.09] bg-page px-3 py-1.5 text-sm text-ink-muted transition hover:border-ink/20 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                        style={{ minHeight: 36 }}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Message log — visible once conversation starts */}
            {hasMessages && (
              <div
                ref={logRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation with Mike's AI assistant"
                className="flex flex-col gap-4 overflow-y-auto p-4 sm:p-5"
                style={{ maxHeight: 360 }}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    ref={
                      m.role === "assistant" && i === messages.length - 1 && !loading
                        ? lastAnswerRef
                        : undefined
                    }
                    className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%] sm:max-w-lg"}
                  >
                    <div
                      className={[
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-ink text-page"
                          : "border border-ink/[0.07] bg-page text-ink",
                      ].join(" ")}
                    >
                      <span className="sr-only">{m.role === "user" ? "You:" : "Assistant:"}</span>
                      {m.content}

                      {/* Sources — only real http links, only when answered */}
                      {m.sources && m.sources.filter((s) => s.url.startsWith("http")).length > 0 && (
                        <div className="mt-3 border-t border-ink/[0.07] pt-2.5">
                          <p className="text-xs text-ink-muted uppercase tracking-[0.12em] mb-1">Sources</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {m.sources
                              .filter((s) => s.url.startsWith("http"))
                              .map((s) => (
                                <a
                                  key={`${s.url}-${s.title}`}
                                  href={s.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-micro link"
                                >
                                  {s.title}
                                </a>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <p className="font-mono text-micro text-ink-muted" aria-label="Assistant is thinking">
                    thinking…
                  </p>
                )}
              </div>
            )}

            {/* Input */}
            <form
              className="flex gap-2 border-t border-ink/[0.07] p-3 sm:p-4"
              onSubmit={(e) => { e.preventDefault(); send(); }}
            >
              <label htmlFor="assistant-input" className="sr-only">
                Ask about Mike&rsquo;s work
              </label>
              <input
                id="assistant-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about my work…"
                maxLength={500}
                className="min-w-0 flex-1 rounded-xl border border-ink/[0.09] bg-page px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-ink/25 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                style={{ minHeight: 44 }}
              />
              <button
                type="submit"
                disabled={loading || !inputHasText}
                aria-label="Send message"
                className={[
                  "rounded-xl px-5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                  inputHasText && !loading
                    ? "bg-accent text-page hover:bg-accent/90 active:scale-[0.98]"
                    : "bg-ink/[0.07] text-ink-muted cursor-not-allowed",
                ].join(" ")}
                style={{ minHeight: 44, minWidth: 60 }}
              >
                {loading ? "…" : "Send"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center font-mono text-micro text-ink-muted">
            {limiterLabel} · grounded · refuses out-of-scope ·{" "}
            <a href={`mailto:${profile.email}`} className="link">email Mike</a>
          </p>
        </div>
      </div>
    </section>
  );
}
