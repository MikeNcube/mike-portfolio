// Shared SVG diagram primitives.
// All colors come from CSS custom properties so diagrams adapt to light/dark mode.

const FILL = "var(--d-fill)";
const FILL_ACCENT = "var(--d-fill-accent)";
const STROKE = "var(--d-stroke)";
const TEXT = "var(--d-text)";
const TEXT_MUTED = "var(--d-text-muted)";
const ARROW = "var(--d-arrow)";
const ARROW_MUTED = "var(--d-arrow-muted)";

export { FILL, FILL_ACCENT, STROKE, TEXT, TEXT_MUTED, ARROW, ARROW_MUTED };

// Rounded-rect node with a label and optional sub-label.
export function Node({
  x, y, w = 120, h = 44,
  label, sub,
  accent = false,
}: {
  x: number; y: number; w?: number; h?: number;
  label: string; sub?: string;
  accent?: boolean;
}) {
  const fill = accent ? FILL_ACCENT : FILL;
  const cy = sub ? y + h / 2 - 7 : y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} style={{ fill, stroke: STROKE, strokeWidth: 1 }} />
      <text
        x={x + w / 2}
        y={cy + 5}
        textAnchor="middle"
        style={{ fill: TEXT, fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans, DM Sans, sans-serif)" }}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={cy + 21}
          textAnchor="middle"
          style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, DM Sans, sans-serif)" }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

// Horizontal arrow (left → right).
export function ArrowH({
  x1, x2, y, accent = false, label,
}: {
  x1: number; x2: number; y: number; accent?: boolean; label?: string;
}) {
  const color = accent ? ARROW : ARROW_MUTED;
  const mid = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 8} y2={y} style={{ stroke: color, strokeWidth: 1.5 }} />
      <polygon
        points={`${x2},${y} ${x2 - 8},${y - 4} ${x2 - 8},${y + 4}`}
        style={{ fill: color }}
      />
      {label && (
        <text
          x={mid}
          y={y - 5}
          textAnchor="middle"
          style={{ fill: TEXT_MUTED, fontSize: 11, fontFamily: "var(--font-sans, DM Sans, sans-serif)" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// Vertical arrow (top → bottom).
export function ArrowV({
  x, y1, y2, accent = false,
}: {
  x: number; y1: number; y2: number; accent?: boolean;
}) {
  const color = accent ? ARROW : ARROW_MUTED;
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 - 8} style={{ stroke: color, strokeWidth: 1.5 }} />
      <polygon
        points={`${x},${y2} ${x - 4},${y2 - 8} ${x + 4},${y2 - 8}`}
        style={{ fill: color }}
      />
    </g>
  );
}

// Diagonal arrow from (x1,y1) to (x2,y2).
export function ArrowD({
  x1, y1, x2, y2, accent = false,
}: {
  x1: number; y1: number; x2: number; y2: number; accent?: boolean;
}) {
  const color = accent ? ARROW : ARROW_MUTED;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 9;
  const ex = x2 - len * Math.cos(angle);
  const ey = y2 - len * Math.sin(angle);
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} style={{ stroke: color, strokeWidth: 1.5 }} />
      <polygon
        points={`${x2},${y2} ${x2 - len * Math.cos(angle - 0.4)},${y2 - len * Math.sin(angle - 0.4)} ${x2 - len * Math.cos(angle + 0.4)},${y2 - len * Math.sin(angle + 0.4)}`}
        style={{ fill: color }}
      />
    </g>
  );
}

// Simple label (no box).
export function Label({
  x, y, text, muted = false,
}: {
  x: number; y: number; text: string; muted?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      style={{ fill: muted ? TEXT_MUTED : TEXT, fontSize: 12, fontFamily: "var(--font-sans, DM Sans, sans-serif)" }}
    >
      {text}
    </text>
  );
}

// Diagram wrapper with accessible label.
export function DiagramSVG({
  viewBox, label, children,
}: {
  viewBox: string; label: string; children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      width="100%"
      role="img"
      aria-label={label}
      style={{ maxHeight: 280, overflow: "visible" }}
    >
      {children}
    </svg>
  );
}
