export function hasPermission(
  resolvedPermissions: string[] | undefined,
  permission: string,
) {
  if (!resolvedPermissions?.length) {
    return false;
  }

  return resolvedPermissions.includes(permission);
}

export function hasAnyPermission(
  resolvedPermissions: string[] | undefined,
  permissions: string[],
) {
  if (!permissions.length) {
    return true;
  }

  return permissions.some((permission) =>
    hasPermission(resolvedPermissions, permission),
  );
}

export function hasAllPermissions(
  resolvedPermissions: string[] | undefined,
  permissions: string[],
) {
  if (!permissions.length) {
    return true;
  }

  return permissions.every((permission) =>
    hasPermission(resolvedPermissions, permission),
  );
}
