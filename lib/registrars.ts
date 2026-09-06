export const ALLOWED_REGISTRARS = [
  "atom",
  "dynadot",
  "edomains",
  "gname",
  "godaddy",
  "namebright",
  "nameslink",
  "spaceship",
  "unstoppable",
  "unstoppable domains",
] as const;

interface RegistrarAlias {
  match: string;
  canonical: string;
}

const ALIASES: RegistrarAlias[] = [
  { match: "unstoppable domains", canonical: "unstoppable domains" },
  { match: "godaddy", canonical: "godaddy" },
  { match: "wild west domains", canonical: "godaddy" },
  { match: "namebright", canonical: "namebright" },
  { match: "turncommerce", canonical: "namebright" },
  { match: "gname", canonical: "gname" },
  { match: "edomains", canonical: "edomains" },
  { match: "dynadot", canonical: "dynadot" },
  { match: "spaceship", canonical: "spaceship" },
  { match: "nameslink", canonical: "nameslink" },
  { match: "hugedomains", canonical: "atom" },
  { match: "atom", canonical: "atom" },
  { match: "unstoppable", canonical: "unstoppable" },
].sort((a, b) => b.match.length - a.match.length);

export function matchRegistrar(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const alias of ALIASES) {
    if (lower.includes(alias.match)) return alias.canonical;
  }
  return null;
}
