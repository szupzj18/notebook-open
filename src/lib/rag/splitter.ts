export interface TextChunk {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
}

const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

export function splitText(
  text: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  } = {}
): TextChunk[] {
  const { chunkSize = 1000, chunkOverlap = 200, separators = DEFAULT_SEPARATORS } = options;

  const rawChunks = recursiveSplit(text, chunkSize, separators);

  const merged = mergeChunks(rawChunks, chunkSize, chunkOverlap);

  const result: TextChunk[] = [];
  let charOffset = 0;

  for (let i = 0; i < merged.length; i++) {
    const content = merged[i];
    const startChar = text.indexOf(content, Math.max(0, charOffset - chunkOverlap));
    const actualStart = startChar >= 0 ? startChar : charOffset;

    result.push({
      content,
      index: i,
      startChar: actualStart,
      endChar: actualStart + content.length,
    });

    charOffset = actualStart + content.length - chunkOverlap;
  }

  return result;
}

function recursiveSplit(
  text: string,
  chunkSize: number,
  separators: string[]
): string[] {
  if (text.length <= chunkSize) {
    return [text.trim()].filter(Boolean);
  }

  const sep = findBestSeparator(text, separators);

  if (sep === "") {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize).trim());
    }
    return chunks.filter(Boolean);
  }

  const parts = text.split(sep);
  const result: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? current + sep + part : part;

    if (candidate.length > chunkSize && current) {
      result.push(current.trim());
      current = part;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result.flatMap((chunk) => {
    if (chunk.length > chunkSize) {
      const remainingSeps = separators.slice(separators.indexOf(sep) + 1);
      return recursiveSplit(chunk, chunkSize, remainingSeps);
    }
    return [chunk];
  });
}

function findBestSeparator(text: string, separators: string[]): string {
  for (const sep of separators) {
    if (sep === "" || text.includes(sep)) {
      return sep;
    }
  }
  return "";
}

function mergeChunks(
  chunks: string[],
  chunkSize: number,
  overlap: number
): string[] {
  if (chunks.length <= 1) return chunks;

  const merged: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    let current = chunks[i];

    if (i > 0 && overlap > 0) {
      const prev = chunks[i - 1];
      const overlapText = prev.slice(-overlap);
      if (overlapText && !current.startsWith(overlapText)) {
        current = overlapText + " " + current;
        if (current.length > chunkSize * 1.5) {
          current = current.slice(overlapText.length + 1);
        }
      }
    }

    merged.push(current);
  }

  return merged;
}
