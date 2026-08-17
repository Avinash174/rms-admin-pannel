import { canAccessNavItem, PermissionUser, isCompanyAdmin, isSuperAdmin } from '@/lib/permissions';
import { buildRoutePermissionsMap } from '@/lib/navigation';

type PermissionUserLike = PermissionUser;

const ROUTE_PERMISSIONS = buildRoutePermissionsMap();

export function resolveRequiredPermission(pathname: string): string | string[] | null {
  if (pathname === '/forbidden') return null;

  const exact = ROUTE_PERMISSIONS[pathname];
  if (exact !== undefined) {
    if (Array.isArray(exact) && exact.length === 0) return null;
    return exact;
  }

  const sortedRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter((r) => r !== '/dashboard' && r !== '/forbidden')
    .sort((a, b) => b.length - a.length);

  for (const route of sortedRoutes) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return ROUTE_PERMISSIONS[route];
    }
  }

  return null;
}

export function hasRouteAccess(pathname: string, user: PermissionUserLike | null): boolean {
  if (!user) return false;

  const required = resolveRequiredPermission(pathname);
  if (!required) return true;

  return canAccessNavItem(required, user);
}

const LANDING_ROUTE_CANDIDATES = [
  '/dashboard',
  '/warehouses',
  '/rooms',
  '/boxes',
  '/workflows/fresh-box-move',
  '/reports',
  '/devices',
];

export function getDefaultLandingPath(user: PermissionUserLike | null): string {
  if (!user) return '/login';
  if ((isSuperAdmin(user) || isCompanyAdmin(user)) && hasRouteAccess('/dashboard', user)) {
    return '/dashboard';
  }
  for (const path of LANDING_ROUTE_CANDIDATES) {
    if (hasRouteAccess(path, user)) return path;
  }
  return '/forbidden';
}
