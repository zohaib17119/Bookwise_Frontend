import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuditLogDetailCard } from "@/components/audit/audit-log-detail-card";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useAuditLog } from "@/features/audit/hooks/use-audit";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";

export function AuditLogDetailPage() {
  const { companyId, auditLogId } = useParams();
  const { permissions } = useActiveCompany();
  const canView = canUsePermission(permissions, ["audit_logs.view", "audit.read", "audit.manage"]);
  const auditLogQuery = useAuditLog(companyId, auditLogId ?? null);

  if (!canView) {
    return (
      <ErrorState
        title="Audit access restricted"
        description="Your current company membership does not include audit log visibility."
      />
    );
  }

  if (auditLogQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading audit log...</div></PageContainer>;
  }

  if (auditLogQuery.error || !auditLogQuery.data) {
    return (
      <ErrorState
        title="Audit log not found"
        description={auditLogQuery.error?.message ?? "The requested audit record is unavailable."}
      />
    );
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/audit`}>Back to audit logs</Link>
            </Button>
          }
          description="Review actor metadata, payload snapshots, and request context."
          eyebrow="Administration"
          title={auditLogQuery.data.description || "Audit log detail"}
        />
      }
    >
      <AuditLogDetailCard auditLog={auditLogQuery.data} />
    </PageContainer>
  );
}
