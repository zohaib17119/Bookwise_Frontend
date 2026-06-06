import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));

export const reconciliationSchema = z.object({
  bankAccountId: z.string().min(1, "Bank account is required"),
  startDate: optionalString,
  endDate: optionalString,
  statementEndingBalance: z.coerce.number(),
});

export type ReconciliationFormInput = z.input<typeof reconciliationSchema>;
export type ReconciliationFormValues = z.output<typeof reconciliationSchema>;
