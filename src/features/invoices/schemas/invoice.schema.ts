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

const whtBaseSchema = z
  .enum(["SUBTOTAL", "TAXABLE", "TAX_AMOUNT", "TOTAL"])
  .optional()
  .or(z.literal(""));

const whtHeldBySchema = z.enum(["COMPANY", "COUNTERPARTY"]).optional().or(z.literal(""));

function refineDualWht(
  payload: {
    whtEnabled?: boolean;
    whtHeldBy?: string;
    incomeWhtEnabled?: boolean;
    incomeWhtRate?: string;
    incomeWhtBase?: string;
    incomeWhtHeldBy?: string;
    salesTaxWhtEnabled?: boolean;
    salesTaxWhtRate?: string;
    salesTaxWhtBase?: string;
    salesTaxWhtHeldBy?: string;
  },
  ctx: z.RefinementCtx,
) {
  const incomeOn = Boolean(payload.incomeWhtEnabled);
  const salesOn = Boolean(payload.salesTaxWhtEnabled);
  const legacyOn = Boolean(payload.whtEnabled) && !incomeOn && !salesOn;
  if (!(incomeOn || salesOn || legacyOn)) return;

  if (legacyOn && !payload.whtHeldBy && !payload.incomeWhtHeldBy && !payload.salesTaxWhtHeldBy) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "WHT holder is required",
      path: ["whtHeldBy"],
    });
  }
  if (incomeOn) {
    if (!payload.incomeWhtHeldBy && !payload.whtHeldBy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Income WHT holder is required",
        path: ["incomeWhtHeldBy"],
      });
    }
    if (!payload.incomeWhtRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Income WHT rate is required",
        path: ["incomeWhtRate"],
      });
    }
    if (!payload.incomeWhtBase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Income WHT base is required",
        path: ["incomeWhtBase"],
      });
    }
  }
  if (salesOn) {
    if (!payload.salesTaxWhtHeldBy && !payload.whtHeldBy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sales tax WHT holder is required",
        path: ["salesTaxWhtHeldBy"],
      });
    }
    if (!payload.salesTaxWhtRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sales tax WHT rate is required",
        path: ["salesTaxWhtRate"],
      });
    }
    if (!payload.salesTaxWhtBase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sales tax WHT base is required",
        path: ["salesTaxWhtBase"],
      });
    }
  }
}

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
    shippingAddressId: z.string().uuid().optional().or(z.literal("")),
    issueDate: z.string().optional().or(z.literal("")),
    dueDate: z.string().optional().or(z.literal("")),
    memoOnStatement: z.string().optional().or(z.literal("")),
    paymentOptions: z
      .array(z.enum(["BANK_TRANSFER", "CARD", "CASH", "CHEQUE"]))
      .optional(),
    whtHeldBy: whtHeldBySchema,
    incomeWhtEnabled: z.boolean().optional(),
    incomeWhtRate: whtRateSchema,
    incomeWhtBase: whtBaseSchema,
    incomeWhtHeldBy: whtHeldBySchema,
    salesTaxWhtEnabled: z.boolean().optional(),
    salesTaxWhtRate: whtRateSchema,
    salesTaxWhtBase: whtBaseSchema,
    salesTaxWhtHeldBy: whtHeldBySchema,
    /** @deprecated legacy single-slot; prefer income/salesTax flags */
    whtEnabled: z.boolean().optional(),
    whtType: z.enum(["INCOME", "SALES_TAX"]).optional().or(z.literal("")),
    whtRate: whtRateSchema,
    whtBase: whtBaseSchema,
    lines: z
      .array(
        lineItemSchema.extend({
          description: z.string().trim().max(500),
        }),
      )
      .min(1, "At least one line item is required"),
  })
  .superRefine(refineDualWht);

export type InvoiceFormInput = z.input<typeof invoiceSchema>;
export type InvoiceFormValues = z.output<typeof invoiceSchema>;
