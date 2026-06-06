import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuditLogFilters } from "@/components/audit/audit-log-filters";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { ExportActions } from "@/components/shared/export-actions";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useAuditLogs } from "@/features/audit/hooks/use-audit";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";

export function AuditLogsPage() {
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
  const auditLogsQuery = useAuditLogs(companyId, queryFilters);

  if (!canView) {
    return (
      <ErrorState
        title="Audit access restricted"
        description="Your current company membership does not include audit log visibility."
      />
    );
  }

  return (
    <EntityListPage
      content={
        auditLogsQuery.error ? (
          <ErrorState
            title="Unable to load audit logs"
            description={auditLogsQuery.error.message}
          />
        ) : (
          <AuditLogTable
            companyId={companyId!}
            data={auditLogsQuery.data ?? []}
            isLoading={auditLogsQuery.isLoading}
          />
        )
      }
      description="Investigate company activity, configuration changes, and transactional events."
      eyebrow="Administration"
      headerActions={
        <div className="flex flex-wrap gap-2">
          <ExportActions onExport={async () => undefined} />
          <Button asChild variant="secondary">
            <Link to={`/app/company/${companyId}/activity`}>View activity timeline</Link>
          </Button>
        </div>
      }
      title="Audit Logs"
      toolbar={
        <AuditLogFilters
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          values={filters}
        />
      }
    />
  );
}
