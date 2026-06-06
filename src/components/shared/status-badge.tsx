import { cn } from "@/lib/utils/cn";

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
