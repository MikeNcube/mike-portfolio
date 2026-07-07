"use client";

import { useState } from "react";
import { profile } from "@/lib/content";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorText("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
        setErrorText(
          data.error ?? `Something went wrong — email me at ${profile.email}.`,
        );
      }
    } catch {
      setStatus("error");
      setErrorText(`Network error — email me directly at ${profile.email}.`);
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[14px] text-white placeholder:text-ink-400 focus:border-white/30 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-name"
            className="mono uppercase tracking-[0.18em]"
          >
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={200}
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-email"
            className="mono uppercase tracking-[0.18em]"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-message"
          className="mono uppercase tracking-[0.18em]"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={5000}
          value={form.message}
          onChange={update("message")}
          className={`${inputClasses} resize-y`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={
            status === "sending" ||
            !form.name.trim() ||
            !form.email.trim() ||
            !form.message.trim()
          }
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>

        <p aria-live="polite" className="text-[13.5px]">
          {status === "success" && (
            <span className="text-signal">
              Sent — I&rsquo;ll reply from {profile.email}.
            </span>
          )}
          {status === "error" && <span className="text-red-300">{errorText}</span>}
        </p>
      </div>
    </form>
  );
}
