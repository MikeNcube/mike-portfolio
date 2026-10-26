// Proactive Sentinel — multi-tenant SOC platform architecture diagram.
import { DiagramSVG, Node, ArrowH, ArrowV, TEXT_MUTED, ARROW } from "./shared";

export default function SentinelDiagram() {
  return (
    <DiagramSVG
      viewBox="0 0 720 230"
      label="Proactive Sentinel: event sources → Redis SHA-256 dedup → MITRE ATT&CK correlation → severity-tiered action dispatcher → flag / block IP / audit log"
    >
      {/* Event sources */}
      <Node x={8}   y={20} w={110} h={44} label="Event sources"  sub="agents · log shippers" />
      <ArrowH x1={118} x2={162} y={42} accent />

      {/* Dedup */}
      <Node x={164} y={20} w={120} h={44} label="Redis dedup"    sub="SHA-256 fingerprint" accent />
      <ArrowH x1={284} x2={328} y={42} accent />

      {/* MITRE correlation */}
      <Node x={330} y={20} w={130} h={44} label="MITRE ATT&CK"   sub="chain correlation" accent />
      <ArrowH x1={460} x2={504} y={42} />
      <Node x={506} y={20} w={130} h={44} label="Alert persisted" sub="PostgreSQL 15" />

      {/* Action dispatcher */}
      <ArrowV x={571} y1={64} y2={116} />
      <Node x={506} y={118} w={130} h={44} label="Action dispatcher" sub="severity-tiered" accent />

      {/* Three outcomes */}
      {/* Flag */}
      <line x1={506} y1={140} x2={406} y2={176} style={{ stroke: ARROW, strokeWidth: 1.5 }} />
      <polygon points="406,176 414,168 414,178" style={{ fill: ARROW }} />
      <Node x={330} y={174} w={80} h={36} label="Flag"    sub="low severity" />

      {/* Block IP */}
      <ArrowV x={571} y1={162} y2={174} />
      <Node x={506} y={174} w={130} h={36} label="Block IP (24h TTL)" sub="Redis · critical" accent />

      {/* Audit */}
      <line x1={636} y1={140} x2={656} y2={176} style={{ stroke: "var(--d-arrow-muted)", strokeWidth: 1.5 }} />
      <polygon points="656,176 650,168 658,170" style={{ fill: "var(--d-arrow-muted)" }} />
      <Node x={624} y={174} w={90} h={36} label="Audit log" sub="immutable" />

      {/* POPIA note */}
      <rect x={8} y={118} width={130} height={44} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={73} y={137} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 500 }}>POPIA compliance</text>
      <text x={73} y={152} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}>PII masked · AES-256-GCM · per-tenant</text>

      <text x={8} y={222} style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Python 3.11 · Flask · PostgreSQL 15 · Redis 7 · OpenTelemetry · Railway · 44 passing tests</text>
    </DiagramSVG>
  );
}
