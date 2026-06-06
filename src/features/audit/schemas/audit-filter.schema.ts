import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));

export const auditFilterSchema = z.object({
  search: optionalString,
  module: optionalString,
  action: optionalString,
  actorUserId: optionalString,
  entityType: optionalString,
  entityId: optionalString,
  fromDate: optionalString,
  toDate: optionalString,
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
});

export type AuditFilterFormInput = z.input<typeof auditFilterSchema>;
export type AuditFilterFormValues = z.output<typeof auditFilterSchema>;
