import { embedMany, embed } from "ai";
import { createEmbeddingModel } from "@/lib/llm/providers";

const BATCH_SIZE = 100;

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = createEmbeddingModel() as any;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({ model, values: batch });
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = createEmbeddingModel() as any;
  const { embedding } = await embed({ model, value: text });
  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
