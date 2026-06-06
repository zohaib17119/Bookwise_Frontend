import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().min(0).max(3650).optional());
const optionalDecimalString = z.string().optional().or(z.literal(""));

export const vendorSchema = z.object({
  vendorCode: optionalString,
  displayName: z.string().min(2, "Display name is required").max(120),
  legalName: optionalString,
  contactPersonName: optionalString,
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: optionalString,
  mobile: optionalString,
  website: optionalString,
  taxRegistrationNumber: optionalString,
  currencyCode: z.string().min(3).max(3).optional().or(z.literal("")),
  paymentTermsDays: optionalNumber,
  openingBalance: optionalDecimalString,
  openingBalanceDate: optionalString,
  billingAddressLine1: optionalString,
  billingAddressLine2: optionalString,
  billingCity: optionalString,
  billingState: optionalString,
  billingPostalCode: optionalString,
  billingCountry: optionalString,
  notes: optionalString,
  isActive: z.boolean(),
});

export type VendorFormInput = z.input<typeof vendorSchema>;
export type VendorFormValues = z.output<typeof vendorSchema>;
