import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().min(0).max(3650).optional());
const optionalDecimalString = z.string().optional().or(z.literal(""));

/** FBR DI: strip letter/dash print formats like A-029996-8 → 0299968. */
export function normalizeFbrNtnCnicInput(raw: string | null | undefined): string {
  if (raw == null) return "";
  return String(raw).replace(/\D/g, "");
}

function isValidFbrNtnCnicDigits(digits: string): boolean {
  return [7, 9, 13].includes(digits.length) && /^\d+$/.test(digits);
}

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
  fbrRegistrationType: z.enum(["REGISTERED", "UNREGISTERED"]).nullable().optional(),
  fbrProvince: optionalString,
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

/** When FBR DI is enabled for PK company — buyer fields required for DI payload. */
export function buildCustomerSchema(requireFbrDi: boolean) {
  if (!requireFbrDi) return customerSchema;
  return customerSchema
    .extend({
      fbrRegistrationType: z.enum(["REGISTERED", "UNREGISTERED"], {
        required_error: "FBR registration type is required",
      }),
      fbrProvince: z.string().trim().min(1, "FBR province is required"),
      billingAddressLine1: z.string().trim().min(1, "Billing address is required for FBR"),
    })
    .superRefine((values, ctx) => {
      const digits = normalizeFbrNtnCnicInput(values.taxRegistrationNumber);
      if (values.fbrRegistrationType === "REGISTERED") {
        if (!digits) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["taxRegistrationNumber"],
            message: "NTN / tax registration is required for Registered buyers",
          });
        } else if (!isValidFbrNtnCnicDigits(digits)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["taxRegistrationNumber"],
            message:
              "FBR DI needs digits only: NTN 7 or 9 digits, or CNIC 13 (e.g. A-029996-8 → 0299968)",
          });
        }
      } else if (digits && !isValidFbrNtnCnicDigits(digits)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxRegistrationNumber"],
          message:
            "FBR DI needs digits only: NTN 7 or 9 digits, or CNIC 13 (e.g. A-029996-8 → 0299968)",
        });
      }
    });
}

export type CustomerFormInput = z.input<typeof customerSchema>;
export type CustomerFormValues = z.output<typeof customerSchema>;
