import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
      className,
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
