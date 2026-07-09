import { User, UserListResponse, CreateUserRequest, UpdateUserRequest } from '../types/user';
import { fetchWithAuth } from './auth';

export async function getUsers(page: number = 1, pageSize: number = 20, filters?: Record<string, any>): Promise<UserListResponse> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
    });
    const response = await fetchWithAuth(`/users?${queryParams}`);
    if (response.success && Array.isArray(response.data)) {
      response.data = response.data.map((u: any) => {
        const parts = (u.fullName || '').trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        return {
          ...u,
          firstName,
          lastName,
          roleName: u.role?.label || u.role?.name || '',
        };
      });
    }
    return response;
  } catch (error) {
    // Return mock data for development
    return {
      data: [
        {
          id: '1',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1 234-567-8900',
          roleId: '1',
          roleName: 'Operator',
          warehouseId: '1',
          warehouseName: 'Main Warehouse',
          status: 'ACTIVE',
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1 234-567-8901',
          roleId: '2',
          roleName: 'Supervisor',
          warehouseId: '1',
          warehouseName: 'Main Warehouse',
          status: 'ACTIVE',
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page, pageSize, total: 2, totalPages: 1 },
    };
  }
}

export async function getUser(id: string): Promise<User> {
  const response = await fetchWithAuth(`/users/${id}`);
  if (response.success && response.data) {
    const u = response.data;
    const parts = (u.fullName || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return {
      ...u,
      firstName,
      lastName,
      roleName: u.role?.label || u.role?.name || '',
    };
  }
  throw new Error('Failed to fetch user');
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    const u = response.data;
    const parts = (u.fullName || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return {
      ...u,
      firstName,
      lastName,
      roleName: u.role?.label || u.role?.name || '',
    };
  }
  throw new Error('Failed to create user');
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<User> {
  const response = await fetchWithAuth(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    const u = response.data;
    const parts = (u.fullName || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return {
      ...u,
      firstName,
      lastName,
      roleName: u.role?.label || u.role?.name || '',
    };
  }
  throw new Error('Failed to update user');
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetchWithAuth(`/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('Failed to delete user');
  }
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  const response = await fetchWithAuth(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });
  if (!response.success) {
    throw new Error('Failed to reset password');
  }
}
