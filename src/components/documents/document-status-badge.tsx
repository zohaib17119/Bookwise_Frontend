import { cn } from "@/lib/utils/cn";

interface DocumentStatusBadgeProps {
  status?: string | null;
}

const statusClassMap: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-600",
  ISSUED: "bg-cyan-50 text-cyan-700",
  PARTIALLY_PAID: "bg-orange-50 text-orange-700",
  PAID: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-rose-50 text-rose-700",
  OPEN: "bg-blue-50 text-blue-700",
  VOID: "bg-slate-100 text-slate-700",
  RECORDED: "bg-cyan-50 text-cyan-700",
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const label = status?.replace(/_/g, " ") ?? "Unknown";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em]",
        statusClassMap[status ?? ""] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {label}
    </span>
  );
}
