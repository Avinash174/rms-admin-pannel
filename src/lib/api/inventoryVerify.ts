import { InventoryVerifySession, InventoryVerifyScan, VerifySessionDetails, StartVerifySessionRequest, SubmitVerifyScanRequest } from '../types/inventoryVerify';
import { fetchWithAuth } from './auth';

export async function startInventoryVerifySession(data: StartVerifySessionRequest): Promise<InventoryVerifySession> {
  const response = await fetchWithAuth('/workflows/inventory-verify/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to start inventory verification session');
}

export async function submitInventoryVerifyScan(sessionId: string, data: SubmitVerifyScanRequest): Promise<InventoryVerifyScan> {
  const response = await fetchWithAuth(`/workflows/inventory-verify/sessions/${sessionId}/scans`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to submit inventory verification scan');
}

export async function endInventoryVerifySession(sessionId: string): Promise<InventoryVerifySession> {
  const response = await fetchWithAuth(`/workflows/inventory-verify/sessions/${sessionId}/end`, {
    method: 'POST',
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to end inventory verification session');
}

export async function getInventoryVerifySessionDetails(sessionId: string): Promise<VerifySessionDetails> {
  const response = await fetchWithAuth(`/workflows/inventory-verify/sessions/${sessionId}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to get inventory verification session details');
}

export async function listInventoryVerifySessions(page: number = 1, pageSize: number = 20): Promise<any> {
  const response = await fetchWithAuth(`/workflows/inventory-verify/sessions?page=${page}&pageSize=${pageSize}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to list inventory verification sessions');
}
