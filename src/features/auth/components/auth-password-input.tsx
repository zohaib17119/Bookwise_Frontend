import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AuthPasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AuthPasswordInput = React.forwardRef<HTMLInputElement, AuthPasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className={cn(
            "flex h-12 w-full rounded-xl border border-white/10 bg-[#112240] py-2 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20",
            className,
          )}
          ref={ref}
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

AuthPasswordInput.displayName = "AuthPasswordInput";
