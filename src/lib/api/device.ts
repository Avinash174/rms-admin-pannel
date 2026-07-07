import { Device, DeviceListResponse, CreateDeviceRequest, UpdateDeviceRequest } from '../types/device';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getDevices(page: number = 1, pageSize: number = 20): Promise<DeviceListResponse> {
  try {
    const response = await fetchWithAuth(`/devices?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          deviceId: 'DEV-001',
          name: 'Scanner Device 1',
          type: 'SCANNER',
          model: 'Honeywell CT60',
          serialNumber: 'SN-123456',
          osVersion: 'Android 13',
          appVersion: '1.0.0',
          userId: '1',
          userName: 'John Doe',
          lastSyncedAt: new Date().toISOString(),
          isActive: true,
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page, pageSize, total: 1, totalPages: 1 },
    };
  }
}

export async function getDevice(id: string): Promise<Device> {
  const response = await fetchWithAuth(`/devices/${id}`);
  return response.data;
}

export async function createDevice(data: CreateDeviceRequest): Promise<Device> {
  const response = await fetchWithAuth('/devices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateDevice(id: string, data: UpdateDeviceRequest): Promise<Device> {
  const response = await fetchWithAuth(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteDevice(id: string): Promise<void> {
  await fetchWithAuth(`/devices/${id}`, {
    method: 'DELETE',
  });
}

export async function deactivateDevice(id: string): Promise<void> {
  await fetchWithAuth(`/devices/${id}/deactivate`, {
    method: 'POST',
  });
}
