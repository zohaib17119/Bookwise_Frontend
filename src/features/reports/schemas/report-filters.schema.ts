import { z } from "zod";

export const reportFiltersSchema = z.object({
  fromDate: z.string().optional().or(z.literal("")),
  toDate: z.string().optional().or(z.literal("")),
  asOfDate: z.string().optional().or(z.literal("")),
  accountId: z.string().optional().or(z.literal("")),
  postedOnly: z.boolean().optional(),
});

export type ReportFiltersInput = z.input<typeof reportFiltersSchema>;
export type ReportFiltersValues = z.output<typeof reportFiltersSchema>;
