import { Diagram, FlowRow, Node, ArrowH, ArrowV, ArrowDown, Caption, Note } from "./shared";

export default function SocialAgentDiagram() {
  return (
    <Diagram label="Multi-agent content pipeline: GitHub, ArXiv and O'Reilly signals through research, strategy and content agents, then a FastAPI dashboard for human approval">
      <FlowRow>
        <Node label="GitHub" muted />
        <ArrowH /><ArrowV />
        <Node label="ArXiv" muted />
        <ArrowH /><ArrowV />
        <Node label="O'Reilly" muted />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <FlowRow>
        <Node label="Research agent" accent />
        <ArrowH /><ArrowV />
        <Node label="Strategy agent" accent />
        <ArrowH /><ArrowV />
        <Node label="Content agent" accent />
      </FlowRow>

      <div className="flex justify-center">
        <ArrowDown />
      </div>

      <Node label="FastAPI dashboard" sub="human approval before anything is scheduled" accent />

      <Note>
        Local Ollama at zero API cost. Versioned prompt templates. Evals are in progress.
      </Note>

      <Caption>
        Prototype. Nothing is scheduled until a human approves it. Private repo.
      </Caption>
    </Diagram>
  );
}
