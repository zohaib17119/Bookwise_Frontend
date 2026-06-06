import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Number(value);
}, z.number().optional());

export const companySettingsSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  legalName: optionalString,
  email: optionalString,
  phone: optionalString,
  website: optionalString,
  country: optionalString,
  state: optionalString,
  city: optionalString,
  postalCode: optionalString,
  addressLine1: optionalString,
  addressLine2: optionalString,
  currency: optionalString,
  baseCurrencyCode: optionalString,
  timezone: optionalString,
  fiscalYearStartMonth: optionalNumber,
  taxRegistrationNumber: optionalString,
  taxLabel: optionalString,
  companyType: optionalString,
  industry: optionalString,
  logoUrl: optionalString,
  status: optionalString,
});

export type CompanySettingsFormInput = z.input<typeof companySettingsSchema>;
export type CompanySettingsFormValues = z.output<typeof companySettingsSchema>;
