import { DocumentStatusBadge } from "@/components/documents/document-status-badge";

interface JournalStatusBadgeProps {
  status?: string | null;
}

export function JournalStatusBadge({ status }: JournalStatusBadgeProps) {
  return <DocumentStatusBadge status={status} />;
}
