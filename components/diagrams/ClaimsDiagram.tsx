import { Diagram, FlowRow, Node, ArrowH, ArrowV, Caption } from "./shared";

export default function ClaimsDiagram() {
  return (
    <Diagram label="Claims document extraction: Claude vision, Pydantic validation, per-field confidence, needs-review flag for human verification">
      <FlowRow>
        <Node label="Claims document" />
        <ArrowH /><ArrowV />
        <Node label="Claude vision" sub="field extraction" accent />
        <ArrowH /><ArrowV />
        <Node label="Pydantic schema" sub="structured validation" accent />
      </FlowRow>

      <FlowRow>
        <Node label="Per-field confidence" sub="each field scored" accent />
        <ArrowH /><ArrowV />
        <Node label="Needs-review flag" sub="human verification" accent />
      </FlowRow>

      <Caption>
        Built at Zororo-Phumulani. Ready for production, pending management approval.
        Python, Anthropic Claude API, Pydantic, FastAPI.
      </Caption>
    </Diagram>
  );
}
