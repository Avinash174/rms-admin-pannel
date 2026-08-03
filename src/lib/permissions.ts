export interface PermissionUser {
  permissions?: string[];
  roleName?: string;
}

export function can(permission: string, user?: PermissionUser | null): boolean {
  if (!user?.permissions?.length) {
    return false;
  }
  return user.permissions.includes(permission);
}

export function canAny(permissions: string[], user?: PermissionUser | null): boolean {
  return permissions.some((permission) => can(permission, user));
}

export function isSuperAdmin(user?: PermissionUser | null): boolean {
  return user?.roleName === 'SUPER_ADMIN';
}
