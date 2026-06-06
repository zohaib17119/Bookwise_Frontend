import { SnapshotViewer } from "@/components/audit/snapshot-viewer";
import type { AuditLog } from "@/features/audit/types/audit.types";
import { formatDate } from "@/lib/utils/format";

interface AuditLogDetailCardProps {
  auditLog: AuditLog;
}

export function AuditLogDetailCard({ auditLog }: AuditLogDetailCardProps) {
  return (
    <div className="space-y-4">
      <div className="surface p-5">
        <h3 className="text-base font-semibold">Audit metadata</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Module</p>
            <p className="mt-1 text-sm font-medium">{auditLog.module || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Action</p>
            <p className="mt-1 text-sm font-medium">{auditLog.action || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Entity</p>
            <p className="mt-1 text-sm font-medium">{auditLog.entityType || "-"} / {auditLog.entityId || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Actor</p>
            <p className="mt-1 text-sm font-medium">{auditLog.actorName || auditLog.actorUserId || "System"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Timestamp</p>
            <p className="mt-1 text-sm font-medium">{formatDate(auditLog.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Request</p>
            <p className="mt-1 text-sm font-medium">{auditLog.requestId || auditLog.ipAddress || "-"}</p>
          </div>
        </div>
        {auditLog.description ? (
          <p className="mt-4 text-sm text-muted-foreground">{auditLog.description}</p>
        ) : null}
      </div>
      <SnapshotViewer title="Before snapshot" value={auditLog.beforeSnapshot} />
      <SnapshotViewer title="After snapshot" value={auditLog.afterSnapshot} />
      <SnapshotViewer title="Request metadata" value={auditLog.requestMetadata} />
    </div>
  );
}
