import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalDate = optionalString;
const optionalDecimalString = z.string().optional().or(z.literal(""));

export const lineItemSchema = z.object({
  itemId: optionalString,
  description: z.string().min(1, "Line description is required").max(500),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
  unitPrice: optionalDecimalString,
  unitCost: optionalDecimalString,
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountValue: optionalDecimalString,
  taxRateId: optionalString,
  taxRate: optionalDecimalString,
  itemName: z.string().min(1).max(500),
  expenseAccountId: optionalString,
});

export const documentBaseSchema = z.object({
  referenceNumber: optionalString,
  currencyCode: z.string().min(3).max(3).optional().or(z.literal("")),
  notes: optionalString,
  terms: z.enum(["", "0", "15", "30", "45", "60", "90"]).optional().or(z.literal("")),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional().or(z.literal("")),
  discountValue: optionalDecimalString,
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
