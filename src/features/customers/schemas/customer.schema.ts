import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().min(0).max(3650).optional());
const optionalDecimalString = z.string().optional().or(z.literal(""));

export const customerSchema = z.object({
  customerCode: optionalString,
  displayName: z.string().min(2, "Display name is required").max(120),
  legalName: optionalString,
  firstName: optionalString,
  lastName: optionalString,
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
  shippingAddressLine1: optionalString,
  shippingAddressLine2: optionalString,
  shippingCity: optionalString,
  shippingState: optionalString,
  shippingPostalCode: optionalString,
  shippingCountry: optionalString,
  notes: optionalString,
  isActive: z.boolean(),
});

export type CustomerFormInput = z.input<typeof customerSchema>;
export type CustomerFormValues = z.output<typeof customerSchema>;
