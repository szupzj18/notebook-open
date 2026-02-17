import { db, schema } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";
import { searchVectors } from "./vector-store";
import type { ChatSource } from "@/types";

export async function retrieveContext(
  notebookId: string,
  query: string,
  topK: number = 6
): Promise<ChatSource[]> {
  const queryEmbedding = await generateEmbedding(query);

  const results = searchVectors(notebookId, queryEmbedding, topK);

  if (results.length === 0) {
    return [];
  }

  const chunkIds = results.map((r) => r.id);
  const scoreMap = new Map(results.map((r) => [r.id, r.score]));

  const chunkRows = db
    .select()
    .from(schema.chunks)
    .where(inArray(schema.chunks.id, chunkIds))
    .all();

  const docIds = [...new Set(chunkRows.map((c) => c.documentId))];

  const docRows = db
    .select()
    .from(schema.documents)
    .where(inArray(schema.documents.id, docIds))
    .all();
  const docMap = new Map(docRows.map((d) => [d.id, d]));

  const sources: ChatSource[] = chunkRows
    .map((chunk) => {
      const doc = docMap.get(chunk.documentId);
      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentName: doc?.filename || "Unknown",
        content: chunk.content,
        score: scoreMap.get(chunk.id) || 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  return sources;
}

export function buildContextPrompt(sources: ChatSource[]): string {
  if (sources.length === 0) {
    return "";
  }

  let prompt =
    "Here are relevant excerpts from the uploaded documents. Use them to answer the user's question. " +
    "Cite your sources using [1], [2], etc. notation corresponding to the source numbers below.\n\n";

  sources.forEach((source, i) => {
    prompt += `[${i + 1}] (from "${source.documentName}"):\n${source.content}\n\n`;
  });

  return prompt;
}
