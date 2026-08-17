import { fetchWithAuth } from './auth';

export interface DeviceSyncStatus {
  id: string;
  deviceId: string;
  deviceName: string;
  lastSyncAt?: string;
  status: 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'ERROR';
  pendingChanges: number;
  lastError?: string;
  appVersion?: string;
  batteryLevel?: number;
  createdAt: string;
}

export async function getSyncDeviceStatuses(page: number = 1, pageSize: number = 20): Promise<{
  data: DeviceSyncStatus[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await fetchWithAuth(`/sync/devices?page=${page}&pageSize=${pageSize}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch device sync statuses');
}
