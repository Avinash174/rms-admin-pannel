import { Department, DepartmentListResponse, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';

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

export async function getDepartments(clientId: string, page: number = 1, pageSize: number = 20): Promise<DepartmentListResponse> {
  try {
    const response = await fetchWithAuth(`/clients/${clientId}/departments?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Finance',
          code: 'FIN',
          description: 'Finance department',
          clientId: clientId,
          clientName: 'Acme Corporation',
          companyId: '1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page, pageSize, total: 1, totalPages: 1 },
    };
  }
}

export async function getDepartment(id: string): Promise<Department> {
  const response = await fetchWithAuth(`/departments/${id}`);
  return response.data;
}

export async function createDepartment(clientId: string, data: CreateDepartmentRequest): Promise<Department> {
  const response = await fetchWithAuth(`/clients/${clientId}/departments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<Department> {
  const response = await fetchWithAuth(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await fetchWithAuth(`/departments/${id}`, {
    method: 'DELETE',
  });
}
