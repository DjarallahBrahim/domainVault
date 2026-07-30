export function extractRootWord(domain: string): string {
  const trimmed = domain.trim();
  const dotIndex = trimmed.indexOf(".");
  if (dotIndex < 0) return trimmed;
  return trimmed.slice(0, dotIndex);
}
