import { Location, LocationListResponse, CreateLocationRequest, UpdateLocationRequest } from '../types/location';
import { fetchWithAuth } from './auth';

// Backend route is flat (`/locations?shelfId=...`), optional shelfId returns all locations.
export async function getLocations(shelfId?: string, page: number = 1, pageSize: number = 20): Promise<LocationListResponse> {
  const url = shelfId ? `/locations?shelfId=${shelfId}` : '/locations';
  const response = await fetchWithAuth(url);
  const rows = Array.isArray(response.data) ? response.data : [];
  return {
    data: rows.map((row: any) => ({
      ...row,
      shelfName: row.shelf?.name || row.shelfName,
      isOccupied: row.isOccupied ?? false,
      capacity: 1
    })),
    meta: {
      page,
      pageSize,
      total: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize))
    }
  };
}

export async function getLocation(id: string): Promise<Location> {
  const response = await fetchWithAuth(`/locations/${id}`);
  return response.data;
}

export async function createLocation(shelfId: string, data: CreateLocationRequest): Promise<Location> {
  const response = await fetchWithAuth('/locations', {
    method: 'POST',
    body: JSON.stringify({ ...data, shelfId }),
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

export async function getAllLocations(): Promise<{ data: Location[] }> {
  return fetchWithAuth('/locations');
}
