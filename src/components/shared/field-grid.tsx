import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

interface FieldGridProps extends PropsWithChildren {
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FieldGrid({
  columns = 2,
  className,
  children,
}: FieldGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
