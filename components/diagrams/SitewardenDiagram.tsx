import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption, Note } from "./shared";

export default function SitewardenDiagram() {
  return (
    <Diagram label="Sitewarden LangGraph state graph: Plan, Analyse, Self-check, Write report, Await approval, Revise">
      <FlowRow>
        <Node label="Plan" sub="decompose the goal" accent />
        <ArrowH /><ArrowV />
        <Node label="Analyse" sub="read-only tools" />
        <ArrowH /><ArrowV />
        <Node label="Self-check" sub="verify the plan" />
        <ArrowH /><ArrowV />
        <Node label="Write report" sub="draft the output" />
      </FlowRow>

      <div className="flex justify-center sm:justify-end sm:pr-8">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="Await approval" sub="human interrupt" accent />
        <ArrowH /><ArrowV />
        <Node label="Revise" sub="apply feedback" />
      </FlowRow>

      <Note>
        If the human rejects the report, Revise loops back to Analyse. Postgres checkpoints keep state across restarts.
      </Note>

      <div className="mt-1 grid gap-2 sm:grid-cols-3">
        <Node label="Postgres checkpoints" sub="durable graph state" muted />
        <Node label="Risk-tiered gateway" sub="writes need approval" muted />
        <Node label="pgvector hybrid search" sub="89 tests, cited retrieval" muted />
      </div>

      <Caption>
        Prototype, not deployed. FastAPI. Role-scoped steps. MCP-style JSON-RPC endpoint.
      </Caption>
    </Diagram>
  );
}
