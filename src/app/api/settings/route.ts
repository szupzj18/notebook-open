import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { AppSettings } from "@/types";

const SETTINGS_KEYS = [
  "llm_provider",
  "llm_model",
  "embedding_provider",
  "embedding_model",
  "openai_api_key",
  "anthropic_api_key",
  "ollama_base_url",
];

export async function GET() {
  const rows = db.select().from(schema.settings).all();
  const settingsMap = new Map(rows.map((r) => [r.key, r.value]));

  const settings: AppSettings = {
    llmProvider:
      (settingsMap.get("llm_provider") as AppSettings["llmProvider"]) ||
      (process.env.DEFAULT_LLM_PROVIDER as AppSettings["llmProvider"]) ||
      "openai",
    llmModel:
      settingsMap.get("llm_model") ||
      process.env.DEFAULT_LLM_MODEL ||
      "gpt-4o-mini",
    embeddingProvider:
      (settingsMap.get("embedding_provider") as AppSettings["embeddingProvider"]) ||
      (process.env.DEFAULT_EMBEDDING_PROVIDER as AppSettings["embeddingProvider"]) ||
      "openai",
    embeddingModel:
      settingsMap.get("embedding_model") ||
      process.env.DEFAULT_EMBEDDING_MODEL ||
      "text-embedding-3-small",
    openaiApiKey: settingsMap.get("openai_api_key") || "",
    anthropicApiKey: settingsMap.get("anthropic_api_key") || "",
    ollamaBaseUrl:
      settingsMap.get("ollama_base_url") ||
      process.env.OLLAMA_BASE_URL ||
      "http://localhost:11434",
  };

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();

  const keyMap: Record<string, string> = {
    llmProvider: "llm_provider",
    llmModel: "llm_model",
    embeddingProvider: "embedding_provider",
    embeddingModel: "embedding_model",
    openaiApiKey: "openai_api_key",
    anthropicApiKey: "anthropic_api_key",
    ollamaBaseUrl: "ollama_base_url",
  };

  for (const [camelKey, dbKey] of Object.entries(keyMap)) {
    if (body[camelKey] !== undefined && SETTINGS_KEYS.includes(dbKey)) {
      const value = String(body[camelKey]);

      const existing = db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, dbKey))
        .get();

      if (existing) {
        db.update(schema.settings)
          .set({ value })
          .where(eq(schema.settings.key, dbKey))
          .run();
      } else {
        db.insert(schema.settings).values({ key: dbKey, value }).run();
      }
    }
  }

  const rows = db.select().from(schema.settings).all();
  const settingsMap = new Map(rows.map((r) => [r.key, r.value]));

  const settings: AppSettings = {
    llmProvider:
      (settingsMap.get("llm_provider") as AppSettings["llmProvider"]) || "openai",
    llmModel: settingsMap.get("llm_model") || "gpt-4o-mini",
    embeddingProvider:
      (settingsMap.get("embedding_provider") as AppSettings["embeddingProvider"]) || "openai",
    embeddingModel: settingsMap.get("embedding_model") || "text-embedding-3-small",
    openaiApiKey: settingsMap.get("openai_api_key") || "",
    anthropicApiKey: settingsMap.get("anthropic_api_key") || "",
    ollamaBaseUrl: settingsMap.get("ollama_base_url") || "http://localhost:11434",
  };

  return NextResponse.json(settings);
}
