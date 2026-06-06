import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { AuditLog } from "@/features/audit/types/audit.types";
import { formatDate } from "@/lib/utils/format";

interface AuditLogTableProps {
  companyId: string;
  data: AuditLog[];
  isLoading?: boolean;
}

export function AuditLogTable({
  companyId,
  data,
  isLoading,
}: AuditLogTableProps) {
  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Created",
      render: (log) => formatDate(log.createdAt),
    },
    {
      key: "module",
      header: "Module",
      render: (log) => log.module || "-",
    },
    {
      key: "action",
      header: "Action",
      render: (log) => log.action || "-",
    },
    {
      key: "entity",
      header: "Entity",
      render: (log) => (
        <div>
          <p className="font-medium">{log.entityType || "-"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{log.entityNumber || log.entityId || "-"}</p>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (log) => log.actorName || log.actorUserId || "System",
    },
    {
      key: "description",
      header: "Description",
      render: (log) => (
        <Link
          className="text-primary hover:underline"
          to={`/app/company/${companyId}/audit/${log.id}`}
        >
          {log.description || "View details"}
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyDescription="No audit events matched the current filters."
      emptyTitle="No audit logs found"
      getRowKey={(log) => log.id}
      isLoading={isLoading}
    />
  );
}
