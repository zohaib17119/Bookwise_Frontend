import { z } from "zod";
import {
  DECIMAL_STRING_REGEX,
  MONEY_STRING_REGEX,
  toDecimalString,
  toMoneyDecimalString,
  toOptionalDecimalString,
} from "@/features/shared/utils/decimal-string";

const optionalString = z.string().optional().or(z.literal(""));
const optionalDate = optionalString;
const requiredPaymentDateSchema = z
  .string()
  .trim()
  .min(1, "Payment date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid payment date");

const moneyStringSchema = z.preprocess(
  (value) => toOptionalDecimalString(value),
  z
    .string()
    .regex(DECIMAL_STRING_REGEX, "Enter a valid amount")
    .or(z.literal("")),
);

const requiredPaymentAmountSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return "";
    }
    return toMoneyDecimalString(value) || toDecimalString(value, 2);
  },
  z
    .string()
    .regex(MONEY_STRING_REGEX, "Enter a valid amount")
    .refine((value) => Number(value) >= 0.01, {
      message: "Amount is required",
    }),
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
  description: z.string().trim().max(500),
  quantity: requiredQuantitySchema,
  unitPrice: moneyStringSchema,
  unitCost: moneyStringSchema,
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountValue: moneyStringSchema,
  taxCodeId: optionalString,
  taxRateId: optionalString,
  taxRate: moneyStringSchema,
  itemName: z.string().max(500).optional().or(z.literal("")),
  unitName: z.string().max(50).optional().or(z.literal("")),
  expenseAccountId: optionalString,
  fbrSaleType: optionalString,
  fbrFixedNotifiedValueOrRetailPrice: moneyStringSchema,
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
  allocatedAmount: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return "0.00";
      }
      return toMoneyDecimalString(value) || toDecimalString(value, 2);
    },
    z.string().regex(MONEY_STRING_REGEX, "Enter a valid amount"),
  ),
});

export const paymentBaseSchema = z.object({
  paymentDate: requiredPaymentDateSchema,
  paymentMethod: z.string().trim().min(1, "Payment method is required").max(80),
  paymentAccountId: optionalString,
  referenceNumber: optionalString,
  amount: requiredPaymentAmountSchema,
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
