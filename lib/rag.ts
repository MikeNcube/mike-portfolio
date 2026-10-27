// Retrieval layer: absolute BM25 over a unified corpus (KB + static answers),
// Gemini cosine when a key is present, merged by reciprocal rank fusion.

import { KNOWLEDGE_CHUNKS, type KnowledgeChunk } from "./knowledge";
import { bm25Scores } from "./bm25";
import { STATIC_ANSWERS, type StaticAnswer } from "./static-answers";
import { INTENT_CANONICAL, INTENT_EXEMPLARS, type RecruiterIntentId } from "./intent-exemplars";
import { projectBoostIds } from "./intent";
import { expandQuery } from "./grounding";

const EMBED_MODEL = "gemini-embedding-001";
const BATCH_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents`;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
const EMBED_DIMENSIONS = 768;

export const MIN_RELEVANCE_SCORE = 0.35;
export const MIN_BM25_SCORE = 0.9;
export const DEFAULT_K = 6;
const RRF_K = 60;

export function chunkIndexText(chunk: KnowledgeChunk): string {
  const keywords = chunk.keywords?.join(" ") ?? "";
  return `${chunk.title}\n${keywords}\n${chunk.text}`;
}

export type RetrievedChunk = KnowledgeChunk & {
  score: number;
  cannedAnswer?: StaticAnswer;
};

type CorpusDoc = {
  id: string;
  title: string;
  sourceUrl: string;
  text: string;
  keywords?: string[];
  indexText: string;
  cannedAnswer?: StaticAnswer;
};

function exemplarsForQuestion(question: string): string[] {
  const id = (Object.entries(INTENT_CANONICAL) as Array<[RecruiterIntentId, string]>)
    .find(([, q]) => q === question)?.[0];
  if (!id) return [];
  return INTENT_EXEMPLARS[id] ?? [];
}

function buildCorpus(): CorpusDoc[] {
  const kb: CorpusDoc[] = KNOWLEDGE_CHUNKS.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    sourceUrl: chunk.sourceUrl,
    text: chunk.text,
    keywords: chunk.keywords,
    indexText: chunkIndexText(chunk),
  }));
  const staticDocs: CorpusDoc[] = STATIC_ANSWERS.map((sa, i) => {
    const exemplars = exemplarsForQuestion(sa.question);
    const indexText = [sa.question, ...sa.aliases, ...exemplars, sa.answer].join("\n");
    const first = KNOWLEDGE_CHUNKS.find((c) => sa.sourceIds.includes(c.id));
    return {
      id: `static:${i}:${sa.question.slice(0, 40)}`,
      title: sa.question,
      sourceUrl: first?.sourceUrl ?? "https://github.com/MikeNcube",
      text: sa.answer,
      keywords: sa.aliases,
      indexText,
      cannedAnswer: sa,
    };
  });
  return [...kb, ...staticDocs];
}

const CORPUS = buildCorpus();
const KB_DOCS = CORPUS.filter((d) => !d.cannedAnswer);

function docToChunk(doc: CorpusDoc, score: number): RetrievedChunk {
  return {
    id: doc.id,
    title: doc.title,
    sourceUrl: doc.sourceUrl,
    text: doc.cannedAnswer ? doc.cannedAnswer.answer : doc.text,
    keywords: doc.keywords,
    score,
    cannedAnswer: doc.cannedAnswer,
  };
}

function rankBm25(query: string, docs: CorpusDoc[], k: number, floor: number): RetrievedChunk[] {
  if (docs.length === 0) return [];
  const raw = bm25Scores(query, docs.map((d) => d.indexText));
  return docs
    .map((doc, i) => docToChunk(doc, raw[i] ?? 0))
    .filter((c) => c.score >= floor)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function retrieveKeyword(query: string, k = DEFAULT_K): RetrievedChunk[] {
  return rankBm25(query, KB_DOCS, k, 0);
}

function retrieveUnifiedKeyword(query: string, k = DEFAULT_K): RetrievedChunk[] {
  return rankBm25(expandQuery(query), CORPUS, k, MIN_BM25_SCORE);
}

let kbEmbeddingsPromise: Promise<number[][]> | null = null;

function getKnowledgeBaseEmbeddings(apiKey: string): Promise<number[][]> {
  if (!kbEmbeddingsPromise) {
    kbEmbeddingsPromise = embedBatch(
      KNOWLEDGE_CHUNKS.map(chunkIndexText),
      apiKey,
      "RETRIEVAL_DOCUMENT",
    ).catch((err) => {
      kbEmbeddingsPromise = null;
      throw err;
    });
  }
  return kbEmbeddingsPromise;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedBatch(texts: string[], apiKey: string, taskType: string): Promise<number[][]> {
  const body = JSON.stringify({
    requests: texts.map((text) => ({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBED_DIMENSIONS,
    })),
  });

  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body,
  };

  let res = await fetch(BATCH_EMBED_URL, init);
  if (!res.ok) {
    if (res.status === 429 || res.status >= 500) {
      await sleep(1200);
      res = await fetch(BATCH_EMBED_URL, init);
    }
    if (!res.ok) throw new Error(`Embedding API returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as { embeddings?: Array<{ values: number[] }> };
  const vectors = (data.embeddings ?? []).map((e) => e.values);
  if (vectors.length !== texts.length) throw new Error("Embedding API returned unexpected count");
  return vectors;
}

async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBED_DIMENSIONS,
    }),
  };

  let res = await fetch(EMBED_URL, init);
  if (!res.ok) {
    if (res.status === 429 || res.status >= 500) {
      await sleep(800);
      res = await fetch(EMBED_URL, init);
    }
    if (!res.ok) throw new Error(`Embedding API returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as { embedding: { values: number[] } };
  return data.embedding.values;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function retrieveCosine(query: string, apiKey: string, k: number): Promise<RetrievedChunk[]> {
  const [kbVectors, queryVector] = await Promise.all([
    getKnowledgeBaseEmbeddings(apiKey),
    embedQuery(query, apiKey),
  ]);
  return KNOWLEDGE_CHUNKS.map((chunk, i) => ({
    ...chunk,
    score: cosineSimilarity(queryVector, kbVectors[i]),
  }))
    .filter((c) => c.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

function rrfMerge(lists: RetrievedChunk[][], k: number, boostIds: string[]): RetrievedChunk[] {
  const scores = new Map<string, { chunk: RetrievedChunk; rrf: number }>();
  for (const list of lists) {
    list.forEach((chunk, rank) => {
      const add = 1 / (RRF_K + rank + 1);
      const prev = scores.get(chunk.id);
      if (!prev) scores.set(chunk.id, { chunk, rrf: add });
      else prev.rrf += add;
    });
  }
  for (const id of boostIds) {
    const hit = scores.get(id);
    if (hit) hit.rrf += 1 / (RRF_K + 1);
  }
  return [...scores.values()]
    .sort((a, b) => b.rrf - a.rrf)
    .slice(0, k)
    .map((item) => ({ ...item.chunk, score: item.rrf }));
}

export async function retrieve(
  query: string,
  apiKey: string | undefined,
  k = DEFAULT_K,
): Promise<RetrievedChunk[]> {
  const keywordHits = retrieveUnifiedKeyword(query, k);
  const boostIds = projectBoostIds(query);
  if (apiKey) {
    try {
      const cosineHits = await retrieveCosine(query, apiKey, k);
      return rrfMerge([cosineHits, keywordHits], k, boostIds);
    } catch (err) {
      console.error("embedding failed, falling back to keyword search:", err);
    }
  }
  return rrfMerge([keywordHits], k, boostIds);
}

export function filterToLinkSources(
  chunks: RetrievedChunk[],
): Array<{ title: string; url: string }> {
  return chunks
    .filter((c) => c.sourceUrl.startsWith("http"))
    .map((c) => ({ title: c.title, url: c.sourceUrl }));
}

export function promptChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  return chunks.map((chunk) => {
    if (!chunk.cannedAnswer) return chunk;
    return {
      ...chunk,
      title: chunk.cannedAnswer.question,
      text: chunk.cannedAnswer.answer,
    };
  });
}
