// Retrieval layer for the portfolio RAG assistant.
// Cosine similarity over Gemini embeddings, with BM25 keyword fallback
// when the embedding call fails or no API key is present.

import { KNOWLEDGE_CHUNKS, type KnowledgeChunk } from "./knowledge";
import { bm25Scores } from "./bm25";

const EMBED_MODEL = "gemini-embedding-001";
const BATCH_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents`;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
const EMBED_DIMENSIONS = 768;

export const MIN_RELEVANCE_SCORE = 0.35;

export type RetrievedChunk = KnowledgeChunk & { score: number };

let kbEmbeddingsPromise: Promise<number[][]> | null = null;

function getKnowledgeBaseEmbeddings(apiKey: string): Promise<number[][]> {
  if (!kbEmbeddingsPromise) {
    kbEmbeddingsPromise = embedBatch(
      KNOWLEDGE_CHUNKS.map((c) => `${c.title}\n${c.text}`),
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

export function retrieveKeyword(query: string, k = 4): RetrievedChunk[] {
  const docs = KNOWLEDGE_CHUNKS.map((c) => `${c.title}\n${c.text}`);
  const raw = bm25Scores(query, docs);
  const max = Math.max(...raw, 0);
  if (max <= 0) return [];

  return KNOWLEDGE_CHUNKS.map((chunk, i) => ({
    ...chunk,
    score: raw[i] / max,
  }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
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
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function retrieve(
  query: string,
  apiKey: string | undefined,
  k = 4,
): Promise<RetrievedChunk[]> {
  if (apiKey) {
    try {
      return await retrieveCosine(query, apiKey, k);
    } catch (err) {
      console.error("embedding failed, falling back to keyword search:", err);
    }
  }
  return retrieveKeyword(query, k);
}

export function filterToLinkSources(
  chunks: RetrievedChunk[],
): Array<{ title: string; url: string }> {
  return chunks
    .filter((c) => c.sourceUrl.startsWith("http"))
    .map((c) => ({ title: c.title, url: c.sourceUrl }));
}
