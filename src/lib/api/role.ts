import { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../types/role';
import { fetchWithAuth } from './auth';

export async function getRoles(): Promise<{ data: Role[] }> {
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
