import * as React from "react";
import { cn } from "@/lib/utils/cn";

const numberInputClassName =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onWheel, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
        type === "number" && numberInputClassName,
        className,
      )}
      ref={ref}
      type={type}
      {...props}
      onWheel={(event) => {
        if (type === "number") {
          event.preventDefault();
        }

        onWheel?.(event);
      }}
    />
  ),
);

Input.displayName = "Input";
