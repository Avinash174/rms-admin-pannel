import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListResponse
} from '../types/user';
import { fetchWithAuthRoot } from './auth';

function mapAccessUser(u: any): User {
  const parts = (u.fullName || '').trim().split(/\s+/);
  const warehouses = u.warehouses || [];
  return {
    id: u.id,
    email: u.email,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    fullName: u.fullName,
    username: u.username,
    phone: u.phone || undefined,
    roleId: u.role?.id,
    roleName: u.role?.label || u.role?.name || '',
    roleKey: u.role?.name,
    warehouseIds: warehouses.map((w: any) => w.id),
    warehouseId: warehouses[0]?.id,
    warehouseName:
      warehouses.length > 0
        ? warehouses.map((w: any) => w.code).join(', ')
        : undefined,
    warehousesCount: u.warehousesCount ?? warehouses.length,
    warehouses,
    status: u.status,
    isActive: u.isActive,
    companyId: u.companyId,
    employeeCode: u.username,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };
}

export async function getUsers(
  page: number = 1,
  limit: number = 20,
  filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    warehouseId?: string;
  }
): Promise<UserListResponse> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.role && { role: filters.role }),
    ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
    ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) })
  });

  const response = await fetchWithAuthRoot(`/users?${queryParams.toString()}`);
  const rows = Array.isArray(response.data) ? response.data.map(mapAccessUser) : [];
  return {
    data: rows,
    meta: {
      page: response.meta?.page || page,
      pageSize: response.meta?.limit || response.meta?.pageSize || limit,
      total: response.meta?.total || rows.length,
      totalPages: response.meta?.totalPages || 1
    }
  };
}

export async function getUser(id: string): Promise<User> {
  const response = await fetchWithAuthRoot(`/users/${id}`);
  if (response.success && response.data) {
    return mapAccessUser(response.data);
  }
  throw new Error('Failed to fetch user');
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const fullName =
    data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();

  const response = await fetchWithAuthRoot('/users', {
    method: 'POST',
    body: JSON.stringify({
      username: data.username,
      fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      phone: data.phone || undefined,
      warehouseIds: data.warehouseIds || []
    })
  });

  if (response.success && response.data) {
    return mapAccessUser(response.data);
  }
  throw new Error('Failed to create user');
}

export async function updateUser(id: string, data: UpdateUserRequest & { firstName?: string; lastName?: string }): Promise<User> {
  const payload: UpdateUserRequest = { ...data };
  if (data.firstName || data.lastName) {
    payload.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    delete (payload as any).firstName;
    delete (payload as any).lastName;
  }

  const response = await fetchWithAuthRoot(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  if (response.success && response.data) {
    return mapAccessUser(response.data);
  }
  throw new Error('Failed to update user');
}

export async function updateUserAssignments(id: string, warehouseIds: string[]): Promise<User> {
  const response = await fetchWithAuthRoot(`/users/${id}/assignments`, {
    method: 'PUT',
    body: JSON.stringify({ warehouseIds })
  });

  if (response.success && response.data) {
    return mapAccessUser(response.data);
  }
  throw new Error('Failed to update warehouse assignments');
}

export async function deactivateUser(id: string): Promise<User> {
  return updateUser(id, { isActive: false });
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  const response = await fetchWithAuthRoot(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
  if (!response.success) {
    throw new Error('Failed to reset password');
  }
}

export async function updateMe(data: {
  fullName?: string;
  email?: string;
  phone?: string | null;
  newPassword?: string;
}): Promise<User> {
  const response = await fetchWithAuthRoot('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

  if (response.success && response.data) {
    return mapAccessUser(response.data);
  }
  throw new Error('Failed to update profile');
}
