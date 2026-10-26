import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption } from "./shared";

export default function CrmDiagram() {
  return (
    <Diagram label="Lead-management CRM: incoming lead, deterministic grader, round-robin router, PostgreSQL, Redis and Celery, policy adapter">
      <FlowRow>
        <Node label="Incoming lead" sub="40+ people, around 10 roles" />
        <ArrowH /><ArrowV />
        <Node label="Deterministic grader" sub="rules-based, not ML" accent />
        <ArrowH /><ArrowV />
        <Node label="Round-robin router" sub="strict assignment" accent />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="PostgreSQL" sub="leads, agents, records" />
        <ArrowH /><ArrowV />
        <Node label="Redis and Celery" sub="async tasks" />
        <ArrowH /><ArrowV />
        <Node label="Policy adapter" sub="one file per live integration change" accent />
      </FlowRow>

      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <Node label="Session revocation" sub="server-side" muted />
        <Node label="Migrations" sub="reversible and additive" muted />
      </div>

      <Caption>
        Production at Zororo-Phumulani. FastAPI, PostgreSQL, Redis, Celery, Docker. Full test suite.
      </Caption>
    </Diagram>
  );
}
