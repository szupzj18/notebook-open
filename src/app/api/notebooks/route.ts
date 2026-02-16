import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const rows = db
    .select()
    .from(schema.notebooks)
    .orderBy(desc(schema.notebooks.updatedAt))
    .all();

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.insert(schema.notebooks)
    .values({
      id,
      title: title.trim(),
      description: description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const notebook = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, id))
    .get();

  return NextResponse.json(notebook, { status: 201 });
}
