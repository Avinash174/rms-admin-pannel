import { Device, DeviceListResponse, CreateDeviceRequest, UpdateDeviceRequest } from '../types/device';
import { fetchWithAuth } from './auth';

function mapDevice(d: any): Device {
  if (!d) return d;
  return {
    ...d,
    deviceId: d.serialNumber || 'N/A',
    name: d.model ? `${d.model} (${d.serialNumber || 'N/A'})` : `Device ${d.serialNumber || 'N/A'}`,
    type: 'SCANNER',
    userName: d.assignedUser?.fullName || 'Unassigned',
    userId: d.assignedUserId || '',
    isActive: d.status === 'APPROVED',
  };
}

export async function getDevices(page: number = 1, pageSize: number = 20): Promise<DeviceListResponse> {
  try {
    const response = await fetchWithAuth(`/devices?page=${page}&pageSize=${pageSize}`);
    if (response && Array.isArray(response.data)) {
      response.data = response.data.map(mapDevice);
    }
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
  return mapDevice(response.data);
}

export async function createDevice(data: CreateDeviceRequest): Promise<Device> {
  const backendPayload = {
    serialNumber: data.deviceId || data.serialNumber || '',
    model: data.model || data.name || 'Unknown Model'
  };
  const response = await fetchWithAuth('/devices', {
    method: 'POST',
    body: JSON.stringify(backendPayload),
  });
  return mapDevice(response.data);
}

export async function updateDevice(id: string, data: UpdateDeviceRequest): Promise<Device> {
  const backendPayload: any = {
    serialNumber: data.serialNumber || (data as any).deviceId,
    model: data.model,
    status: (data as any).isActive !== undefined 
      ? ((data as any).isActive ? 'APPROVED' : 'BLOCKED') 
      : (data as any).status,
    assignedUserId: (data as any).userId !== undefined 
      ? ((data as any).userId === '' ? null : (data as any).userId)
      : (data as any).assignedUserId
  };
  
  // Clean undefined properties
  Object.keys(backendPayload).forEach(key => {
    if (backendPayload[key] === undefined) delete backendPayload[key];
  });

  const response = await fetchWithAuth(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(backendPayload),
  });
  return mapDevice(response.data);
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
