import { useDeferredValue, useMemo, useState } from "react";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { AuditLogFilters } from "@/components/audit/audit-log-filters";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useActivityTimeline } from "@/features/audit/hooks/use-audit";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";

export function ActivityPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canUsePermission(permissions, ["audit_logs.view", "audit.read", "audit.manage"]);
  const [filters, setFilters] = useState({
    search: "",
    module: "",
    action: "",
    entityType: "",
    actorUserId: "",
    fromDate: "",
    toDate: "",
  });
  const deferredSearch = useDeferredValue(filters.search);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch || undefined,
      module: filters.module || undefined,
      action: filters.action || undefined,
      entityType: filters.entityType || undefined,
      actorUserId: filters.actorUserId || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    }),
    [deferredSearch, filters],
  );
  const timelineQuery = useActivityTimeline(companyId, queryFilters);

  if (!canView) {
    return (
      <ErrorState
        title="Activity access restricted"
        description="Your current company membership does not include audit log visibility."
      />
    );
  }

  return (
    <EntityListPage
      content={
        timelineQuery.error ? (
          <ErrorState
            title="Unable to load activity timeline"
            description={timelineQuery.error.message}
          />
        ) : timelineQuery.isLoading ? (
          <div className="surface p-6">Loading activity timeline...</div>
        ) : (
          <ActivityTimeline
            emptyDescription="No activity events matched the selected filters."
            events={(timelineQuery.data ?? []).map((event) => ({
              id: event.id,
              action: event.action,
              actor: event.actorName,
              createdAt: event.createdAt,
              description: event.description,
              title: event.title || `${event.entityType || "Entity"} activity`,
            }))}
          />
        )
      }
      description="Newest-first company activity stream for investigation and operational review."
      eyebrow="Administration"
      title="Activity Timeline"
      toolbar={
        <AuditLogFilters
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          values={filters}
        />
      }
    />
  );
}
