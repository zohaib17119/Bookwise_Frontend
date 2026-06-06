import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type { ActivityEvent, AuditLog, AuditLogListParams } from "@/features/audit/types/audit.types";

function buildQuery(params: AuditLogListParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.module) query.set("module", params.module);
  if (params.action) query.set("action", params.action);
  if (params.actorUserId) query.set("actorUserId", params.actorUserId);
  if (params.entityType) query.set("entityType", params.entityType);
  if (params.entityId) query.set("entityId", params.entityId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getAuditLogs(companyId: string, params: AuditLogListParams = {}) {
  const { data } = await apiClient.get<AuditLog[]>(
    `/companies/${companyId}/audit-logs${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getAuditLog(companyId: string, auditLogId: string) {
  const { data } = await apiClient.get<AuditLog>(`/companies/${companyId}/audit-logs/${auditLogId}`);
  return data;
}

export async function getActivityTimeline(companyId: string, params: AuditLogListParams = {}) {
  const { data } = await apiClient.get<ActivityEvent[]>(
    `/companies/${companyId}/activity-timeline${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getEntityTimeline(
  companyId: string,
  entityPath: string,
) {
  const { data } = await apiClient.get<ActivityEvent[]>(`/companies/${companyId}/${entityPath}/timeline`);
  return extractListData(data);
}
