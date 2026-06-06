import { z } from "zod";
import {
  documentBaseSchema,
  lineItemSchema,
} from "@/features/shared/schemas/document.schema";

export const billSchema = documentBaseSchema.extend({
  vendorId: z.string().min(1, "Vendor is required"),
  billNumber: z.string().optional().or(z.literal("")),
  issueDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type BillFormInput = z.input<typeof billSchema>;
export type BillFormValues = z.output<typeof billSchema>;
