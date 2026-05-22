import { z } from "zod";

export const saleFormSchema = z.object({
  domain_name: z.string().min(1, "Domain name is required"),
  sale_price: z.coerce
    .number()
    .positive("Sale price must be greater than zero"),
  sold_at: z
    .string()
    .min(1, "Sale date is required")
    .refine(
      (v) => {
        const inputDate = new Date(v + "T23:59:59");
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return inputDate.getTime() <= today.getTime();
      },
      "Sale date cannot be in the future"
    ),
  buyer: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SaleFormInput = z.infer<typeof saleFormSchema>;
