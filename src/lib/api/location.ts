import { Location, LocationListResponse, CreateLocationRequest, UpdateLocationRequest, LocationImportRow, LocationImportResult } from '../types/location';
import { fetchWithAuth } from './auth';

export async function getLocations(
  shelfId?: string,
  warehouseId?: string,
  search?: string,
  status?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<LocationListResponse> {
  const queryParams = new URLSearchParams();
  if (shelfId) queryParams.append('shelfId', shelfId);
  if (warehouseId) queryParams.append('warehouseId', warehouseId);
  if (search) queryParams.append('search', search);
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', pageSize.toString());

  const url = `/locations?${queryParams.toString()}`;
  const response = await fetchWithAuth(url);
  const rows = Array.isArray(response.data) ? response.data : [];
  const meta = response.meta || {
    page,
    pageSize,
    total: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / pageSize))
  };

  return {
    data: rows.map((row: any) => ({
      ...row,
      shelfName: row.shelf?.name || row.shelfName,
      warehouseName: row.warehouse?.name || row.shelf?.rack?.room?.warehouse?.name || row.warehouseName,
      isOccupied: row.isOccupied ?? false,
      capacity: 1
    })),
    meta
  };
}

export async function getLocation(id: string): Promise<Location> {
  const response = await fetchWithAuth(`/locations/${id}`);
  return response.data;
}

export async function createLocation(shelfId: string | undefined, data: CreateLocationRequest): Promise<Location> {
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

export async function importWarehouseLocations(warehouseId: string, rows: LocationImportRow[]): Promise<LocationImportResult> {
  const response = await fetchWithAuth(`/locations/warehouses/${warehouseId}/import-locations`, {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
  return response.data;
}

export async function getLocationByBarcode(barcode: string): Promise<Location> {
  const response = await fetchWithAuth(`/locations/barcode/${barcode}`);
  return response.data;
}

export async function getAllLocations(): Promise<{ data: Location[] }> {
  return fetchWithAuth('/locations');
}

export interface BulkGenerateLocationsRequest {
  shelfId: string;
  levelId?: string;
  prefix?: string;
  startingNumber?: number;
  quantity: number;
  padding?: number;
  barcodePrefix?: string;
}

export async function bulkGenerateLocations(data: BulkGenerateLocationsRequest): Promise<any> {
  const response = await fetchWithAuth('/locations/bulk-generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function bulkActionLocations(ids: string[], action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE'): Promise<any> {
  return fetchWithAuth('/locations/bulk-action', {
    method: 'POST',
    body: JSON.stringify({ ids, action }),
  });
}

export async function bulkImportLocations(shelfId: string, rows: { name: string; barcode?: string; levelId?: string }[]): Promise<any> {
  const response = await fetchWithAuth('/locations/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ shelfId, rows }),
  });
  return response.data;
}
