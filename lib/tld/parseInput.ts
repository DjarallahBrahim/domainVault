const MAX_WORDS = 200;

const VALID_WORD_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

function splitTokens(rawText: string): string[] {
  return rawText
    .split(/[\n\r,]+/)
    .flatMap((part) =>
      part
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    );
}

function sanitizeWord(token: string): string | null {
  let word = token.toLowerCase().trim();

  const urlMatch = word.match(/^https?:\/\/([^/:]+)/i);
  if (urlMatch?.[1]) {
    const parts = urlMatch[1].split(".");
    word = parts[0];
  } else {
    const dotIndex = word.indexOf(".");
    if (dotIndex > 0) {
      word = word.slice(0, dotIndex);
    }
  }

  const slashIdx = word.indexOf("/");
  if (slashIdx > 0) {
    word = word.slice(0, slashIdx);
  }

  word = word.replace(/[^a-zA-Z0-9-]/g, "");
  word = word.replace(/^-+|-+$/g, "");

  if (word.length === 0) return null;
  if (!VALID_WORD_REGEX.test(word)) return null;

  return word;
}

interface ParseSuccess {
  words: string[];
}

interface ParseError {
  error: string;
}

export function parseBaseWords(
  rawText: string
): ParseSuccess | ParseError {
  const tokens = splitTokens(rawText);

  const seen = new Set<string>();
  const words: string[] = [];

  for (const token of tokens) {
    const word = sanitizeWord(token);

    if (word && !seen.has(word)) {
      seen.add(word);
      words.push(word);

      if (words.length > MAX_WORDS) {
        return {
          error: `Input exceeds maximum of ${MAX_WORDS} words (found: ${words.length})`,
        };
      }
    }
  }

  return { words };
}
