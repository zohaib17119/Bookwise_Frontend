import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "bg-transparent text-foreground hover:bg-secondary",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-4",
  sm: "h-9 px-3 text-xs",
  icon: "h-10 w-10",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "default",
      isLoading,
      asChild,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      return React.cloneElement(children, {
        className: cn(classes, children.props.className),
      });
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
