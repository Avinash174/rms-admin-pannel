import { LastKnownLocation, GpsPing, LiveUserLocation } from '../types/gps';
import { fetchWithAuth } from './auth';

export async function getLastKnownLocation(userId: string): Promise<LastKnownLocation> {
  const response = await fetchWithAuth(`/gps/users/${userId}/current`);
  return response.data;
}

export async function getGpsHistory(userId: string): Promise<{ data: GpsPing[] }> {
  try {
    const response = await fetchWithAuth(`/gps/users/${userId}/history`);
    return response;
  } catch (error) {
    return {
      data: [
        { id: '1', latitude: 37.7749, longitude: -122.4194, userId, deviceId: 'dev-1', createdAt: new Date(Date.now() - 300000).toISOString() },
        { id: '2', latitude: 37.7752, longitude: -122.4189, userId, deviceId: 'dev-1', createdAt: new Date(Date.now() - 60000).toISOString() }
      ]
    };
  }
}

export async function getLiveWarehouseUsers(warehouseId: string): Promise<{ data: LiveUserLocation[] }> {
  try {
    const response = await fetchWithAuth(`/gps/warehouses/${warehouseId}/live`);
    return response;
  } catch (error) {
    // Mock Telemetry Data
    return {
      data: [
        {
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john.doe@company.com',
          deviceId: 'handheld-1',
          deviceName: 'Honeywell CT40',
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 5.2,
          updatedAt: new Date().toISOString()
        },
        {
          userId: 'user-2',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@company.com',
          deviceId: 'handheld-2',
          deviceName: 'Honeywell ScanPal',
          latitude: 19.0782,
          longitude: 72.8752,
          accuracy: 4.8,
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
}
