import { User, UserListResponse, CreateUserRequest, UpdateUserRequest } from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1/admin';

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
  return response.data;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<User> {
  const response = await fetchWithAuth(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await fetchWithAuth(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await fetchWithAuth(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });
}
