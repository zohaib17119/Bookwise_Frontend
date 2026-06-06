import { z } from "zod";
import { paymentBaseSchema } from "@/features/shared/schemas/document.schema";

export const billPaymentSchema = paymentBaseSchema.extend({
  vendorId: z.string().min(1, "Vendor is required"),
});

export type BillPaymentFormInput = z.input<typeof billPaymentSchema>;
export type BillPaymentFormValues = z.output<typeof billPaymentSchema>;
