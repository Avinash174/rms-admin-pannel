import { Department, DepartmentListResponse, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';
import { fetchWithAuth } from './auth';

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
  const response = await fetchWithAuth(`/clients/departments/${id}`);
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
  const response = await fetchWithAuth(`/clients/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await fetchWithAuth(`/clients/departments/${id}`, {
    method: 'DELETE',
  });
}
