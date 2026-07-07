// Minimal retrieval layer for the portfolio assistant.
// Embeds the knowledge base once per server instance with the Gemini
// embedding API, then answers queries via cosine-similarity retrieval.

import { KNOWLEDGE_CHUNKS, type KnowledgeChunk } from './knowledge';

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
const BATCH_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents`;
const EMBED_DIMENSIONS = 768;

export type RetrievedChunk = KnowledgeChunk & { score: number };

let kbEmbeddingsPromise: Promise<number[][]> | null = null;

// Embeds all knowledge-base chunks in one batch call (cached per instance).
function getKnowledgeBaseEmbeddings(apiKey: string): Promise<number[][]> {
  if (!kbEmbeddingsPromise) {
    kbEmbeddingsPromise = embedBatch(
      KNOWLEDGE_CHUNKS.map(c => `${c.title}\n${c.text}`),
      apiKey,
      'RETRIEVAL_DOCUMENT',
    ).catch(err => {
      kbEmbeddingsPromise = null;
      throw err;
    });
  }
  return kbEmbeddingsPromise;
}

// Calls the Gemini batch embedding endpoint for a list of texts.
async function embedBatch(texts: string[], apiKey: string, taskType: string): Promise<number[][]> {
  const res = await fetch(BATCH_EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      requests: texts.map(text => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBED_DIMENSIONS,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Embedding API returned ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const vectors = (data.embeddings ?? []).map((e: { values: number[] }) => e.values);
  if (vectors.length !== texts.length) throw new Error('Embedding API returned an unexpected count');
  return vectors;
}

// Embeds a single query string for retrieval.
async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: EMBED_DIMENSIONS,
    }),
  });
  if (!res.ok) throw new Error(`Embedding API returned ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values as number[];
}

// Cosine similarity between two equal-length vectors.
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

// Retrieves the top-k most relevant knowledge chunks for a query.
export async function retrieve(query: string, apiKey: string, k = 4): Promise<RetrievedChunk[]> {
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
