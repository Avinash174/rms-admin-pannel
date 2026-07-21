import { Branch, BranchListResponse, CreateBranchRequest, UpdateBranchRequest } from '../types/branch';
import { fetchWithAuth } from './auth';

export async function getBranches(page: number = 1, pageSize: number = 20): Promise<BranchListResponse> {
  return fetchWithAuth(`/branches?page=${page}&pageSize=${pageSize}`);
}

export async function getBranch(id: string): Promise<Branch> {
  const response = await fetchWithAuth(`/branches/${id}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch branch');
}

export async function createBranch(data: CreateBranchRequest): Promise<Branch> {
  const response = await fetchWithAuth('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to create branch');
}

export async function updateBranch(id: string, data: UpdateBranchRequest): Promise<Branch> {
  const response = await fetchWithAuth(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to update branch');
}

export async function deleteBranch(id: string): Promise<void> {
  const response = await fetchWithAuth(`/branches/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('Failed to delete branch');
  }
}
