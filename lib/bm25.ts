// Minimal BM25 over the in-memory knowledge base.
// Used when Gemini embeddings are unavailable so retrieval still works.

const K1 = 1.2;
const B = 0.75;

const STOP = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "for",
  "with", "at", "by", "from", "as", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "me", "him", "her",
  "my", "your", "our", "their", "what", "which", "who", "whom", "how",
  "do", "does", "did", "can", "could", "would", "should", "will", "just",
  "about", "into", "over", "after", "before", "than", "too", "very",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function bm25Scores(query: string, documents: string[]): number[] {
  const qTerms = tokenize(query);
  if (qTerms.length === 0) return documents.map(() => 0);

  const docs = documents.map(tokenize);
  const n = docs.length;
  const avgdl = docs.reduce((s, d) => s + d.length, 0) / Math.max(n, 1);

  const df = new Map<string, number>();
  for (const term of new Set(qTerms)) {
    let count = 0;
    for (const d of docs) {
      if (d.includes(term)) count += 1;
    }
    df.set(term, count);
  }

  return docs.map((d) => {
    const tfMap = new Map<string, number>();
    for (const t of d) tfMap.set(t, (tfMap.get(t) ?? 0) + 1);
    const dl = d.length || 1;
    let score = 0;
    for (const term of qTerms) {
      const tf = tfMap.get(term) ?? 0;
      if (tf === 0) continue;
      const nq = df.get(term) ?? 0;
      const idf = Math.log((n - nq + 0.5) / (nq + 0.5) + 1);
      const denom = tf + K1 * (1 - B + B * (dl / avgdl));
      score += idf * ((tf * (K1 + 1)) / denom);
    }
    return score;
  });
}
