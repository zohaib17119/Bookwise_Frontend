import { z } from "zod";

export const accountSchema = z.object({
  code: z.string().max(30, "Code must be 30 characters or less").optional().or(z.literal("")),
  name: z.string().min(2, "Name is required").max(120, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE", "COST_OF_GOODS_SOLD", "BANK", "ACCOUNTS_RECEIVABLE", "ACCOUNTS_PAYABLE", "TAX", "OTHER"]),
  subtype: z.string().max(80, "Subtype is too long").optional().or(z.literal("")),
  normalSide: z.enum(["DEBIT", "CREDIT"]),
  parentAccountId: z.string().uuid().nullable().optional(),
  currencyCode: z.string().min(3, "Use a 3-letter currency code").max(3).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
