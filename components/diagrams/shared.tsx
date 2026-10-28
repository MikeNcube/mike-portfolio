// HTML/CSS diagram primitives.
// All labels are real DOM text at 14px — they never scale with a viewBox.

import React from "react";

const LABEL: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.35,
  fontWeight: 500,
};

const SUB: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.35,
  marginTop: 2,
};

export function Node({
  label,
  sub,
  accent = false,
  muted = false,
  className = "",
}: {
  label: string;
  sub?: string;
  accent?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[10px] border px-3 py-2.5 text-center w-full min-w-0",
        accent
          ? "border-accent/25 bg-accent/[0.07] text-ink"
          : muted
          ? "border-ink/[0.08] bg-transparent text-ink-muted"
          : "border-ink/[0.1] bg-surface text-ink",
        className,
      ].join(" ")}
    >
      <p className="diagram-label" style={LABEL}>{label}</p>
      {sub && (
        <p className="diagram-label font-mono text-ink-muted" style={SUB}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function ArrowH() {
  return (
    <span
      aria-hidden
      className="diagram-arrow hidden md:inline-flex items-center justify-center shrink-0 px-1.5 text-ink-faint select-none"
      style={{ fontSize: 16, lineHeight: 1 }}
    >
      →
    </span>
  );
}

export function ArrowV() {
  return (
    <span
      aria-hidden
      className="diagram-arrow inline-flex md:hidden items-center justify-center shrink-0 py-0.5 text-ink-faint select-none"
      style={{ fontSize: 16, lineHeight: 1 }}
    >
      ↓
    </span>
  );
}

export function ArrowDown() {
  return (
    <span
      aria-hidden
      className="diagram-arrow inline-flex items-center justify-center shrink-0 py-1 text-ink-faint select-none"
      style={{ fontSize: 16, lineHeight: 1 }}
    >
      ↓
    </span>
  );
}

export function FlowRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`diagram-flow flex flex-col md:flex-row md:flex-nowrap items-stretch gap-1.5 ${className}`}>
      {children}
    </div>
  );
}

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="diagram-label mt-3 text-ink-muted leading-relaxed" style={{ fontSize: 14 }}>
      {children}
    </p>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="diagram-label text-ink-muted" style={{ fontSize: 14, lineHeight: 1.4 }}>
      {children}
    </p>
  );
}

export function Diagram({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`diagram flex flex-col gap-2 overflow-visible ${className}`}
    >
      {children}
    </div>
  );
}
