import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().min(0).max(3650).optional());
const optionalDecimalString = z.string().optional().or(z.literal(""));

/** FBR DI: `C831684-3` → `C831684` (keep letter, drop dash + check digit). */
export function normalizeFbrNtnCnicInput(raw: string | null | undefined): string {
  if (raw == null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  if (/^\d{5}-\d{7}-\d$/.test(trimmed)) {
    return trimmed.replace(/\D/g, "");
  }
  if (/^\d{13}$/.test(trimmed)) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  const hasLetter = /[A-Za-z]/.test(trimmed);
  if (!hasLetter && digitsOnly.length === 13) {
    return digitsOnly;
  }

  if (trimmed.includes("-")) {
    const beforeLastDash = trimmed.slice(0, trimmed.lastIndexOf("-"));
    return beforeLastDash.replace(/[-\s]/g, "").replace(/[^A-Za-z0-9]/g, "");
  }

  return trimmed.replace(/[-\s]/g, "").replace(/[^A-Za-z0-9]/g, "");
}

function isValidFbrNtnCnicValue(value: string): boolean {
  if (/^[A-Za-z]\d{6}$/.test(value)) return true;
  if (/^\d{7}$/.test(value) || /^\d{9}$/.test(value)) return true;
  if (/^\d{13}$/.test(value)) return true;
  return false;
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
      const normalized = normalizeFbrNtnCnicInput(values.taxRegistrationNumber);
      if (values.fbrRegistrationType === "REGISTERED") {
        if (!normalized) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["taxRegistrationNumber"],
            message: "NTN / tax registration is required for Registered buyers",
          });
        } else if (!isValidFbrNtnCnicValue(normalized)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["taxRegistrationNumber"],
            message: "FBR DI: use C831684-3 → C831684, or 7/9 digit NTN, or 13-digit CNIC",
          });
        }
      } else if (normalized && !isValidFbrNtnCnicValue(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxRegistrationNumber"],
          message: "FBR DI: use C831684-3 → C831684, or 7/9 digit NTN, or 13-digit CNIC",
        });
      }
    });
}

export type CustomerFormInput = z.input<typeof customerSchema>;
export type CustomerFormValues = z.output<typeof customerSchema>;
