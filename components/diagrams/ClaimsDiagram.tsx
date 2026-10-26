// Claims document extraction pipeline diagram.
import { DiagramSVG, Node, ArrowH, ArrowD, TEXT_MUTED, ARROW } from "./shared";

export default function ClaimsDiagram() {
  return (
    <DiagramSVG
      viewBox="0 0 700 220"
      label="Claims pipeline: scanned PDF → Claude vision → Pydantic validation → per-field confidence → high confidence processed, low confidence routed to human review"
    >
      {/* Main horizontal flow */}
      <Node x={8}   y={58} w={110} h={44} label="Scanned PDF"  sub="claims document" />
      <ArrowH x1={118} x2={162} y={80} accent />
      <Node x={164} y={58} w={120} h={44} label="Claude vision" sub="field extraction" accent />
      <ArrowH x1={284} x2={328} y={80} accent />
      <Node x={330} y={58} w={120} h={44} label="Pydantic schema" sub="structured validation" accent />
      <ArrowH x1={450} x2={494} y={80} />
      <Node x={496} y={58} w={126} h={44} label="Per-field confidence" sub="score per extracted field" />

      {/* Confidence gate */}
      <line x1={559} y1={102} x2={559} y2={130} style={{ stroke: "var(--d-arrow-muted)", strokeWidth: 1.5 }} />
      <text x={559} y={148} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 13, fontFamily: "var(--font-sans, sans-serif)" }}>confidence gate</text>

      {/* High confidence → processed */}
      <line x1={559} y1={155} x2={435} y2={175} style={{ stroke: ARROW, strokeWidth: 1.5 }} />
      <polygon points="435,175 444,169 441,178" style={{ fill: ARROW }} />
      <Node x={330} y={172} w={110} h={40} label="Processed"   sub="auto-approved" />

      {/* Low confidence → human review */}
      <line x1={559} y1={155} x2={635} y2={175} style={{ stroke: "var(--d-arrow-muted)", strokeWidth: 1.5 }} />
      <polygon points="635,175 628,169 628,178" style={{ fill: "var(--d-arrow-muted)" }} />
      <Node x={580} y={172} w={118} h={40} label="Human review" sub="needs-review flag" accent />

      {/* Note */}
      <text x={8} y={200} style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Built at Zororo-Phumulani · Python · Anthropic Claude API · Pydantic · FastAPI</text>
    </DiagramSVG>
  );
}
