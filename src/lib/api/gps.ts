import { LastKnownLocation, GpsPing, LiveUserLocation } from '../types/gps';
import { fetchWithAuth } from './auth';

export async function getLastKnownLocation(userId: string): Promise<LastKnownLocation> {
  const response = await fetchWithAuth(`/gps/users/${userId}/current`);
  return response.data;
}

export async function getGpsHistory(userId: string): Promise<{ data: GpsPing[] }> {
  return fetchWithAuth(`/gps/users/${userId}/history`);
}

export async function getLiveWarehouseUsers(warehouseId: string): Promise<{ data: LiveUserLocation[] }> {
  return fetchWithAuth(`/gps/warehouses/${warehouseId}/live`);
}
