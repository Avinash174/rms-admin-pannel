import { FileRecord, FileRecordListResponse, CreateFileRecordRequest, UpdateFileRecordRequest } from '../types/fileRecord';
import { fetchWithAuth } from './auth';

export async function getFileRecords(boxId?: string, page: number = 1, pageSize: number = 20): Promise<FileRecordListResponse> {
  const url = boxId
    ? `/boxes/${boxId}/file-records?page=${page}&pageSize=${pageSize}`
    : `/file-records?page=${page}&pageSize=${pageSize}`;
  return fetchWithAuth(url);
}

export async function getFileRecord(id: string): Promise<FileRecord> {
  const response = await fetchWithAuth(`/file-records/${id}`);
  return response.data;
}

export async function createFileRecord(data: CreateFileRecordRequest): Promise<FileRecord> {
  const response = await fetchWithAuth('/file-records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateFileRecord(id: string, data: UpdateFileRecordRequest): Promise<FileRecord> {
  const response = await fetchWithAuth(`/file-records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteFileRecord(id: string): Promise<void> {
  await fetchWithAuth(`/file-records/${id}`, {
    method: 'DELETE',
  });
}

export async function getFileRecordByBarcode(barcode: string): Promise<FileRecord> {
  const response = await fetchWithAuth(`/file-records/barcode/${barcode}`);
  return response.data;
}
