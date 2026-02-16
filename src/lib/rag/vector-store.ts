import fs from "fs";
import path from "path";
import { cosineSimilarity } from "./embeddings";

const VECTORS_DIR = path.join(process.cwd(), "data", "vectors");

interface StoredVector {
  id: string;
  embedding: number[];
}

interface VectorIndex {
  vectors: StoredVector[];
  dimension: number;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getIndexPath(notebookId: string): string {
  return path.join(VECTORS_DIR, `${notebookId}.json`);
}

function loadIndex(notebookId: string): VectorIndex {
  const indexPath = getIndexPath(notebookId);
  if (fs.existsSync(indexPath)) {
    const data = fs.readFileSync(indexPath, "utf-8");
    return JSON.parse(data);
  }
  return { vectors: [], dimension: 0 };
}

function saveIndex(notebookId: string, index: VectorIndex) {
  ensureDir(VECTORS_DIR);
  const indexPath = getIndexPath(notebookId);
  fs.writeFileSync(indexPath, JSON.stringify(index));
}

export function addVectors(
  notebookId: string,
  ids: string[],
  embeddings: number[][]
) {
  const index = loadIndex(notebookId);

  for (let i = 0; i < ids.length; i++) {
    const existing = index.vectors.findIndex((v) => v.id === ids[i]);
    if (existing >= 0) {
      index.vectors[existing].embedding = embeddings[i];
    } else {
      index.vectors.push({ id: ids[i], embedding: embeddings[i] });
    }
  }

  index.dimension = embeddings[0]?.length || index.dimension;
  saveIndex(notebookId, index);
}

export function searchVectors(
  notebookId: string,
  queryEmbedding: number[],
  topK: number = 5
): { id: string; score: number }[] {
  const index = loadIndex(notebookId);

  if (index.vectors.length === 0) {
    return [];
  }

  const scored = index.vectors.map((v) => ({
    id: v.id,
    score: cosineSimilarity(queryEmbedding, v.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function removeVectors(notebookId: string, ids: string[]) {
  const index = loadIndex(notebookId);
  const idSet = new Set(ids);
  index.vectors = index.vectors.filter((v) => !idSet.has(v.id));
  saveIndex(notebookId, index);
}

export function deleteNotebookIndex(notebookId: string) {
  const indexPath = getIndexPath(notebookId);
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath);
  }
}
