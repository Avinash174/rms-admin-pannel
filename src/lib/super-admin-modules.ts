import { canAccessNavItem, PermissionUser } from '@/lib/permissions';

export type SuperAdminModule = {
  label: string;
  description: string;
  href: string;
  permission?: string | string[];
};

/** Super Admin dashboard — visible RMS modules only (matches sidebar) */
export const SUPER_ADMIN_HUB_MODULES: SuperAdminModule[] = [
  { label: 'Organization', description: 'Companies, branches, sites, warehouses', href: '/companies', permission: 'company:manage' },
  { label: 'Business Masters', description: 'Clients, vendors, departments', href: '/clients', permission: 'client:view' },
  { label: 'Users & Roles', description: 'User accounts and role assignments', href: '/users', permission: 'user:view' },
  { label: 'Reports', description: 'Operational and inventory reports', href: '/reports', permission: 'report:view' },
  { label: 'Audit Logs', description: 'Records activity and audit trail', href: '/audit-logs', permission: 'audit:view' },
  { label: 'Settings', description: 'Company and profile settings', href: '/settings', permission: 'settings:view' },
];

export function getVisibleSuperAdminModules(user: PermissionUser | null): SuperAdminModule[] {
  if (!user) return [];
  return SUPER_ADMIN_HUB_MODULES.filter((module) => canAccessNavItem(module.permission, user));
}
