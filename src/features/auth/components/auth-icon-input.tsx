import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AuthIconInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
};

export const AuthIconInput = React.forwardRef<HTMLInputElement, AuthIconInputProps>(
  ({ className, icon: Icon, ...props }, ref) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        className={cn(
          "flex h-12 w-full rounded-xl border border-white/10 bg-[#112240] py-2 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  ),
);

AuthIconInput.displayName = "AuthIconInput";
