"use client";

import { useState } from "react";
import { profile } from "@/lib/content";

type Status = "idle" | "sending" | "success" | "error";

const inputCls =
  "w-full rounded-xl border border-ink/[0.09] bg-page px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink/25 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

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
        setErrorText(data.error ?? `Something went wrong — email me at ${profile.email}.`);
      }
    } catch {
      setStatus("error");
      setErrorText(`Network error — email me directly at ${profile.email}.`);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className="text-sm text-ink/55">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={200}
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            className={inputCls}
            style={{ minHeight: 44 }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="text-sm text-ink/55">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className={inputCls}
            style={{ minHeight: 44 }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="text-sm text-ink/55">Message</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={5000}
          value={form.message}
          onChange={update("message")}
          className={`${inputCls} resize-y`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending" || !form.name.trim() || !form.email.trim() || !form.message.trim()}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          style={{ minHeight: 44 }}
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>

        <p aria-live="polite" className="text-sm">
          {status === "success" && (
            <span className="text-signal">Sent — I&rsquo;ll reply from {profile.email}.</span>
          )}
          {status === "error" && (
            <span className="text-red-600 dark:text-red-400">{errorText}</span>
          )}
        </p>
      </div>
    </form>
  );
}
