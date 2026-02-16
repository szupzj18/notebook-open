import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { removeVectors } from "@/lib/rag/vector-store";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.id, id))
    .get();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.id, id))
    .get();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chunkRows = db
    .select({ id: schema.chunks.id })
    .from(schema.chunks)
    .where(eq(schema.chunks.documentId, id))
    .all();

  if (chunkRows.length > 0) {
    removeVectors(
      doc.notebookId,
      chunkRows.map((c) => c.id)
    );
  }

  db.delete(schema.documents).where(eq(schema.documents.id, id)).run();

  const uploadsDir = path.join(process.cwd(), "data", "uploads");
  const filePath = path.join(uploadsDir, `${id}_${doc.filename}`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return NextResponse.json({ success: true });
}
