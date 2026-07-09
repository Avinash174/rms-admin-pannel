import { FreshBoxMoveSession, FreshBoxMoveScan, SessionDetails, StartSessionRequest, SubmitScanRequest } from '../types/freshBoxMove';
import { fetchWithAuth } from './auth';

export async function startFreshBoxMoveSession(data: StartSessionRequest): Promise<FreshBoxMoveSession> {
  const response = await fetchWithAuth('/workflows/fresh-box-move/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to start fresh box move session');
}

export async function submitFreshBoxMoveScan(sessionId: string, data: SubmitScanRequest): Promise<FreshBoxMoveScan> {
  const response = await fetchWithAuth(`/workflows/fresh-box-move/sessions/${sessionId}/scans`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to submit fresh box move scan');
}

export async function endFreshBoxMoveSession(sessionId: string): Promise<FreshBoxMoveSession> {
  const response = await fetchWithAuth(`/workflows/fresh-box-move/sessions/${sessionId}/end`, {
    method: 'POST',
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to end fresh box move session');
}

export async function getFreshBoxMoveSessionDetails(sessionId: string): Promise<SessionDetails> {
  const response = await fetchWithAuth(`/workflows/fresh-box-move/sessions/${sessionId}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to get fresh box move session details');
}

export async function listFreshBoxMoveSessions(page: number = 1, pageSize: number = 20): Promise<any> {
  const response = await fetchWithAuth(`/workflows/fresh-box-move/sessions?page=${page}&pageSize=${pageSize}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to list fresh box move sessions');
}
