import { z } from "zod";

export const investorFormSchema = z.object({
  code: z.string().trim().max(50).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required").max(150),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type InvestorFormValues = z.infer<typeof investorFormSchema>;

export const investmentFormSchema = z.object({
  investmentDate: z.string().trim().min(1, "Date is required"),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  paymentAccountId: z.string().trim().min(1, "Select cash or bank account"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type InvestmentFormValues = z.infer<typeof investmentFormSchema>;
