import { Location, LocationListResponse, CreateLocationRequest, UpdateLocationRequest } from '../types/location';
import { fetchWithAuth } from './auth';

// Backend route is flat (`/locations?shelfId=...`), not nested under `/shelves/:id/locations`,
// and does not support pagination — it returns the full array with no `meta`.
export async function getLocations(shelfId: string, page: number = 1, pageSize: number = 20): Promise<LocationListResponse> {
  return fetchWithAuth(`/locations?shelfId=${shelfId}`);
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
