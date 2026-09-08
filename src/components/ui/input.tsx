import * as React from "react";
import { cn } from "@/lib/utils/cn";

const numberInputClassName =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onWheel, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    React.useEffect(() => {
      const el = innerRef.current;
      if (!el || type !== "number") return;
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        el.blur();
      };
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    }, [type]);

    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
          type === "number" && numberInputClassName,
          className,
        )}
        ref={setRefs}
        type={type}
        {...props}
        onWheel={onWheel}
      />
    );
  },
);

Input.displayName = "Input";
