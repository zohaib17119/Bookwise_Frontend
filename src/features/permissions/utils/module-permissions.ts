import { hasAnyPermission } from "@/lib/utils/permissions";

export function canViewEntity(
  resolvedPermissions: string[],
  permissionPrefix: string,
) {
  if (!resolvedPermissions.length) {
    return true;
  }

  return hasAnyPermission(resolvedPermissions, [
    `${permissionPrefix}.view`,
    `${permissionPrefix}.read`,
    `${permissionPrefix}.manage`,
  ]);
}

export function canManageEntity(
  resolvedPermissions: string[],
  permissionPrefix: string,
) {
  if (!resolvedPermissions.length) {
    return true;
  }

  return hasAnyPermission(resolvedPermissions, [`${permissionPrefix}.manage`]);
}

export function canUsePermission(
  resolvedPermissions: string[],
  permissionKeys: string[],
) {
  if (!resolvedPermissions.length) {
    return true;
  }

  return hasAnyPermission(resolvedPermissions, permissionKeys);
}
