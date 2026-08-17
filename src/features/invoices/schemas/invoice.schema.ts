import { z } from "zod";
import {
  documentBaseSchema,
  lineItemSchema,
} from "@/features/shared/schemas/document.schema";
import { toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

const whtRateSchema = z.preprocess(
  (value) => toOptionalDecimalString(value),
  z.string().optional().or(z.literal("")),
);

export const invoiceSchema = documentBaseSchema
  .extend({
    customerId: z.string().min(1, "Customer is required"),
    estimateId: z.string().optional().or(z.literal("")),
    invoiceNumber: z.string().optional().or(z.literal("")),
    contactPersonName: z.string().optional().or(z.literal("")),
    contactMobile: z.string().optional().or(z.literal("")),
    contactPersonDepartment: z.string().optional().or(z.literal("")),
    deliveryDate: z.string().optional().or(z.literal("")),
    deliveryChallanNumber: z.string().optional().or(z.literal("")),
    issueDate: z.string().optional().or(z.literal("")),
    dueDate: z.string().optional().or(z.literal("")),
    memoOnStatement: z.string().optional().or(z.literal("")),
    paymentOptions: z
      .array(z.enum(["BANK_TRANSFER", "CARD", "CASH", "CHEQUE"]))
      .optional(),
    whtEnabled: z.boolean().optional(),
    whtType: z.enum(["INCOME", "SALES_TAX"]).optional().or(z.literal("")),
    whtRate: whtRateSchema,
    whtBase: z
      .enum(["SUBTOTAL", "TAXABLE", "TAX_AMOUNT", "TOTAL"])
      .optional()
      .or(z.literal("")),
    whtHeldBy: z.enum(["COMPANY", "COUNTERPARTY"]).optional().or(z.literal("")),
    lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
  })
  .superRefine((payload, ctx) => {
    if (!payload.whtEnabled) return;
    if (!payload.whtType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WHT type is required", path: ["whtType"] });
    }
    if (!payload.whtRate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WHT rate is required", path: ["whtRate"] });
    }
    if (!payload.whtBase) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WHT base is required", path: ["whtBase"] });
    }
    if (!payload.whtHeldBy) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WHT holder is required", path: ["whtHeldBy"] });
    }
  });

export type InvoiceFormInput = z.input<typeof invoiceSchema>;
export type InvoiceFormValues = z.output<typeof invoiceSchema>;
