import { cn } from "@/lib/utils/cn";

interface InventoryStatusBadgeProps {
  status?: string | null;
  lowStock?: boolean;
}

export function InventoryStatusBadge({
  status,
  lowStock,
}: InventoryStatusBadgeProps) {
  const label = lowStock ? "Low stock" : status ?? "Normal";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em]",
        lowStock ? "bg-amber-50 text-amber-700" : "bg-secondary text-secondary-foreground",
      )}
    >
      {label}
    </span>
  );
}
