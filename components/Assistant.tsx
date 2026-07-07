"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";
import { profile } from "@/lib/content";

type Source = { title: string; url: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

const SUGGESTIONS = [
  "What production systems has Mike shipped?",
  "How does this chat actually work?",
  "What's his experience with AWS?",
  "Is he available for hire?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the latest message visible without scrolling the whole page.
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, loading]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await res.json();
      const reply: Message = res.ok
        ? { role: "assistant", content: data.response, sources: data.sources }
        : { role: "assistant", content: data.error ?? "Something went wrong. Please try again." };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    }
    setLoading(false);
  };

  return (
    <section id="assistant" className="border-t border-white/5 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeader
          eyebrow="Live RAG demo"
          title="Don't take my word for it. Ask."
          description="This is a working retrieval-augmented pipeline — your question is embedded, matched against a knowledge base built from my real project documentation, and answered with citations. If it doesn't know, it says so."
        />

        <div className="mx-auto mt-12 max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="font-mono text-[12px] text-ink-300">
                embed → retrieve → generate → cite
              </span>
              <a
                href="https://github.com/MikeNcube/mike-portfolio"
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-[12px] text-ink-300 underline-offset-4 transition hover:text-white hover:underline"
              >
                source ↗
              </a>
            </div>

            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              aria-label="Conversation with Mike's AI assistant"
              className="flex h-80 flex-col gap-4 overflow-y-auto p-5"
            >
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-start justify-center gap-3">
                  <p className="text-[14px] leading-relaxed text-ink-300">
                    Ask about my projects, stack, or availability — answers are
                    grounded in my actual repos and cite their sources.
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border border-white/15 bg-white/[0.02] px-3.5 py-1.5 text-[13px] text-ink-100 transition hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "self-end" : "self-start"}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed sm:max-w-md",
                      m.role === "user"
                        ? "ml-auto bg-white text-ink-900"
                        : "border border-white/10 bg-white/[0.03] text-ink-100",
                    ].join(" ")}
                  >
                    <span className="sr-only">
                      {m.role === "user" ? "You said:" : "Assistant said:"}
                    </span>
                    {m.content}
                    {m.sources && m.sources.length > 0 && (
                      <span className="mt-3 block border-t border-white/10 pt-2.5">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
                          Sources
                        </span>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {m.sources.map((s) => (
                            <a
                              key={`${s.url}-${s.title}`}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-[12px] text-signal underline underline-offset-4 transition hover:text-white"
                            >
                              {s.title} ↗
                            </a>
                          ))}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <p className="font-mono text-[12px] text-ink-400" aria-label="Assistant is thinking">
                  retrieving…
                </p>
              )}
            </div>

            <form
              className="flex gap-2 border-t border-white/10 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label htmlFor="assistant-input" className="sr-only">
                Ask a question about Mike&rsquo;s work
              </label>
              <input
                id="assistant-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. What did he build for financial services?"
                maxLength={500}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[14px] text-white placeholder:text-ink-400 focus:border-white/30 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-white px-5 py-2.5 text-[14px] font-medium text-ink-900 transition enabled:hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Ask
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-[12.5px] text-ink-400">
            Grounded in my GitHub READMEs and portfolio copy · rate-limited ·{" "}
            <a
              href={`mailto:${profile.email}`}
              className="underline underline-offset-4 transition hover:text-ink-200"
            >
              or just email me
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
