import { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../types/role';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getRoles(): Promise<{ data: Role[] }> {
  try {
    const response = await fetchWithAuth('/roles');
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
  return response.data;
}

export async function updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
  const response = await fetchWithAuth(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function getPermissions(): Promise<{ data: Permission[] }> {
  try {
    const response = await fetchWithAuth('/permissions');
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
  await fetchWithAuth(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });
}
