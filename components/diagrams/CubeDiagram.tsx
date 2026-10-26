// Cube coding agent — tool-calling loop diagram.
import { DiagramSVG, Node, ArrowH, ArrowV, ArrowD, TEXT_MUTED, ARROW } from "./shared";

export default function CubeDiagram() {
  return (
    <DiagramSVG
      viewBox="0 0 640 220"
      label="Cube agent: user intent → plan → tool select → approval (for writes) → execute → verifier → response"
    >
      {/* Top row: main loop */}
      <Node x={8}   y={20} w={110} h={44} label="User intent"  sub="coding task" />
      <ArrowH x1={118} x2={162} y={42} accent />
      <Node x={164} y={20} w={100} h={44} label="Plan"         sub="decompose" accent />
      <ArrowH x1={264} x2={308} y={42} accent />
      <Node x={310} y={20} w={100} h={44} label="Tool call"    sub="provider-agnostic" />
      <ArrowH x1={410} x2={454} y={42} />
      <Node x={456} y={20} w={106} h={44} label="Verifier"     sub="sandboxed checks" accent />

      {/* Verifier → Response */}
      <ArrowV x={509} y1={64} y2={116} />
      <Node x={456} y={118} w={106} h={44} label="Response"    sub="to user" />

      {/* Approval branch for write tools */}
      <ArrowV x={360} y1={64} y2={116} />
      <Node x={310} y={118} w={100} h={44} label="Approval?"   sub="writes only" accent />

      {/* Rejected → back to plan */}
      <line x1={310} y1={140} x2={214} y2={140} style={{ stroke: ARROW, strokeWidth: 1.5, strokeDasharray: "4 2" }} />
      <polygon points="214,140 222,136 222,144" style={{ fill: ARROW }} />
      <text x={256} y={133} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}>rejected</text>

      {/* Approved → execute */}
      <ArrowH x1={410} x2={450} y={140} />
      <Node x={452} y={118} w={0} h={0} label="" />  {/* spacer, verifier reused */}

      {/* Provider adapters note */}
      <rect x={8} y={118} width={130} height={44} rx={8} style={{ fill: "var(--d-fill)", stroke: "var(--d-stroke)", strokeWidth: 1, strokeDasharray: "4 2" }} />
      <text x={73} y={137} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 13, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 500 }}>Provider adapters</text>
      <text x={73} y={153} textAnchor="middle" style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Claude · GPT · swap one file</text>

      <text x={8} y={195} style={{ fill: TEXT_MUTED, fontSize: 12, fontFamily: "var(--font-sans, sans-serif)" }}>Read tools run freely. Write tools require explicit approval before execution.</text>
    </DiagramSVG>
  );
}
