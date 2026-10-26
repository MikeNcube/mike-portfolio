// Digi App Form — regulated insurance intake architecture diagram.
import { DiagramSVG, Node, ArrowH, ArrowV, TEXT_MUTED } from "./shared";

export default function DigiFormDiagram() {
  return (
    <DiagramSVG
      viewBox="0 0 640 200"
      label="Digi App Form: multi-step form → server validation → SQLite record → PDF generation + admin dashboard"
    >
      {/* Applicant flow */}
      <Node x={8}   y={20} w={130} h={44} label="Multi-step form" sub="applicant-facing" accent />
      <ArrowH x1={138} x2={178} y={42} accent />
      <Node x={180} y={20} w={130} h={44} label="Server validation" sub="before any persistence" accent />
      <ArrowH x1={310} x2={350} y={42} />
      <Node x={352} y={20} w={110} h={44} label="SQLite record"    sub="durable submission" />

      {/* From SQLite, two branches */}
      <ArrowV x={407} y1={64} y2={116} />

      {/* PDF branch */}
      <Node x={352} y={118} w={110} h={44} label="PDF generation"  sub="automated policy doc" />
      <ArrowH x1={462} x2={502} y={140} />
      <Node x={504} y={118} w={110} h={44} label="Document upload" sub="supporting files" />

      {/* Admin branch */}
      <ArrowV x={190} y1={64} y2={116} />
      <Node x={8}   y={118} w={130} h={44} label="Document upload" sub="file store" />
      <ArrowH x1={138} x2={178} y={140} />
      <Node x={180} y={118} w={130} h={44} label="Admin dashboard" sub="staff review flow" />

      {/* Backup note */}
      <rect x={504} y={20} width={126} height={44} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={567} y={39} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 13, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 500 }}>Scheduled backup</text>
      <text x={567} y={55} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>audit trail complete</text>

      <text x={8} y={192} style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Python · Flask · SQLite · Docker · Zororo-Phumulani production</text>
    </DiagramSVG>
  );
}
