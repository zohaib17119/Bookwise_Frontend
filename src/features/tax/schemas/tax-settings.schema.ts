import { z } from "zod";

export const taxSettingsSchema = z.object({
  salesTaxPayableAccountId: z.string().optional().or(z.literal("")),
  purchaseTaxRecoverableAccountId: z.string().optional().or(z.literal("")),
});

export type TaxSettingsFormInput = z.input<typeof taxSettingsSchema>;
export type TaxSettingsFormValues = z.output<typeof taxSettingsSchema>;
