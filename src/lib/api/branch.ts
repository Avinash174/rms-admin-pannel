import { Branch, BranchListResponse, CreateBranchRequest, UpdateBranchRequest } from '../types/branch';

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

export async function getBranches(page: number = 1, pageSize: number = 20): Promise<BranchListResponse> {
  try {
    const response = await fetchWithAuth(`/branches?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Main Branch',
          code: 'MB',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
          phone: '+1 234-567-8900',
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

export async function getBranch(id: string): Promise<Branch> {
  const response = await fetchWithAuth(`/branches/${id}`);
  return response.data;
}

export async function createBranch(data: CreateBranchRequest): Promise<Branch> {
  const response = await fetchWithAuth('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateBranch(id: string, data: UpdateBranchRequest): Promise<Branch> {
  const response = await fetchWithAuth(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteBranch(id: string): Promise<void> {
  await fetchWithAuth(`/branches/${id}`, {
    method: 'DELETE',
  });
}
