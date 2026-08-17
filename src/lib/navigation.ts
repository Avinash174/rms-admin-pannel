import { canAccessNavItem, isCompanyAdmin, isSuperAdmin, isWarehouseAdmin, PermissionUser } from '@/lib/permissions';

export type NavItemConfig = {
  href: string;
  label: string;
  /** User needs at least one of these permissions */
  permission?: string | string[];
  hideForCompanyAdmin?: boolean;
  hideForWarehouseAdmin?: boolean;
};

export type NavSectionConfig = {
  category: string;
  isCollapsible?: boolean;
  hideForSuperAdmin?: boolean;
  hideForCompanyAdmin?: boolean;
  hideForWarehouseAdmin?: boolean;
  items: NavItemConfig[];
};

/**
 * RMS-focused navigation — Records Management modules.
 * Super Admin has Global access to all masters, structures, operations, and system administration.
 * Company Admin manages Company-scoped Masters, Structure, Inventory, Operations, Users, and Reports.
 * Warehouse Admin manages Warehouse Structure, Inventory, Operations, Scanners, and Warehouse Reports.
 */
export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    category: 'Dashboard',
    isCollapsible: false,
    items: [{ href: '/dashboard', label: 'Dashboard', permission: 'dashboard:view' }],
  },
  {
    category: 'Organization',
    isCollapsible: true,
    hideForWarehouseAdmin: true,
    items: [
      { href: '/companies', label: 'Company Master', permission: 'company:manage', hideForCompanyAdmin: true },
      { href: '/branches', label: 'Branch Master', permission: 'branch:view' },
      { href: '/sites', label: 'Site Master', permission: 'site:view' },
      { href: '/warehouses', label: 'Warehouse Master', permission: 'warehouse:view' },
    ],
  },
  {
    category: 'Warehouse Structure',
    isCollapsible: true,
    items: [
      { href: '/rooms', label: 'Rooms', permission: 'storage:view' },
      { href: '/rows', label: 'Rows', permission: 'storage:view' },
      { href: '/racks', label: 'Racks', permission: 'storage:view' },
      { href: '/rack-templates', label: 'Rack Templates', permission: 'storage:view' },
      { href: '/levels', label: 'Levels', permission: 'storage:view' },
      { href: '/locations', label: 'Locations', permission: 'storage:view' },
    ],
  },
  {
    category: 'Inventory',
    isCollapsible: true,
    items: [
      { href: '/boxes', label: 'Box Master', permission: 'box:view' },
      { href: '/file-records', label: 'File Master', permission: 'file:view' },
      { href: '/barcodes/master', label: 'Barcode Master', permission: 'box:manage' },
      {
        href: '/workflows/inventory-verification',
        label: 'Inventory Verification',
        permission: ['report:view', 'audit:view'],
      },
      { href: '/inventory-movements', label: 'Inventory Movements', permission: ['report:view', 'box:manage'] },
    ],
  },
  {
    category: 'System Masters',
    isCollapsible: true,
    items: [
      { href: '/box-types', label: 'Box Types', permission: 'box:view' },
      { href: '/file-types', label: 'File Types', permission: 'file:view' },
      { href: '/status-master', label: 'Status Master', permission: 'settings:view' },
    ],
  },
  {
    category: 'Business Masters',
    isCollapsible: true,
    hideForWarehouseAdmin: true,
    items: [
      { href: '/departments', label: 'Departments', permission: 'settings:view' },
      { href: '/clients', label: 'Clients Master', permission: 'client:view' },
      { href: '/vendors', label: 'Vendors Master', permission: 'settings:view' },
    ],
  },
  {
    category: 'Users & Access',
    isCollapsible: true,
    hideForWarehouseAdmin: true,
    items: [
      { href: '/users', label: 'User Master', permission: 'user:view' },
      { href: '/roles', label: 'Role Master', permission: 'role:view', hideForCompanyAdmin: true },
    ],
  },
  {
    category: 'Operations',
    isCollapsible: true,
    items: [
      { href: '/workflows/fresh-box-move', label: 'Fresh Box Move', permission: ['workflow:execute', 'box:manage'] },
      { href: '/workflows/segregation', label: 'Segregation', permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/refile', label: 'Refile', permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/transfer', label: 'Transfer', permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/merge', label: 'Merge / Split', permission: ['workflow:execute', 'report:view'] },
    ],
  },
  {
    category: 'Work Management',
    isCollapsible: true,
    items: [{ href: '/work-orders', label: 'Work Orders', permission: ['workflow:execute', 'report:view'] }],
  },
  {
    category: 'Reports',
    isCollapsible: true,
    items: [
      { href: '/reports', label: 'Inventory Reports', permission: 'report:view' },
      { href: '/audit-logs', label: 'Audit Logs', permission: 'audit:view' },
    ],
  },
  {
    category: 'Devices',
    isCollapsible: true,
    items: [
      { href: '/devices', label: 'Scanner Devices', permission: 'device:view' },
      { href: '/sync', label: 'Sync History', permission: 'sync:manage' },
    ],
  },
  {
    category: 'Account',
    isCollapsible: true,
    items: [{ href: '/settings', label: 'Settings & Profile', permission: 'settings:view' }],
  },
];

/** Routes reachable by URL but not listed in the sidebar */
const EXTRA_ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  '/shelves': 'storage:view',
  '/barcodes': 'box:manage',
  '/audit': 'audit:view',
  '/gps': 'settings:view',
  '/reason-codes': 'settings:view',
  '/operations/refile': ['workflow:execute', 'report:view'],
  '/operations/inventory': ['report:view', 'audit:view'],
  '/operations/transfer': ['workflow:execute', 'report:view'],
  '/notifications': 'notification:view',
  '/forbidden': [],
};

export const ALL_NAV_HREFS = NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));

export function buildRoutePermissionsMap(): Record<string, string | string[]> {
  const map: Record<string, string | string[]> = { ...EXTRA_ROUTE_PERMISSIONS };

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.permission) {
        map[item.href] = item.permission;
      }
    }
  }

  return map;
}

export function isNavSectionVisible(section: NavSectionConfig, user: PermissionUser | null): boolean {
  if (!user) return false;
  if (section.hideForSuperAdmin && isSuperAdmin(user)) return false;
  if (section.hideForCompanyAdmin && isCompanyAdmin(user)) return false;
  if (section.hideForWarehouseAdmin && isWarehouseAdmin(user)) return false;
  return section.items.some((item) => isNavItemVisible(item, user));
}

export function isNavItemVisible(item: NavItemConfig, user: PermissionUser | null): boolean {
  if (!user) return false;
  if (item.hideForCompanyAdmin && isCompanyAdmin(user)) return false;
  if (item.hideForWarehouseAdmin && isWarehouseAdmin(user)) return false;
  return canAccessNavItem(item.permission, user);
}

export function getVisibleNavSections(user: PermissionUser | null): NavSectionConfig[] {
  return NAV_SECTIONS.filter((section) => isNavSectionVisible(section, user)).map((section) => ({
    ...section,
    items: section.items.filter((item) => isNavItemVisible(item, user)),
  })).filter((section) => section.items.length > 0);
}
