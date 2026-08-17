export interface PermissionUser {
  permissions?: string[];
  roleName?: string;
}

export function normalizeRoleName(roleName?: string | null): string {
  return (roleName || '').trim().toUpperCase().replace(/\s+/g, '_');
}

export function isSuperAdmin(user?: PermissionUser | null): boolean {
  const role = normalizeRoleName(user?.roleName);
  return role === 'SUPER_ADMIN' || role.includes('SUPER') && role.includes('ADMIN');
}

export function isCompanyAdmin(user?: PermissionUser | null): boolean {
  const role = normalizeRoleName(user?.roleName);
  return role === 'COMPANY_ADMIN' || role === 'COMPANY_ADMINISTRATOR';
}

export function isWarehouseManager(user?: PermissionUser | null): boolean {
  const role = normalizeRoleName(user?.roleName);
  return role === 'WAREHOUSE_MANAGER' || role === 'WAREHOUSE_ADMIN';
}

export function isWarehouseAdmin(user?: PermissionUser | null): boolean {
  return isWarehouseManager(user);
}

/** Global master routes strictly blocked for Warehouse Admin / Warehouse Manager */
export const WAREHOUSE_ADMIN_BLOCKED_ROUTES = [
  '/companies',
  '/branches',
  '/sites',
  '/warehouses',
  '/users',
  '/roles',
  '/box-types',
  '/file-types',
  '/status-master',
  '/departments',
  '/clients',
  '/devices',
  '/sync',
  '/gps'
];

/** Super Admin & Company Admin see company-wide panel, not warehouse-scoped UI */
export function usesCompanyScope(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isCompanyAdmin(user);
}

/** Warehouse panel/dashboard only for operational roles with an assigned warehouse */
export function usesWarehouseScope(
  user?: PermissionUser | null,
  warehouseId?: string | null
): boolean {
  if (!user || !warehouseId) return false;
  return !usesCompanyScope(user);
}

/** Legacy helper — prefer explicit permission checks via can() */
export function isAdminRole(user?: PermissionUser | null): boolean {
  const role = normalizeRoleName(user?.roleName);
  return (
    isSuperAdmin(user) ||
    isCompanyAdmin(user) ||
    role.endsWith('_ADMIN') ||
    role.includes('ADMIN')
  );
}

/** Permission-driven access — Super Admin has unrestricted access */
export function can(permission: string, user?: PermissionUser | null): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }
  if (!user?.permissions?.length) {
    return false;
  }
  return user.permissions.includes(permission);
}

export function canAny(permissions: string[], user?: PermissionUser | null): boolean {
  return permissions.some((permission) => can(permission, user));
}

export function canAccessNavItem(
  permission: string | string[] | undefined,
  user?: PermissionUser | null
): boolean {
  if (!user) return false;
  if (!permission) return true;
  const perms = Array.isArray(permission) ? permission : [permission];
  return canAny(perms, user);
}

export function canSwitchCompany(
  user: PermissionUser | null | undefined,
  availableCount: number
): boolean {
  if (isSuperAdmin(user) && availableCount > 0) {
    return true;
  }
  if (isWarehouseAdmin(user)) {
    return false;
  }
  return can('company:manage', user) && availableCount > 1;
}

export function canSwitchBranch(
  user: PermissionUser | null | undefined,
  availableCount: number
): boolean {
  if (isWarehouseAdmin(user)) {
    return false;
  }
  return can('branch:view', user) && availableCount > 1;
}

export function canSwitchWarehouse(
  user: PermissionUser | null | undefined,
  availableCount: number
): boolean {
  if (isWarehouseAdmin(user)) {
    return false;
  }
  return can('warehouse:view', user) && availableCount > 1;
}
