import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().min(0).max(3650).optional());
const optionalDecimalString = z.string().optional().or(z.literal(""));

const shippingAddressSchema = z.object({
  id: optionalString,
  label: z.string().trim().min(1, "Label is required").max(80),
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  country: optionalString,
});

export const customerSchema = z.object({
  customerCode: optionalString,
  displayName: optionalString,
  legalName: z.string().min(2, "Legal name is required").max(120),
  firstName: optionalString,
  lastName: optionalString,
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: optionalString,
  mobile: optionalString,
  contactPersonDepartment: optionalString,
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
  shippingAddresses: z.array(shippingAddressSchema).max(10).default([]),
  notes: optionalString,
  isActive: z.boolean(),
});

export type CustomerFormInput = z.input<typeof customerSchema>;
export type CustomerFormValues = z.output<typeof customerSchema>;
