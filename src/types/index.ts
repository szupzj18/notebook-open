export type LLMProvider = "openai" | "anthropic" | "ollama";
export type EmbeddingProvider = "openai" | "ollama";
export type DocumentStatus = "uploading" | "processing" | "ready" | "error";
export type MessageRole = "user" | "assistant" | "system";

export interface Notebook {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  notebookId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  rawContent: string | null;
  status: DocumentStatus;
  createdAt: string;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  metadata: string | null;
}

export interface Message {
  id: string;
  notebookId: string;
  role: MessageRole;
  content: string;
  sources: string | null;
  createdAt: string;
}

export interface AppSettings {
  llmProvider: LLMProvider;
  llmModel: string;
  embeddingProvider: EmbeddingProvider;
  embeddingModel: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl?: string;
}

export interface ChatSource {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
}
