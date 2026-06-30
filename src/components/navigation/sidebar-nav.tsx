import { companyNavigationGroups } from "@/components/navigation/navigation.config";
import { SidebarNavGroup } from "@/components/navigation/sidebar-nav-group";
import { filterNavigationGroups } from "@/features/permissions/utils/navigation-permissions";

interface SidebarNavProps {
  companyId: string;
  permissions: string[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({
  companyId,
  permissions,
  collapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const visibleGroups = filterNavigationGroups(companyNavigationGroups, permissions);

  return (
    <nav className={collapsed ? "space-y-4" : "space-y-7"}>
      {visibleGroups.map((group) => (
        <SidebarNavGroup
          collapsed={collapsed}
          companyId={companyId}
          group={group}
          key={group.title}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
