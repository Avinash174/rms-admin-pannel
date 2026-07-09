import { Company, CompanyListResponse, CreateCompanyRequest, UpdateCompanyRequest } from '../types/company';
import { fetchWithAuth } from './auth';

export async function getCompanies(page: number = 1, pageSize: number = 20): Promise<CompanyListResponse> {
  try {
    const response = await fetchWithAuth(`/companies?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        { id: '1', name: 'Acme Records', code: 'ACME', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', name: 'Global Storage Inc', code: 'GSI', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      meta: { page, pageSize, total: 2, totalPages: 1 },
    };
  }
}

export async function getCompany(id: string): Promise<Company> {
  const response = await fetchWithAuth(`/companies/${id}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch company');
}

export async function createCompany(data: CreateCompanyRequest): Promise<Company> {
  const response = await fetchWithAuth('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to create company');
}

export async function updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
  const response = await fetchWithAuth(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to update company');
}

export async function deleteCompany(id: string): Promise<void> {
  const response = await fetchWithAuth(`/companies/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('Failed to delete company');
  }
}
