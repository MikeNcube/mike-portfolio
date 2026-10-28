import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption } from "./shared";

export default function DigiFormDiagram() {
  return (
    <Diagram label="Digi App Form: multi-step intake, server-side validation, policy PDF generation, staff admin">
      <FlowRow>
        <Node label="Multi-step intake" sub="applicant-facing" accent />
        <ArrowH /><ArrowV />
        <Node label="Server-side validation" sub="before anything is persisted" accent />
        <ArrowH /><ArrowV />
        <Node label="Stored application" />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="Policy PDF generation" sub="automated from the accepted application" />
        <ArrowH /><ArrowV />
        <Node label="Staff admin" sub="review dashboard" />
      </FlowRow>

      <Caption>
        Shipped at Zororo-Phumulani. Python, Flask, SQLite, Docker.
      </Caption>
    </Diagram>
  );
}
