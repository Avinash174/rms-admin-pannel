import { Shelf, ShelfListResponse, CreateShelfRequest, UpdateShelfRequest } from '../types/shelf';
import { fetchWithAuth } from './auth';

// Backend route is flat (`/shelves?rackId=...`), not nested under `/racks/:id/shelves`,
// and does not support pagination — it returns the full array with no `meta`.
export async function getShelves(rackId: string, page: number = 1, pageSize: number = 20): Promise<ShelfListResponse> {
  return fetchWithAuth(`/shelves?rackId=${rackId}`);
}

export async function getShelf(id: string): Promise<Shelf> {
  const response = await fetchWithAuth(`/shelves/${id}`);
  return response.data;
}

export async function createShelf(rackId: string, data: CreateShelfRequest): Promise<Shelf> {
  const response = await fetchWithAuth('/shelves', {
    method: 'POST',
    body: JSON.stringify({ ...data, rackId }),
  });
  return response.data;
}

export async function updateShelf(id: string, data: UpdateShelfRequest): Promise<Shelf> {
  const response = await fetchWithAuth(`/shelves/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteShelf(id: string): Promise<void> {
  await fetchWithAuth(`/shelves/${id}`, {
    method: 'DELETE',
  });
}
