import { z } from "zod";

export const taxCodeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  calculationMode: z.string().optional().or(z.literal("")),
  scope: z.string().optional().or(z.literal("")),
  isDefaultSales: z.boolean(),
  isDefaultPurchase: z.boolean(),
  isExempt: z.boolean(),
  taxRateIds: z.array(z.string()).default([]),
});

export type TaxCodeFormInput = z.input<typeof taxCodeSchema>;
export type TaxCodeFormValues = z.output<typeof taxCodeSchema>;
