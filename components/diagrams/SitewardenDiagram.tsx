// Sitewarden governed AI platform — LangGraph state graph diagram.
import { DiagramSVG, Node, ArrowH, ArrowV, ArrowD, TEXT_MUTED, ARROW } from "./shared";

export default function SitewardenDiagram() {
  // Two rows: main graph flow (top) and approval loop (bottom).
  // Width 760, height 220.
  return (
    <DiagramSVG
      viewBox="0 0 760 220"
      label="Sitewarden state graph: Plan → Analyse → Self-check → Write report → Await approval → Revise (loop)"
    >
      {/* Row 1: main path */}
      <Node x={8}   y={20} w={100} h={44} label="Plan"        sub="decompose goal" accent />
      <ArrowH x1={108} x2={148} y={42} accent />
      <Node x={150} y={20} w={110} h={44} label="Analyse"     sub="read-only tools" />
      <ArrowH x1={260} x2={300} y={42} />
      <Node x={302} y={20} w={110} h={44} label="Self-check"  sub="verify plan" />
      <ArrowH x1={412} x2={452} y={42} />
      <Node x={454} y={20} w={110} h={44} label="Write report" sub="draft output" />

      {/* Arrow down to await approval */}
      <ArrowV x={509} y1={64} y2={116} />

      {/* Row 2: approval loop */}
      <Node x={454} y={118} w={110} h={44} label="Await approval" sub="human interrupt" accent />
      <ArrowH x1={454} x2={412} y={140} />  {/* goes left */}
      <Node x={302} y={118} w={108} h={44} label="Revise"     sub="iterate on feedback" />

      {/* Loop back arrow */}
      <line x1={302} y1={140} x2={206} y2={140} style={{ stroke: ARROW, strokeWidth: 1.5 }} />
      <line x1={206} y1={140} x2={206} y2={42}  style={{ stroke: ARROW, strokeWidth: 1.5 }} />
      <polygon points="206,42 202,52 210,52" style={{ fill: ARROW }} />

      {/* Tool gateway note */}
      <rect x={8} y={118} width={130} height={44} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={73} y={137} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 13, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 500 }}>Tool gateway</text>
      <text x={73} y={153} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>risk-tiered, JSON-RPC</text>

      {/* Postgres checkpoints note */}
      <rect x={618} y={64} width={134} height={36} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={685} y={80} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Postgres checkpoints</text>
      <text x={685} y={94} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}>durable state</text>

      {/* pgvector note */}
      <text x={8} y={190} style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>pgvector hybrid search · 89 tests · retrieval + trajectory evals</text>
    </DiagramSVG>
  );
}
