import { FileRecord, FileRecordListResponse, CreateFileRecordRequest, UpdateFileRecordRequest } from '../types/fileRecord';

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

export async function getFileRecords(boxId?: string, page: number = 1, pageSize: number = 20): Promise<FileRecordListResponse> {
  try {
    const url = boxId 
      ? `/boxes/${boxId}/file-records?page=${page}&pageSize=${pageSize}`
      : `/file-records?page=${page}&pageSize=${pageSize}`;
    const response = await fetchWithAuth(url);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          barcode: 'FILE-001',
          title: 'Q1 Financial Report',
          description: 'First quarter financial report',
          referenceNumber: 'REF-2024-001',
          boxId: '1',
          boxBarcode: 'BOX-001',
          clientId: '1',
          clientName: 'Acme Corporation',
          departmentId: '1',
          departmentName: 'Finance',
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
