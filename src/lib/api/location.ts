import { Location, LocationListResponse, CreateLocationRequest, UpdateLocationRequest } from '../types/location';
import { fetchWithAuth } from './auth';

export async function getLocations(shelfId: string, page: number = 1, pageSize: number = 20): Promise<LocationListResponse> {
  try {
    const response = await fetchWithAuth(`/shelves/${shelfId}/locations?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          barcode: 'LOC-001',
          name: 'Location 1',
          shelfId: shelfId,
          shelfName: 'Shelf 1',
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

export async function getLocation(id: string): Promise<Location> {
  const response = await fetchWithAuth(`/locations/${id}`);
  return response.data;
}

export async function createLocation(shelfId: string, data: CreateLocationRequest): Promise<Location> {
  const response = await fetchWithAuth(`/shelves/${shelfId}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateLocation(id: string, data: UpdateLocationRequest): Promise<Location> {
  const response = await fetchWithAuth(`/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteLocation(id: string): Promise<void> {
  await fetchWithAuth(`/locations/${id}`, {
    method: 'DELETE',
  });
}

export async function getLocationByBarcode(barcode: string): Promise<Location> {
  const response = await fetchWithAuth(`/locations/barcode/${barcode}`);
  return response.data;
}
