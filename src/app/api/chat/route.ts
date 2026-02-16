import { streamText } from "ai";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createLanguageModel } from "@/lib/llm/providers";
import { retrieveContext, buildContextPrompt } from "@/lib/rag/retriever";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, notebookId } = body;

  if (!notebookId || !messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "notebookId and messages are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const notebook = db
    .select()
    .from(schema.notebooks)
    .where(eq(schema.notebooks.id, notebookId))
    .get();

  if (!notebook) {
    return new Response(JSON.stringify({ error: "Notebook not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  const userQuery = lastUserMessage?.content || "";

  let sources: Awaited<ReturnType<typeof retrieveContext>> = [];
  let contextPrompt = "";

  if (userQuery) {
    try {
      sources = await retrieveContext(notebookId, userQuery, 6);
      contextPrompt = buildContextPrompt(sources);
    } catch (error) {
      console.error("Retrieval error:", error);
    }
  }

  const systemMessage = `You are an AI research assistant for the notebook "${notebook.title}". 
Your job is to help the user understand, analyze, and synthesize the documents they have uploaded.

Rules:
- Answer based primarily on the provided document excerpts.
- If the excerpts don't contain enough information to answer, say so clearly.
- Always cite your sources using [1], [2], etc. notation.
- Be concise but thorough.
- Use markdown formatting for readability.

${contextPrompt}`;

  db.insert(schema.messages)
    .values({
      id: uuidv4(),
      notebookId,
      role: "user",
      content: userQuery,
      createdAt: new Date().toISOString(),
    })
    .run();

  const model = createLanguageModel();

  const result = streamText({
    model,
    system: systemMessage,
    messages,
    onFinish: async ({ text }) => {
      db.insert(schema.messages)
        .values({
          id: uuidv4(),
          notebookId,
          role: "assistant",
          content: text,
          sources: sources.length > 0 ? JSON.stringify(sources) : null,
          createdAt: new Date().toISOString(),
        })
        .run();
    },
  });

  return result.toTextStreamResponse();
}
