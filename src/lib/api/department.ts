import { Department, DepartmentListResponse, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';
import { fetchWithAuth } from './auth';

export async function getDepartments(clientId: string, page: number = 1, pageSize: number = 20): Promise<DepartmentListResponse> {
  return fetchWithAuth(`/clients/${clientId}/departments?page=${page}&pageSize=${pageSize}`);
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
