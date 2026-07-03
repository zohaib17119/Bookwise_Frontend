import { z } from "zod";

export const expenseSchema = z.object({
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentAccountId: z.string().uuid("Select a payment account"),
  expenseAccountId: z.string().uuid("Select an expense category"),
  vendorId: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  referenceNumber: z.string().trim().max(100).optional(),
});

export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseFormValues = z.output<typeof expenseSchema>;
