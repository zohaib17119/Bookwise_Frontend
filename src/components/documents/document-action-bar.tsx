import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface DocumentActionBarProps {
  actions: ReactNode;
  className?: string;
}

export function DocumentActionBar({
  actions,
  className,
}: DocumentActionBarProps) {
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
