import { SegregationResult, MergeResult, Transfer, SegregateBoxRequest, MergeBoxesRequest, InitiateTransferRequest } from '../types/custodyMove';
import { fetchWithAuth } from './auth';

export async function segregateBox(data: SegregateBoxRequest): Promise<SegregationResult> {
  const response = await fetchWithAuth('/workflows/custody-move/segregate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to segregate box');
}

export async function mergeBoxes(data: MergeBoxesRequest): Promise<MergeResult> {
  const response = await fetchWithAuth('/workflows/custody-move/merge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to merge boxes');
}

export async function initiateTransfer(data: InitiateTransferRequest): Promise<Transfer> {
  const response = await fetchWithAuth('/workflows/custody-move/transfers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to initiate transfer');
}

export async function acceptTransfer(transferId: string): Promise<Transfer> {
  const response = await fetchWithAuth(`/workflows/custody-move/transfers/${transferId}/accept`, {
    method: 'POST',
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to accept transfer');
}

export async function listTransfers(page: number = 1, pageSize: number = 20): Promise<any> {
  const response = await fetchWithAuth(`/workflows/custody-move/transfers?page=${page}&pageSize=${pageSize}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to list transfers');
}
