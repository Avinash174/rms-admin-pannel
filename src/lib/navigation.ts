import { canAccessNavItem, isSuperAdmin, PermissionUser } from '@/lib/permissions';

export type NavItemConfig = {
  href: string;
  label: string;
  /** User needs at least one of these permissions */
  permission?: string | string[];
};

export type NavSectionConfig = {
  category: string;
  isCollapsible?: boolean;
  /** Hidden in sidebar for Super Admin only — other roles still see this section */
  hideForSuperAdmin?: boolean;
  items: NavItemConfig[];
};

/**
 * RMS-focused navigation — Records Management modules only.
 * Inventory, Operations, Services, and Devices are hidden for Super Admin only.
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
    items: [
      { href: '/companies', label: 'Company Master', permission: 'company:manage' },
      { href: '/branches', label: 'Branch Master', permission: 'branch:view' },
      { href: '/sites', label: 'Site Master', permission: 'site:view' },
      { href: '/warehouses', label: 'Warehouse Master', permission: 'warehouse:view' },
    ],
  },
  {
    category: 'Warehouse',
    isCollapsible: true,
    hideForSuperAdmin: true,
    items: [
      { href: '/rack-templates', label: 'Rack Template Master', permission: 'storage:view' },
      { href: '/rooms', label: 'Rooms Master', permission: 'storage:view' },
      { href: '/rows', label: 'Shelf / Row Master', permission: 'storage:view' },
      { href: '/racks', label: 'Racks Master', permission: 'storage:view' },
      { href: '/levels', label: 'Levels Master', permission: 'storage:view' },
      { href: '/locations', label: 'Location Master', permission: 'storage:view' },
    ],
  },
  {
    category: 'Inventory',
    isCollapsible: true,
    hideForSuperAdmin: true,
    items: [
      { href: '/box-types', label: 'Box Types', permission: 'box:view' },
      { href: '/file-types', label: 'File Types', permission: 'file:view' },
      { href: '/status-master', label: 'Status Master', permission: 'settings:view' },
      { href: '/barcodes/master', label: 'Barcode Master', permission: 'box:manage' },
      { href: '/boxes', label: 'Box Master', permission: 'box:view' },
      { href: '/file-records', label: 'File Master', permission: 'file:view' },
    ],
  },
  {
    category: 'Business Masters',
    isCollapsible: true,
    items: [
      { href: '/departments', label: 'Departments', permission: 'settings:view' },
      { href: '/clients', label: 'Clients Master', permission: 'client:view' },
      { href: '/vendors', label: 'Vendor Master', permission: 'settings:view' },
    ],
  },
  {
    category: 'Users & Access',
    isCollapsible: true,
    items: [
      { href: '/users', label: 'User Master', permission: 'user:view' },
      { href: '/roles', label: 'Role Master', permission: 'role:view' },
    ],
  },
  {
    category: 'Operations',
    isCollapsible: true,
    hideForSuperAdmin: true,
    items: [
      { href: '/workflows/fresh-box-move', label: 'Fresh Box Storage', permission: ['workflow:execute', 'box:manage'] },
      { href: '/workflows/segregation', label: 'Segregation', permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/refile', label: 'Refile', permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/transfer', label: 'Transfer', permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/merge', label: 'Merge / Split', permission: ['workflow:execute', 'report:view'] },
      {
        href: '/workflows/inventory-verification',
        label: 'Inventory Verification',
        permission: ['report:view', 'audit:view'],
      },
      { href: '/inventory-movements', label: 'Inventory Movement', permission: ['report:view', 'box:manage'] },
    ],
  },
  {
    category: 'Services',
    isCollapsible: true,
    hideForSuperAdmin: true,
    items: [{ href: '/work-orders', label: 'Work Orders', permission: ['workflow:execute', 'report:view'] }],
  },
  {
    category: 'Reports',
    isCollapsible: true,
    items: [
      { href: '/reports', label: 'Reports Dashboard', permission: 'report:view' },
      { href: '/audit-logs', label: 'Audit Logs', permission: 'audit:view' },
    ],
  },
  {
    category: 'Devices',
    isCollapsible: true,
    hideForSuperAdmin: true,
    items: [
      { href: '/devices', label: 'Scanner Devices', permission: 'device:view' },
      { href: '/sync', label: 'Sync History', permission: 'sync:manage' },
    ],
  },
  {
    category: 'System Settings',
    isCollapsible: true,
    items: [{ href: '/settings', label: 'Settings', permission: 'settings:view' }],
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
  return section.items.some((item) => isNavItemVisible(item, user));
}

export function isNavItemVisible(item: NavItemConfig, user: PermissionUser | null): boolean {
  return canAccessNavItem(item.permission, user);
}

export function getVisibleNavSections(user: PermissionUser | null): NavSectionConfig[] {
  return NAV_SECTIONS.filter((section) => isNavSectionVisible(section, user)).map((section) => ({
    ...section,
    items: section.items.filter((item) => isNavItemVisible(item, user)),
  })).filter((section) => section.items.length > 0);
}
