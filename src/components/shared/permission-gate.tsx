import type { PropsWithChildren, ReactNode } from "react";
import { hasAllPermissions, hasAnyPermission } from "@/lib/utils/permissions";

interface PermissionGateProps extends PropsWithChildren {
  permissions?: string[];
  requireAll?: boolean;
  resolvedPermissions?: string[];
  fallback?: ReactNode;
}

export function PermissionGate({
  permissions = [],
  requireAll = false,
  resolvedPermissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  if (!permissions.length || !resolvedPermissions?.length) {
    return children;
  }

  const allowed = requireAll
    ? hasAllPermissions(resolvedPermissions, permissions)
    : hasAnyPermission(resolvedPermissions, permissions);

  return allowed ? children : fallback;
}
