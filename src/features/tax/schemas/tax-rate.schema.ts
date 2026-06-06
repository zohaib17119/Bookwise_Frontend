import { z } from "zod";

export const taxRateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().optional().or(z.literal("")),
  ratePercent: z.coerce.number().min(0).max(100),
  scope: z.string().optional().or(z.literal("")),
  isCompound: z.boolean(),
  isRecoverable: z.boolean(),
  isActive: z.boolean(),
});

export type TaxRateFormInput = z.input<typeof taxRateSchema>;
export type TaxRateFormValues = z.output<typeof taxRateSchema>;
