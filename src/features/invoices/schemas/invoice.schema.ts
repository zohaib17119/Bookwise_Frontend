import { z } from "zod";
import {
  documentBaseSchema,
  lineItemSchema,
} from "@/features/shared/schemas/document.schema";

export const invoiceSchema = documentBaseSchema.extend({
  customerId: z.string().min(1, "Customer is required"),
  estimateId: z.string().optional().or(z.literal("")),
  invoiceNumber: z.string().optional().or(z.literal("")),
  issueDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type InvoiceFormInput = z.input<typeof invoiceSchema>;
export type InvoiceFormValues = z.output<typeof invoiceSchema>;
