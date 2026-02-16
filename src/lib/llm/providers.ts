import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider-v2";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLanguageModel = any;
import type { LLMProvider, EmbeddingProvider } from "@/types";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface ProviderConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

function getSettingValue(key: string): string | null {
  const row = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get();
  return row?.value ?? null;
}

export function getProviderConfig(): ProviderConfig {
  const provider =
    (getSettingValue("llm_provider") as LLMProvider) ||
    process.env.DEFAULT_LLM_PROVIDER ||
    "openai";
  const model =
    getSettingValue("llm_model") ||
    process.env.DEFAULT_LLM_MODEL ||
    "gpt-4o-mini";
  const apiKey =
    getSettingValue("openai_api_key") || process.env.OPENAI_API_KEY || "";
  const anthropicKey =
    getSettingValue("anthropic_api_key") || process.env.ANTHROPIC_API_KEY || "";
  const ollamaUrl =
    getSettingValue("ollama_base_url") ||
    process.env.OLLAMA_BASE_URL ||
    "http://localhost:11434";

  if (provider === "anthropic") {
    return { provider, model, apiKey: anthropicKey };
  }
  if (provider === "ollama") {
    return { provider, model, baseUrl: ollamaUrl };
  }
  return { provider, model, apiKey };
}

export function getEmbeddingConfig(): EmbeddingConfig {
  const provider =
    (getSettingValue("embedding_provider") as EmbeddingProvider) ||
    process.env.DEFAULT_EMBEDDING_PROVIDER ||
    "openai";
  const model =
    getSettingValue("embedding_model") ||
    process.env.DEFAULT_EMBEDDING_MODEL ||
    "text-embedding-3-small";
  const apiKey =
    getSettingValue("openai_api_key") || process.env.OPENAI_API_KEY || "";
  const ollamaUrl =
    getSettingValue("ollama_base_url") ||
    process.env.OLLAMA_BASE_URL ||
    "http://localhost:11434";

  if (provider === "ollama") {
    return { provider, model, baseUrl: ollamaUrl };
  }
  return { provider, model, apiKey };
}

export function createLanguageModel(config?: ProviderConfig): AnyLanguageModel {
  const cfg = config || getProviderConfig();

  switch (cfg.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: cfg.apiKey });
      return openai(cfg.model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: cfg.apiKey });
      return anthropic(cfg.model);
    }
    case "ollama": {
      const ollama = createOllama({ baseURL: `${cfg.baseUrl}/api` });
      return ollama(cfg.model);
    }
    default:
      throw new Error(`Unknown LLM provider: ${cfg.provider}`);
  }
}

export function createEmbeddingModel(config?: EmbeddingConfig) {
  const cfg = config || getEmbeddingConfig();

  switch (cfg.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: cfg.apiKey });
      return openai.embedding(cfg.model);
    }
    case "ollama": {
      const ollama = createOllama({ baseURL: `${cfg.baseUrl}/api` });
      return ollama.embedding(cfg.model);
    }
    default:
      throw new Error(`Unknown embedding provider: ${cfg.provider}`);
  }
}
