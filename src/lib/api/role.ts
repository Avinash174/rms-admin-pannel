import { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../types/role';
import { fetchWithAuth } from './auth';

export async function getRoles(): Promise<{ data: Role[] }> {
  try {
    const response = await fetchWithAuth('/roles');
    if (response && Array.isArray(response.data)) {
      response.data = response.data.map((r: any) => {
        const flatPermissions = (r.permissions || []).map((rp: any) => {
          const p = rp.permission || {};
          return {
            id: p.id || rp.permissionId,
            name: p.key || '',
            description: p.description || '',
            category: (p.key || '').split(':')[0] || 'General',
          };
        });
        return {
          ...r,
          permissions: flatPermissions,
        };
      });
    }
    return response;
  } catch (error) {
    // Fallback Mock Data for local UI development
    return {
      data: [
        {
          id: '1',
          name: 'super_admin',
          label: 'Super Administrator',
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: [
            { id: '1', name: 'role:view', description: 'View roles' },
            { id: '2', name: 'role:manage', description: 'Manage roles' }
          ]
        },
        {
          id: '2',
          name: 'warehouse_operator',
          label: 'Warehouse Operator',
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: [
            { id: '1', name: 'role:view', description: 'View roles' }
          ]
        }
      ]
    };
  }
}

export async function createRole(data: CreateRoleRequest): Promise<Role> {
  const response = await fetchWithAuth('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to create role');
}

export async function updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
  const response = await fetchWithAuth(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to update role');
}

export async function deleteRole(id: string): Promise<void> {
  const response = await fetchWithAuth(`/roles/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('Failed to delete role');
  }
}

export async function getPermissions(): Promise<{ data: Permission[] }> {
  try {
    const response = await fetchWithAuth('/roles/permissions');
    if (response && Array.isArray(response.data)) {
      response.data = response.data.map((p: any) => ({
        id: p.id,
        name: p.key,
        description: p.description,
        category: (p.key || '').split(':')[0] || 'General',
      }));
    }
    return response;
  } catch (error) {
    return {
      data: [
        { id: '1', name: 'role:view', description: 'View Roles and Permissions list', category: 'RBAC' },
        { id: '2', name: 'role:manage', description: 'Create and edit roles', category: 'RBAC' },
        { id: '3', name: 'user:view', description: 'View user registry', category: 'Users' },
        { id: '4', name: 'user:manage', description: 'Create and edit users', category: 'Users' },
        { id: '5', name: 'company:view', description: 'View companies list', category: 'Tenant' },
        { id: '6', name: 'company:manage', description: 'Manage company tenant settings', category: 'Tenant' },
        { id: '7', name: 'gps:view', description: 'View operator live GPS traces', category: 'GPS' },
        { id: '8', name: 'settings:manage', description: 'Modify general reason codes and rules', category: 'Settings' },
      ]
    };
  }
}

export async function assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const response = await fetchWithAuth(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });
  if (!response.success) {
    throw new Error('Failed to assign permissions');
  }
}
