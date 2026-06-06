import { z } from "zod";
import {
  documentBaseSchema,
  lineItemSchema,
} from "@/features/shared/schemas/document.schema";

export const estimateSchema = documentBaseSchema.extend({
  customerId: z.string().min(1, "Customer is required"),
  estimateNumber: z.string().optional().or(z.literal("")),
  issueDate: z.string().optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type EstimateFormInput = z.input<typeof estimateSchema>;
export type EstimateFormValues = z.output<typeof estimateSchema>;
