import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  legalName: z.string().optional(),
  currencyCode: z.string().min(3, "Use a 3-letter currency code").max(3).optional(),
  baseCurrencyCode: z.string().min(3, "Use a 3-letter currency code").max(3).optional(),
  country: z.string().min(2, "Country is required").optional(),
  timezone: z.string().min(2, "Timezone is required").optional(),
  fiscalYearStartMonth: z.number().int().min(1, "Fiscal Year Start Month is Required"),
  ownerUserId:z.string(),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;
