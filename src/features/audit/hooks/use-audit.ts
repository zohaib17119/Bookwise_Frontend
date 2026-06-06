import { useQuery } from "@tanstack/react-query";
import {
  getActivityTimeline,
  getAuditLog,
  getAuditLogs,
  getEntityTimeline,
} from "@/features/audit/api/audit.api";
import type { AuditLogListParams } from "@/features/audit/types/audit.types";

export function useAuditLogs(companyId: string | undefined, params: AuditLogListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "audit-logs", params],
    queryFn: () => getAuditLogs(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useAuditLog(companyId: string | undefined, auditLogId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "audit-logs", auditLogId],
    queryFn: () => getAuditLog(companyId!, auditLogId!),
    enabled: Boolean(companyId && auditLogId),
  });
}

export function useActivityTimeline(companyId: string | undefined, params: AuditLogListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "activity-timeline", params],
    queryFn: () => getActivityTimeline(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useEntityTimeline(
  companyId: string | undefined,
  entityPath: string | null,
) {
  return useQuery({
    queryKey: ["companies", companyId, "entity-timeline", entityPath],
    queryFn: () => getEntityTimeline(companyId!, entityPath!),
    enabled: Boolean(companyId && entityPath),
  });
}
