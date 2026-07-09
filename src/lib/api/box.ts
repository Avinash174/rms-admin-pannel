import { Box, BoxListResponse, CreateBoxRequest, UpdateBoxRequest } from '../types/box';
import { fetchWithAuth } from './auth';

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
          status: 'ACTIVE',
          description: 'Annual finance documents',
          currentLocationId: '1',
          locationName: 'LOC-001',
          clientId: '1',
          clientName: 'Acme Corporation',
          departmentId: '1',
          departmentName: 'Finance',
          companyId: '1',
          fileCount: 25,
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
