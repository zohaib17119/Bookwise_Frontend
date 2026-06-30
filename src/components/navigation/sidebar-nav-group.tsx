import type { CompanyNavigationGroup } from "@/components/navigation/navigation.config";
import { SidebarNavItem } from "@/components/navigation/sidebar-nav-item";

interface SidebarNavGroupProps {
  companyId: string;
  group: CompanyNavigationGroup;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavGroup({
  companyId,
  group,
  collapsed = false,
  onNavigate,
}: SidebarNavGroupProps) {
  return (
    <div className="space-y-2">
      {!collapsed ? (
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          {group.title}
        </p>
      ) : null}
      <div className={collapsed ? "space-y-1" : "space-y-1"}>
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.segment}
            collapsed={collapsed}
            disabled={item.disabled}
            icon={item.icon}
            label={item.label}
            onNavigate={onNavigate}
            to={`/app/company/${companyId}/${item.segment}`}
            tone="company"
          />
        ))}
      </div>
    </div>
  );
}
