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
  return normalizeRoleName(user?.roleName) === 'WAREHOUSE_MANAGER';
}

/** Full-access admin roles (bypass permission checks). Warehouse Manager uses explicit permissions. */
export function isAdminRole(user?: PermissionUser | null): boolean {
  const role = normalizeRoleName(user?.roleName);
  return (
    isSuperAdmin(user) ||
    isCompanyAdmin(user) ||
    role.endsWith('_ADMIN') ||
    role.includes('ADMIN')
  );
}

export function can(permission: string, user?: PermissionUser | null): boolean {
  if (isAdminRole(user)) {
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
