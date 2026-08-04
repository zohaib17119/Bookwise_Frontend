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
    <div className={cn("w-full shrink-0 sm:w-auto sm:min-w-[140px]", className)}>
      {children}
    </div>
  );
}

export function FilterBar({ actions, className, children }: FilterBarProps) {
  return (
    <div
      className={cn(
        "surface flex flex-col gap-2 p-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between",
        "[&_input]:h-9 [&_select]:h-9",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:overflow-x-auto">
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
