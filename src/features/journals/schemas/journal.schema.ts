import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalMoney = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}, z.number().min(0));

export const journalLineSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  description: optionalString,
  debitAmount: optionalMoney,
  creditAmount: optionalMoney,
});

export const journalEntrySchema = z.object({
  entryDate: optionalString,
  entryNumber: optionalString,
  description: optionalString,
  referenceNumber: optionalString,
  lines: z.array(journalLineSchema).min(2, "At least two journal lines are required"),
});

export type JournalEntryFormInput = z.input<typeof journalEntrySchema>;
export type JournalEntryFormValues = z.output<typeof journalEntrySchema>;
