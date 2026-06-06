import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Input.displayName = "Input";
