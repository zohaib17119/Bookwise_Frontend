import { z } from "zod";
import {
  MONEY_STRING_REGEX,
  toDecimalString,
  toMoneyDecimalString,
} from "@/features/shared/utils/decimal-string";

const requiredExpenseAmountSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return "";
    }
    return toMoneyDecimalString(value) || toDecimalString(value, 2);
  },
  z
    .string()
    .regex(MONEY_STRING_REGEX, "Enter a valid amount")
    .refine((value) => Number(value) >= 0.01, {
      message: "Amount must be greater than zero",
    }),
);

export const expenseSchema = z.object({
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentAccountId: z.string().uuid("Select a payment account"),
  expenseAccountId: z.string().uuid("Select an expense category"),
  amount: requiredExpenseAmountSchema,
  description: z.string().trim().min(1, "Description is required").max(2000),
  referenceNumber: z.string().trim().max(100).optional(),
});

export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseFormValues = z.output<typeof expenseSchema>;
