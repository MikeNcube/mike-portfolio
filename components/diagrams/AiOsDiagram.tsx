import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption, Note } from "./shared";

export default function AiOsDiagram() {
  return (
    <Diagram label="Zororo AI OS: every event passes Presidio PII detection, an OPA policy check, risk scoring, then ALLOW MONITOR APPROVE or BLOCK, and a hash-chained audit log">
      <Node label="Event" sub="claims, policy changes, LLM queries, tool calls" />

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node
          label="PII detection"
          sub="Presidio plus SA ID, Zimbabwe ID, asylum/refugee permits"
          accent
        />
        <ArrowH /><ArrowV />
        <Node label="OPA policy check" sub="Rego" accent />
        <ArrowH /><ArrowV />
        <Node label="Risk scoring" sub="fixed rules plus anomaly statistics" />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="ALLOW" />
        <ArrowH /><ArrowV />
        <Node label="MONITOR" />
        <ArrowH /><ArrowV />
        <Node label="APPROVE" />
        <ArrowH /><ArrowV />
        <Node label="BLOCK" accent />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Node label="Audit log" sub="tamper-evident, hash-chained" accent />

      <Note>
        If any step fails, the event is blocked by default. MCP gateway: capability tokens and replay protection.
      </Note>

      <Caption>
        Built. Early stage, not deployed. 310 passing tests. LangGraph and pgvector planned.
      </Caption>
    </Diagram>
  );
}
