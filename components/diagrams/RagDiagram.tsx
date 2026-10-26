import { Diagram, FlowRow, Node, ArrowH, ArrowV, Caption } from "./shared";

export default function RagDiagram() {
  return (
    <Diagram label="RAG pipeline: knowledge base and query go into Embed, then Retrieve, Gate, Generate, Cite sources">
      <div className="flex flex-col md:flex-row gap-2 md:items-stretch">
        <Node label="Knowledge base" sub="curated chunks" muted />
        <Node label="Visitor question" sub="capped at 500 chars" muted />
      </div>

      <FlowRow>
        <Node label="Embed" sub="Gemini embedding-001" accent />
        <ArrowH /><ArrowV />
        <Node label="Retrieve" sub="cosine similarity, top 6" />
        <ArrowH /><ArrowV />
        <Node label="Gate" sub="drop below 0.35" />
        <ArrowH /><ArrowV />
        <Node label="Generate" sub="Gemini 2.5 Flash" accent />
        <ArrowH /><ArrowV />
        <Node label="Cite sources" sub="http links only" accent />
      </FlowRow>

      <Caption>
        Knowledge-base embeddings are cached per server instance. The query is embedded per request.
      </Caption>
    </Diagram>
  );
}
