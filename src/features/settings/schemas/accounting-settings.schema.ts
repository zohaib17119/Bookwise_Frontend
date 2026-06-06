import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Number(value);
}, z.number().optional());

export const accountingSettingsSchema = z.object({
  fiscalYearStartMonth: optionalNumber,
  fiscalYearStartDay: optionalNumber,
  accountingMethod: optionalString,
  defaultCurrencyCode: optionalString,
  accountCodeStrategy: optionalString,
  accountHierarchyEnabled: z.boolean(),
  allowManualJournalEntries: z.boolean(),
  lockDate: optionalString,
});

export type AccountingSettingsFormInput = z.input<typeof accountingSettingsSchema>;
export type AccountingSettingsFormValues = z.output<typeof accountingSettingsSchema>;
