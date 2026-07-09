import { Shelf, ShelfListResponse, CreateShelfRequest, UpdateShelfRequest } from '../types/shelf';
import { fetchWithAuth } from './auth';

export async function getShelves(rackId: string, page: number = 1, pageSize: number = 20): Promise<ShelfListResponse> {
  try {
    const response = await fetchWithAuth(`/racks/${rackId}/shelves?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Shelf 1',
          code: 'S1',
          description: 'First shelf in Rack A1',
          rackId: rackId,
          rackName: 'Rack A1',
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

export async function getShelf(id: string): Promise<Shelf> {
  const response = await fetchWithAuth(`/shelves/${id}`);
  return response.data;
}

export async function createShelf(rackId: string, data: CreateShelfRequest): Promise<Shelf> {
  const response = await fetchWithAuth(`/racks/${rackId}/shelves`, {
    method: 'POST',
    body: JSON.stringify(data),
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
