import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption, Note } from "./shared";

export default function ZdiDiagram() {
  return (
    <Diagram label="ZDI signature and approval workflow: three apps call one FastAPI API, then capability check and workflow guards, a config-driven route from submitted through manager and accounts review to archived with a return-for-correction loop, a Signature Service writing hash-chained evidence, a worker archival PDF, and an evidence check">
      <FlowRow>
        <Node label="Requester" sub="secure link, no login" />
        <ArrowH /><ArrowV />
        <Node label="Manager app" />
        <ArrowH /><ArrowV />
        <Node label="Accounts + IT" sub="workspaces" />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Node label="FastAPI API" sub="one backend, one routing contract" accent />

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="Capability check" sub="fails closed" accent />
        <ArrowH /><ArrowV />
        <Node label="Workflow guards" sub="segregation of duties" accent />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Note>Config-driven route engine</Note>
      <FlowRow>
        <Node label="Submitted" />
        <ArrowH /><ArrowV />
        <Node label="Manager review" />
        <ArrowH /><ArrowV />
        <Node label="Accounts review" />
        <ArrowH /><ArrowV />
        <Node label="Archived" accent />
      </FlowRow>
      <Node
        label="Return for correction"
        sub="new revision; route restarts"
        muted
      />

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node
          label="Signature Service"
          sub="signer, capacity, intent, method, SHA-256"
          accent
        />
        <ArrowH /><ArrowV />
        <Node
          label="Evidence table"
          sub="append-only, hash-chained"
          accent
        />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Node label="Worker" sub="archival PDF with evidence appendix" />

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Node label="Evidence check" sub="re-verifies hashes" />

      <Caption>No AI in approvals · no payments executed</Caption>
    </Diagram>
  );
}
