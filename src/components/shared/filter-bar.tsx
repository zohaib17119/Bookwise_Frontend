import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FilterBarProps extends PropsWithChildren {
  actions?: ReactNode;
  className?: string;
}

interface FilterFieldProps extends PropsWithChildren {
  className?: string;
}

/** Constrains filter controls to inline width on tablet/desktop while stacking on mobile. */
export function FilterField({ children, className }: FilterFieldProps) {
  return (
    <div className={cn("w-full sm:w-auto sm:min-w-[160px]", className)}>
      {children}
    </div>
  );
}

export function FilterBar({ actions, className, children }: FilterBarProps) {
  return (
    <div
      className={cn(
        "surface flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        {children}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
