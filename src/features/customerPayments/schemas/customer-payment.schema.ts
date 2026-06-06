import { z } from "zod";
import { paymentBaseSchema } from "@/features/shared/schemas/document.schema";

export const customerPaymentSchema = paymentBaseSchema.extend({
  customerId: z.string().min(1, "Customer is required"),
});

export type CustomerPaymentFormInput = z.input<typeof customerPaymentSchema>;
export type CustomerPaymentFormValues = z.output<typeof customerPaymentSchema>;
