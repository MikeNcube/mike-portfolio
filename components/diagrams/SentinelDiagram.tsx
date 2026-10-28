import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption } from "./shared";

export default function SentinelDiagram() {
  return (
    <Diagram label="Proactive Sentinel: event sources, Redis SHA-256 dedup, MITRE ATT&CK correlation, severity-tiered dispatcher, flag, IP block, audit log">
      <FlowRow>
        <Node label="Event sources" sub="agents and log shippers" />
        <ArrowH /><ArrowV />
        <Node label="Redis dedup" sub="SHA-256 fingerprint" accent />
        <ArrowH /><ArrowV />
        <Node label="MITRE ATT&CK" sub="chain correlation" accent />
        <ArrowH /><ArrowV />
        <Node label="Persisted alert" sub="PostgreSQL" />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Node label="Action dispatcher" sub="severity-tiered" accent />

      <div className="grid gap-2 md:grid-cols-3">
        <Node label="Flag" sub="lower severity" muted />
        <Node label="Block IP" sub="Redis, 24-hour TTL" accent />
        <Node label="Audit log" sub="immutable" />
      </div>

      <Caption>
        Python 3.11, Flask, PostgreSQL 15, Redis 7, OpenTelemetry, Docker, Railway.
        44 passing tests. POPIA: PII masked at ingest, AES-256-GCM, per-request tenant isolation.
      </Caption>
    </Diagram>
  );
}
