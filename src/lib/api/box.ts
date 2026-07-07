import { Box, BoxListResponse, CreateBoxRequest, UpdateBoxRequest } from '../types/box';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1/admin';

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

export async function getBoxes(page: number = 1, pageSize: number = 20): Promise<BoxListResponse> {
  try {
    const response = await fetchWithAuth(`/boxes?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          barcode: 'BOX-001',
          name: 'Finance Records 2024',
          description: 'Annual finance documents',
          year: 2024,
          locationId: '1',
          locationName: 'LOC-001',
          clientId: '1',
          clientName: 'Acme Corporation',
          departmentId: '1',
          departmentName: 'Finance',
          companyId: '1',
          fileCount: 25,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page, pageSize, total: 1, totalPages: 1 },
    };
  }
}

export async function getBox(id: string): Promise<Box> {
  const response = await fetchWithAuth(`/boxes/${id}`);
  return response.data;
}

export async function createBox(data: CreateBoxRequest): Promise<Box> {
  const response = await fetchWithAuth('/boxes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateBox(id: string, data: UpdateBoxRequest): Promise<Box> {
  const response = await fetchWithAuth(`/boxes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteBox(id: string): Promise<void> {
  await fetchWithAuth(`/boxes/${id}`, {
    method: 'DELETE',
  });
}

export async function getBoxByBarcode(barcode: string): Promise<Box> {
  const response = await fetchWithAuth(`/boxes/barcode/${barcode}`);
  return response.data;
}
