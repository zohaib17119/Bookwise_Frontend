import type { ReactNode } from "react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SectionCard } from "@/components/shared/section-card";

interface DocumentHeaderCardProps {
  title: string;
  number?: string | null;
  status?: string | null;
  description?: string;
  actions?: ReactNode;
}

export function DocumentHeaderCard({
  title,
  number,
  status,
  description,
  actions,
}: DocumentHeaderCardProps) {
  return (
    <SectionCard
      actions={actions}
      description={description}
      title={title}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Document Number
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {number || "Pending assignment"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DocumentStatusBadge status={status} />
        </div>
      </div>
    </SectionCard>
  );
}
