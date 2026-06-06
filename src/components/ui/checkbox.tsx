import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    className={cn(
      "h-4 w-4 rounded border-border text-primary focus:ring-primary/30",
      className,
    )}
    ref={ref}
    type="checkbox"
    {...props}
  />
));

Checkbox.displayName = "Checkbox";
