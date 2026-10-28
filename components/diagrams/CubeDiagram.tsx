import { Diagram, FlowRow, Node, ArrowH, ArrowV, Caption, Note } from "./shared";

export default function CubeDiagram() {
  return (
    <Diagram label="Cube coding agent live path, with a separate sandboxed eval harness and trusted verifier">
      <p className="diagram-label text-ink-muted" style={{ fontSize: 14 }}>Live path</p>
      <FlowRow>
        <Node label="User intent" sub="coding task" />
        <ArrowH /><ArrowV />
        <Node label="Plan" sub="decompose" accent />
        <ArrowH /><ArrowV />
        <Node label="Tool call" sub="provider-agnostic adapters" />
        <ArrowH /><ArrowV />
        <Node label="Execute" sub="writes need approval" accent />
        <ArrowH /><ArrowV />
        <Node label="Response" />
      </FlowRow>

      <Note>
        Approval prompts fire before writes. Rejected writes return to Plan.
      </Note>

      <div className="mt-2 rounded-[10px] border border-dashed border-ink/[0.12] p-3 md:p-4">
        <p className="diagram-label text-ink-muted mb-2" style={{ fontSize: 14 }}>
          Sandboxed eval harness (not on the live path)
        </p>
        <FlowRow>
          <Node label="Test scenarios" sub="fixed inputs" muted />
          <ArrowH /><ArrowV />
          <Node label="Agent run" sub="sandboxed" />
          <ArrowH /><ArrowV />
          <Node label="Trusted verifier" sub="checks outputs" accent />
          <ArrowH /><ArrowV />
          <Node label="Pass or fail" muted />
        </FlowRow>
      </div>

      <Caption>
        Prototype. Own tool-calling loop. Provider-agnostic adapters isolate the model API.
      </Caption>
    </Diagram>
  );
}
