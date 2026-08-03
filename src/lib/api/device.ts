import { Device, DeviceListResponse, UpdateDeviceRequest } from '../types/device';
import { fetchWithAuthRoot } from './auth';

function mapDevice(d: any): Device {
  if (!d) return d;
  return {
    id: d.id,
    companyId: d.companyId,
    deviceId: d.serialNumber,
    serialNumber: d.serialNumber,
    name: d.label || d.model || d.serialNumber,
    type: 'SCANNER',
    model: d.model,
    appVersion: d.appVersion || undefined,
    userId: d.lastUser?.id,
    userName: d.lastUser?.fullName || 'Unassigned',
    lastSyncedAt: d.lastSeenAt || undefined,
    isActive: d.isActive,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}

export async function getDevices(
  page: number = 1,
  limit: number = 20,
  filters?: { search?: string; model?: string; isActive?: boolean }
): Promise<DeviceListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.model && { model: filters.model }),
    ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) })
  });

  const response = await fetchWithAuthRoot(`/devices?${params.toString()}`);
  const rows = Array.isArray(response.data) ? response.data.map(mapDevice) : [];

  return {
    data: rows,
    meta: {
      page: response.meta?.page || page,
      pageSize: response.meta?.limit || limit,
      total: response.meta?.total || rows.length,
      totalPages: response.meta?.totalPages || 1
    }
  };
}

export async function getDevice(id: string): Promise<Device> {
  const response = await fetchWithAuthRoot(`/devices/${id}`);
  return mapDevice(response.data);
}

export async function updateDevice(id: string, data: UpdateDeviceRequest): Promise<Device> {
  const response = await fetchWithAuthRoot(`/devices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      isActive: data.isActive,
      label: data.label
    })
  });
  return mapDevice(response.data);
}
