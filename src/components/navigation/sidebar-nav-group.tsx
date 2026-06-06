import { NavLink } from "react-router-dom";
import type { CompanyNavigationGroup } from "@/components/navigation/navigation.config";
import { cn } from "@/lib/utils/cn";

interface SidebarNavGroupProps {
  companyId: string;
  group: CompanyNavigationGroup;
}

export function SidebarNavGroup({
  companyId,
  group,
}: SidebarNavGroupProps) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        {group.title}
      </p>
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavLink
            key={item.segment}
            to={`/app/company/${companyId}/${item.segment}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-cyan-500/12 text-cyan-200"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
                item.disabled && "pointer-events-none opacity-50",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
