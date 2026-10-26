// RAG assistant pipeline architecture diagram.
import { DiagramSVG, Node, ArrowH, FILL, STROKE, TEXT_MUTED, ARROW } from "./shared";

export default function RagDiagram() {
  // 5 nodes in a horizontal chain: Knowledge base feeds into Embed, then pipeline continues.
  // Layout: 760 wide, 160 tall.
  return (
    <DiagramSVG viewBox="0 0 760 160" label="RAG pipeline: knowledge base → embed → retrieve → gate → generate → cite">
      {/* KB box at top */}
      <Node x={8}   y={8}  w={130} h={40} label="Knowledge base" sub="KNOWLEDGE_CHUNKS" />
      {/* Query box */}
      <Node x={8}   y={100} w={130} h={40} label="Visitor question" sub="≤ 500 chars" />

      {/* Both go into Embed */}
      <line x1={138} y1={28}  x2={182} y2={64} style={{ stroke: ARROW, strokeWidth: 1.5, strokeDasharray: "4 2" }} />
      <line x1={138} y1={120} x2={182} y2={76} style={{ stroke: ARROW, strokeWidth: 1.5 }} />

      <Node x={184} y={50} w={110} h={44} label="Embed" sub="gemini-embed-001" accent />
      <ArrowH x1={294} x2={338} y={72} accent />
      <Node x={340} y={50} w={100} h={44} label="Retrieve" sub="cosine top-4" />
      <ArrowH x1={440} x2={484} y={72} />
      <Node x={486} y={50} w={96}  h={44} label="Gate" sub="score ≥ 0.35" />
      <ArrowH x1={582} x2={626} y={72} />
      <Node x={628} y={50} w={96}  h={44} label="Generate" sub="Gemini 2.5 Flash" accent />

      {/* Cite label below */}
      <line x1={724} y1={94} x2={724} y2={130} style={{ stroke: ARROW, strokeWidth: 1.5 }} />
      <text x={694} y={150} style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Cite sources</text>

      {/* Cache note */}
      <rect x={184} y={108} width={110} height={28} rx={6} style={{ fill: FILL, stroke: STROKE, strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={239} y={126} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}>Cached per instance</text>
    </DiagramSVG>
  );
}
