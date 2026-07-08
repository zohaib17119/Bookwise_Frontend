import { z } from "zod";
import {
  DECIMAL_STRING_REGEX,
  toDecimalString,
  toOptionalDecimalString,
} from "@/features/shared/utils/decimal-string";

const optionalString = z.string().optional().or(z.literal(""));
const optionalDate = optionalString;

const moneyStringSchema = z.preprocess(
  (value) => toOptionalDecimalString(value),
  z
    .string()
    .regex(DECIMAL_STRING_REGEX, "Enter a valid amount")
    .or(z.literal("")),
);

const requiredQuantitySchema = z.preprocess(
  (value) => toDecimalString(value),
  z
    .string()
    .regex(DECIMAL_STRING_REGEX, "Enter a valid quantity")
    .refine((value) => Number(value) >= 0.01, {
      message: "Quantity must be greater than zero",
    }),
);

export const lineItemSchema = z.object({
  itemId: optionalString,
  description: z.string().min(1, "Line description is required").max(500),
  quantity: requiredQuantitySchema,
  unitPrice: moneyStringSchema,
  unitCost: moneyStringSchema,
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountValue: moneyStringSchema,
  taxCodeId: optionalString,
  taxRateId: optionalString,
  taxRate: moneyStringSchema,
  itemName: z.string().max(500).optional().or(z.literal("")),
  expenseAccountId: optionalString,
});

export const documentBaseSchema = z.object({
  referenceNumber: optionalString,
  currencyCode: z.string().min(3).max(3).optional().or(z.literal("")),
  exchangeRate: moneyStringSchema.refine(
    (value) => !value || (Number(value) > 0 && Number.isFinite(Number(value))),
    { message: "Exchange rate must be a positive number" },
  ),
  notes: optionalString,
  terms: z.enum(["", "0", "15", "30", "45", "60", "90"]).optional().or(z.literal("")),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional().or(z.literal("")),
  discountValue: moneyStringSchema,
});

export const allocationLineSchema = z.object({
  documentId: z.string().min(1),
  allocatedAmount: z.coerce.number().min(0),
});

export const paymentBaseSchema = z.object({
  paymentDate: optionalDate,
  paymentMethod: z.string().min(1, "Payment method is required").max(80),
  referenceNumber: optionalString,
  amount: z.coerce.number().min(0.01, "Amount is required"),
  notes: optionalString,
});

export type LineItemInput = z.input<typeof lineItemSchema>;
export type LineItemValues = z.output<typeof lineItemSchema>;
export type AllocationLineInput = z.input<typeof allocationLineSchema>;
export type AllocationLineValues = z.output<typeof allocationLineSchema>;

export const documentTermsValues = ["", "0", "15", "30", "45", "60", "90"] as const;
export type DocumentTermsValue = (typeof documentTermsValues)[number];

export function normalizeDocumentTerms(terms?: string | null): DocumentTermsValue {
  if (terms && documentTermsValues.includes(terms as DocumentTermsValue)) {
    return terms as DocumentTermsValue;
  }

  return "";
}
