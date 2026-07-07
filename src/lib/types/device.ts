export interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: 'SCANNER' | 'TABLET' | 'PHONE' | 'OTHER';
  model?: string;
  serialNumber?: string;
  osVersion?: string;
  appVersion?: string;
  userId?: string;
  userName?: string;
  lastSyncedAt?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceRequest {
  deviceId: string;
  name: string;
  type: 'SCANNER' | 'TABLET' | 'PHONE' | 'OTHER';
  model?: string;
  serialNumber?: string;
  userId?: string;
  isActive?: boolean;
}

export interface UpdateDeviceRequest {
  name?: string;
  type?: 'SCANNER' | 'TABLET' | 'PHONE' | 'OTHER';
  model?: string;
  serialNumber?: string;
  userId?: string;
  isActive?: boolean;
}

export interface DeviceListResponse {
  data: Device[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
