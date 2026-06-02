import { z } from "zod";

function isValidDate(value: string): boolean {
  if (!value.trim()) return false;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return true;
  const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (mmddyyyy) {
    const month = parseInt(mmddyyyy[1], 10);
    const day = parseInt(mmddyyyy[2], 10);
    const year = parseInt(mmddyyyy[3], 10);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10);
    const year = parseInt(ddmmyyyy[3], 10);
    if (month > 12) return false;
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }
  return false;
}

function parseDate(value: string): string {
  const trimmed = value.trim();
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (mmddyyyy) {
    const month = parseInt(mmddyyyy[1], 10);
    const day = parseInt(mmddyyyy[2], 10);
    const year = parseInt(mmddyyyy[3], 10);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10);
    const year = parseInt(ddmmyyyy[3], 10);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return trimmed;
}

export const csvRowSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain name is required")
    .max(253, "Domain name exceeds 253 characters")
    .regex(/\./, "Domain must contain a dot")
    .regex(/^[^\s]+$/, "Domain must not contain spaces"),
  expiration_date: z
    .string()
    .min(1, "Expiration date is required")
    .refine(isValidDate, "Invalid date format"),
  purchase_price: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/^[$\u20AC\u00A3]/, "").replace(/[$\u20AC\u00A3]$/, "").trim() : v))
    .refine(
      (v) => !v || v.trim() === "" || (!isNaN(Number(v)) && Number(v) >= 0),
      "Price must be a non-negative number"
    ),
  bin: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .replace(/^[$\u20AC\u00A3]/, "")
            .replace(/[$\u20AC\u00A3]$/, "")
            .replace(/,/g, "")
            .trim()
        : v
    )
    .refine(
      (v) => !v || v.trim() === "" || (!isNaN(Number(v)) && Number(v) >= 0),
      "BIN price must be a non-negative number"
    ),
  registrar: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export const domainEditSchema = z.object({
  status: z.enum(["active", "expired", "sold", "pending"]),
  registrar: z.string().nullable().optional(),
  purchase_price: z
    .number()
    .min(0, "Price must be non-negative")
    .nullable()
    .optional(),
  bin: z
    .number()
    .min(0, "BIN must be non-negative")
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
  tags: z
    .array(z.string().min(1))
    .nullable()
    .optional(),
});

export type DomainEdit = z.infer<typeof domainEditSchema>;

export const domainFiltersSchema = z.object({
  status: z.enum(["active", "expired", "sold", "pending"]).optional(),
  tld: z.string().optional(),
  search: z.string().optional(),
  sort: z
    .enum(["domain", "expiration_date", "status"])
    .optional()
    .default("expiration_date"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().positive().optional().default(1),
});

export type DomainFilters = z.infer<typeof domainFiltersSchema>;

export function parseTags(tagsString: string | undefined | null): string[] | null {
  if (!tagsString || !tagsString.trim()) return null;
  return tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export { parseDate };

export const manualEntrySchema = z.object({
  domain: z
    .string()
    .min(1, "Domain name is required")
    .max(253, "Domain name exceeds 253 characters")
    .regex(/\./, "Domain must contain a dot")
    .regex(/^\S+$/, "Domain must not contain spaces"),
  expiration_date: z
    .string()
    .min(1, "Expiration date is required")
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  purchase_price: z.coerce
    .number()
    .min(0, "Price must be non-negative")
    .optional()
    .nullable(),
  registrar: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
});

export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
