import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { parseDocument } from "@/lib/rag/parser";
import { splitText } from "@/lib/rag/splitter";
import { generateEmbeddings } from "@/lib/rag/embeddings";
import { addVectors } from "@/lib/rag/vector-store";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const notebookId = formData.get("notebookId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!notebookId) {
    return NextResponse.json(
      { error: "notebookId is required" },
      { status: 400 }
    );
  }

  const notebook = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, notebookId))
    .get();

  if (!notebook) {
    return NextResponse.json(
      { error: "Notebook not found" },
      { status: 404 }
    );
  }

  const docId = uuidv4();
  const now = new Date().toISOString();

  db.insert(schema.documents)
    .values({
      id: docId,
      notebookId,
      filename: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      status: "processing",
      createdAt: now,
    })
    .run();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    ensureUploadsDir();
    const filePath = path.join(UPLOADS_DIR, `${docId}_${file.name}`);
    fs.writeFileSync(filePath, buffer);

    const { content } = await parseDocument(buffer, file.name, file.type);

    db.update(schema.documents)
      .set({ rawContent: content })
      .where(eq(schema.documents.id, docId))
      .run();

    const textChunks = splitText(content, {
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkIds: string[] = [];
    for (const chunk of textChunks) {
      const chunkId = uuidv4();
      chunkIds.push(chunkId);

      db.insert(schema.chunks)
        .values({
          id: chunkId,
          documentId: docId,
          content: chunk.content,
          chunkIndex: chunk.index,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          metadata: JSON.stringify({ filename: file.name }),
        })
        .run();
    }

    const chunkContents = textChunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkContents);
    addVectors(notebookId, chunkIds, embeddings);

    db.update(schema.documents)
      .set({ status: "ready" })
      .where(eq(schema.documents.id, docId))
      .run();

    db.update(schema.notebooks)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(schema.notebooks.id, notebookId))
      .run();

    const doc = db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, docId))
      .get();

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    db.update(schema.documents)
      .set({ status: "error" })
      .where(eq(schema.documents.id, docId))
      .run();

    const message =
      error instanceof Error ? error.message : "Unknown error during processing";

    return NextResponse.json(
      { error: message, documentId: docId },
      { status: 500 }
    );
  }
}
