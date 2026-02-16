import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ParseResult {
  content: string;
  metadata?: Record<string, string>;
}

export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (mimeType === "application/pdf" || ext === "pdf") {
    return parsePDF(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return parseDOCX(buffer);
  }

  if (
    mimeType === "text/markdown" ||
    ext === "md" ||
    ext === "markdown"
  ) {
    return parseText(buffer);
  }

  if (mimeType.startsWith("text/") || ext === "txt" || ext === "csv") {
    return parseText(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType} (${ext})`);
}

async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text = result.text || result.pages.map((p) => p.text).join("\n\n");
  await parser.destroy().catch(() => {});
  return {
    content: text,
    metadata: {
      pages: String(result.total),
    },
  };
}

async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  return {
    content: result.value,
  };
}

function parseText(buffer: Buffer): ParseResult {
  return {
    content: buffer.toString("utf-8"),
  };
}

export function getSupportedTypes(): string[] {
  return [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
  ];
}
