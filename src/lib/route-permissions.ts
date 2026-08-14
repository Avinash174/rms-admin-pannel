import { can } from '@/lib/permissions';

type PermissionUser = { permissions?: string[]; roleName?: string };

/** Mirrors sidebar NAV_SECTIONS permission rules */
const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  '/dashboard': 'dashboard:view',
  '/companies': ['company:view', 'settings:view'],
  '/branches': ['branch:view', 'settings:view'],
  '/sites': ['site:view', 'settings:view'],
  '/warehouses': ['warehouse:view', 'settings:view'],
  '/warehouses/types': ['warehouse:view', 'settings:view'],
  '/rooms': ['storage:view', 'settings:view'],
  '/rows': ['storage:view', 'settings:view'],
  '/racks': ['storage:view', 'settings:view'],
  '/rack-templates': ['storage:view', 'settings:view'],
  '/levels': ['storage:view', 'settings:view'],
  '/locations': ['storage:view', 'settings:view'],
  '/shelves': ['storage:view', 'settings:view'],
  '/box-types': ['box:view', 'settings:view'],
  '/file-types': ['file:view', 'settings:view'],
  '/boxes': ['box:view', 'settings:view'],
  '/file-records': ['file:view', 'settings:view'],
  '/departments': 'settings:view',
  '/vendors': 'settings:view',
  '/clients': ['client:view', 'settings:view'],
  '/barcodes/master': ['settings:view', 'box:manage'],
  '/barcodes': ['settings:view', 'box:manage'],
  '/status-master': 'settings:view',
  '/work-orders': ['workflow:execute', 'report:view'],
  '/inventory-movements': ['report:view', 'box:manage'],
  '/users': ['user:view', 'settings:view'],
  '/roles': ['role:view', 'settings:view'],
  '/workflows/fresh-box-move': ['workflow:execute', 'box:manage'],
  '/workflows/segregation': ['workflow:execute', 'report:view'],
  '/workflows/refile': ['workflow:execute', 'report:view'],
  '/workflows/merge': ['workflow:execute', 'report:view'],
  '/workflows/inventory-verification': ['report:view', 'audit:view'],
  '/workflows/transfer': ['workflow:execute', 'report:view'],
  '/operations/refile': ['workflow:execute', 'report:view'],
  '/operations/inventory': ['report:view', 'audit:view'],
  '/operations/transfer': ['workflow:execute', 'report:view'],
  '/reports': 'report:view',
  '/audit-logs': 'audit:view',
  '/audit': 'audit:view',
  '/devices': 'device:view',
  '/sync': 'sync:manage',
  '/settings': 'settings:view',
  '/gps': 'settings:view',
  '/reason-codes': 'settings:view',
  '/forbidden': [],
};

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

export function hasRouteAccess(pathname: string, user: PermissionUser | null): boolean {
  if (!user) return false;

  const required = resolveRequiredPermission(pathname);
  if (!required) return true;

  const permissions = Array.isArray(required) ? required : [required];
  return permissions.some((p) => can(p, user));
}
