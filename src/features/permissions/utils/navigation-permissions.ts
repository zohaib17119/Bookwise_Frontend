import type {
  CompanyNavigationGroup,
  CompanyNavigationItem,
} from "@/components/navigation/navigation.config";
import { hasAnyPermission } from "@/lib/utils/permissions";

export function canViewModule(
  item: CompanyNavigationItem,
  permissions: string[],
) {
  if (!permissions.length) {
    return true;
  }

  return !item.permissionKeys?.length || hasAnyPermission(permissions, item.permissionKeys);
}

export function filterNavigationGroups(
  groups: CompanyNavigationGroup[],
  permissions: string[],
) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canViewModule(item, permissions)),
    }))
    .filter((group) => group.items.length > 0);
}
