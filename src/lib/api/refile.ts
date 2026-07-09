import { RefileResult, SubmitRefileScanRequest } from '../types/refile';
import { fetchWithAuth } from './auth';

export async function submitRefileScan(data: SubmitRefileScanRequest): Promise<RefileResult> {
  const response = await fetchWithAuth('/workflows/refile/scans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to submit refile scan');
}

export async function listRefileScans(page: number = 1, pageSize: number = 20): Promise<any> {
  const response = await fetchWithAuth(`/workflows/refile/scans?page=${page}&pageSize=${pageSize}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to list refile scans');
}
