import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils/cn";

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  disabled?: boolean;
  tone?: "global" | "company";
  onNavigate?: () => void;
}

export function SidebarNavItem({
  to,
  icon: Icon,
  label,
  collapsed = false,
  disabled = false,
  tone = "company",
  onNavigate,
}: SidebarNavItemProps) {
  const activeClass =
    tone === "global" ? "bg-white/10 text-white" : "bg-cyan-500/12 text-cyan-200";
  const inactiveClass =
    tone === "global"
      ? "text-slate-300 hover:bg-white/5 hover:text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white";

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "rounded-xl font-medium transition",
          collapsed
            ? "flex flex-col items-center gap-0.5 px-1 py-2"
            : "flex items-center gap-3 px-3 py-2.5 text-sm",
          isActive ? activeClass : inactiveClass,
          disabled && "pointer-events-none opacity-50",
        )
      }
    >
      <Icon className={cn(collapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0")} />
      <span
        className={cn(
          collapsed
            ? "max-w-[56px] truncate text-center text-[9px] leading-tight"
            : "truncate",
        )}
      >
        {label}
      </span>
    </NavLink>
  );
}
