import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface AccountingActionBarProps {
  actions: ReactNode;
  className?: string;
}

export function AccountingActionBar({
  actions,
  className,
}: AccountingActionBarProps) {
  return (
    <div
      className={cn(
        "surface flex flex-wrap items-center justify-end gap-3 p-4",
        className,
      )}
    >
      {actions}
    </div>
  );
}
