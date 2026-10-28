import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption, Note } from "./shared";

export default function ClaimsOpsDiagram() {
  return (
    <Diagram label="Claims operations platform: role and shift routing into a case state machine for claims, cash and courtesy services, with PII controls and a public tracking link">
      <FlowRow>
        <Node label="Roles and shifts" sub="routing" />
        <ArrowH /><ArrowV />
        <Node label="Case state machine" sub="department hand-offs" accent />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="Claims" />
        <ArrowH /><ArrowV />
        <Node label="Cash services" />
        <ArrowH /><ArrowV />
        <Node label="Courtesy services" />
      </FlowRow>

      <div className="mt-1 grid gap-2 md:grid-cols-2">
        <Node label="PII" sub="encrypted at the app layer; masked on list views" accent />
        <Node label="PII-read audit" sub="who read PII" />
      </div>

      <Note>
        Access is enforced at both the middleware and API layers. Public case-tracking link and compliance exports.
      </Note>

      <Caption>
        Approved · standby. Approved, production-ready standby (failover) for the company&apos;s live claims system at Zororo-Phumulani. POPIA-aware. Private repo.
      </Caption>
    </Diagram>
  );
}
