// Lead-management CRM — production system architecture diagram.
import { DiagramSVG, Node, ArrowH, ArrowV, TEXT_MUTED } from "./shared";

export default function CrmDiagram() {
  return (
    <DiagramSVG
      viewBox="0 0 720 220"
      label="CRM architecture: incoming lead → grader → round-robin router → PostgreSQL / Redis / Celery → policy adapter"
    >
      {/* Row 1: request path */}
      <Node x={8}   y={20} w={110} h={44} label="Incoming lead" sub="40+ users, 10 roles" />
      <ArrowH x1={118} x2={158} y={42} accent />
      <Node x={160} y={20} w={110} h={44} label="Lead grader"   sub="rules-based, deterministic" accent />
      <ArrowH x1={270} x2={310} y={42} accent />
      <Node x={312} y={20} w={120} h={44} label="Round-robin router" sub="role-based access" accent />

      {/* Router → PostgreSQL */}
      <ArrowV x={372} y1={64} y2={116} />
      <Node x={312} y={118} w={120} h={44} label="PostgreSQL"   sub="leads · agents · records" />

      {/* PostgreSQL → Redis + Celery */}
      <ArrowH x1={432} x2={472} y={140} />
      <Node x={474} y={118} w={120} h={44} label="Redis · Celery" sub="async tasks, session store" />

      {/* Policy adapter (bottom left) */}
      <ArrowV x={372} y1={162} y2={200} />
      <Node x={160} y={182} w={130} h={36} label="Policy adapter" sub="one file per integration" accent />
      <ArrowH x1={290} x2={312} y={200} />
      {/* Arrow from PostgreSQL to policy adapter */}
      <line x1={312} y1={162} x2={290} y2={200} style={{ stroke: "var(--d-arrow-muted)", strokeWidth: 1.5, strokeDasharray: "3 2" }} />

      {/* Auth note */}
      <rect x={474} y={182} width={120} height={36} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={534} y={198} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 13, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 500 }}>Auth</text>
      <text x={534} y={212} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>JWT · server-side revocation</text>

      {/* Docker + migrations note */}
      <rect x={8} y={118} width={110} height={44} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={63} y={137} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 500 }}>Docker deploy</text>
      <text x={63} y={153} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}>reversible migrations</text>
    </DiagramSVG>
  );
}
