import { canAccessNavItem, PermissionUser } from '@/lib/permissions';

export type CompanyAdminModule = {
  label: string;
  description: string;
  href: string;
  permission?: string | string[];
};

/** Company Admin hub — matches visible sidebar modules */
export const COMPANY_ADMIN_HUB_MODULES: CompanyAdminModule[] = [
  {
    label: 'Manage Branches',
    description: 'Branches, sites, and regional structure',
    href: '/branches',
    permission: 'branch:view',
  },
  {
    label: 'Manage Warehouses',
    description: 'Warehouse master and assignments',
    href: '/warehouses',
    permission: 'warehouse:view',
  },
  {
    label: 'Manage Warehouse Structure',
    description: 'Rooms, racks, rows, levels, and locations',
    href: '/rooms',
    permission: 'storage:view',
  },
  {
    label: 'Manage Clients',
    description: 'Client accounts and departments',
    href: '/clients',
    permission: 'client:view',
  },
  {
    label: 'Manage Inventory',
    description: 'Boxes, files, barcodes, and box types',
    href: '/boxes',
    permission: 'box:view',
  },
  {
    label: 'Manage Operations',
    description: 'Work orders, transfers, refiles, and workflows',
    href: '/work-orders',
    permission: ['workflow:execute', 'report:view'],
  },
  {
    label: 'Manage Users',
    description: 'User accounts and access',
    href: '/users',
    permission: 'user:view',
  },
  {
    label: 'Manage Reports',
    description: 'Operational and inventory reports',
    href: '/reports',
    permission: 'report:view',
  },
  {
    label: 'Monitor Daily Activities',
    description: 'Audit logs and recent activity',
    href: '/audit-logs',
    permission: 'audit:view',
  },
];

export function getVisibleCompanyAdminModules(user: PermissionUser | null): CompanyAdminModule[] {
  if (!user) return [];
  return COMPANY_ADMIN_HUB_MODULES.filter((module) => canAccessNavItem(module.permission, user));
}
