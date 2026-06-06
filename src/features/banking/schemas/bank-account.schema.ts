import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalMoney = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return Number(value);
}, z.number().optional());

export const bankAccountSchema = z.object({
  linkedAccountId: z.string().min(1, "Linked account is required"),
  name: z.string().min(2, "Name is required"),
  accountNumberMasked: optionalString,
  bankName: optionalString,
  branchName: optionalString,
  currencyCode: optionalString,
  openingBalance: optionalMoney,
  openingBalanceDate: optionalString,
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

export type BankAccountFormInput = z.input<typeof bankAccountSchema>;
export type BankAccountFormValues = z.output<typeof bankAccountSchema>;
