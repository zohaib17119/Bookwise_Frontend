import { companyNavigationGroups } from "@/components/navigation/navigation.config";
import { SidebarNavGroup } from "@/components/navigation/sidebar-nav-group";
import { filterNavigationGroups } from "@/features/permissions/utils/navigation-permissions";

interface SidebarNavProps {
  companyId: string;
  permissions: string[];
}

export function SidebarNav({ companyId, permissions }: SidebarNavProps) {
  const visibleGroups = filterNavigationGroups(companyNavigationGroups, permissions);

  return (
    <nav className="space-y-7">
      {visibleGroups.map((group) => (
        <SidebarNavGroup companyId={companyId} group={group} key={group.title} />
      ))}
    </nav>
  );
}
