import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));

export const bankTransactionSchema = z.object({
  bankAccountId: z.string().min(1, "Bank account is required"),
  transactionDate: optionalString,
  description: optionalString,
  amount: z.coerce.number(),
  type: optionalString,
  direction: optionalString,
  source: optionalString,
});

export type BankTransactionFormInput = z.input<typeof bankTransactionSchema>;
export type BankTransactionFormValues = z.output<typeof bankTransactionSchema>;
