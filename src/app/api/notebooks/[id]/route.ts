import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { deleteNotebookIndex } from "@/lib/rag/vector-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const notebook = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, id))
    .get();

  if (!notebook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const documents = db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.notebookId, id))
    .all();

  const messages = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.notebookId, id))
    .all();

  return NextResponse.json({ ...notebook, documents, messages });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description } = body;

  const notebook = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, id))
    .get();

  if (!notebook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.update(schema.notebooks)
    .set({
      title: title?.trim() || notebook.title,
      description:
        description !== undefined ? description?.trim() || null : notebook.description,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.notebooks.id, id))
    .run();

  const updated = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, id))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const notebook = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, id))
    .get();

  if (!notebook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  deleteNotebookIndex(id);

  db.delete(schema.notebooks).where(eq(schema.notebooks.id, id)).run();

  return NextResponse.json({ success: true });
}
