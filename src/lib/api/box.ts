import { Box, BoxListResponse, CreateBoxRequest, UpdateBoxRequest } from '../types/box';
import { fetchWithAuth } from './auth';

function mapRawBoxToBox(box: any): Box {
  if (!box) return box;
  return {
    ...box,
    clientName: box.client?.name || box.clientName || undefined,
    departmentName: box.department?.name || box.departmentName || undefined,
    locationName: box.currentLocation?.barcode || box.currentLocation?.name || box.locationName || undefined,
    fileCount: box._count?.fileRecords ?? box.fileCount ?? 0,
  };
}

export async function getBoxes(page: number = 1, pageSize: number = 20): Promise<BoxListResponse> {
  const response = await fetchWithAuth(`/boxes?page=${page}&pageSize=${pageSize}`);
  if (response && Array.isArray(response.data)) {
    response.data = response.data.map(mapRawBoxToBox);
  }
  return response;
}

export async function getBox(id: string): Promise<Box> {
  const response = await fetchWithAuth(`/boxes/${id}`);
  return mapRawBoxToBox(response.data);
}

export async function createBox(data: CreateBoxRequest): Promise<Box> {
  const response = await fetchWithAuth('/boxes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapRawBoxToBox(response.data);
}

export async function updateBox(id: string, data: UpdateBoxRequest): Promise<Box> {
  const response = await fetchWithAuth(`/boxes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return mapRawBoxToBox(response.data);
}

export async function deleteBox(id: string): Promise<void> {
  await fetchWithAuth(`/boxes/${id}`, {
    method: 'DELETE',
  });
}

export async function getBoxByBarcode(barcode: string): Promise<Box> {
  const response = await fetchWithAuth(`/boxes/barcode/${barcode}`);
  return mapRawBoxToBox(response.data);
}
