export interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: 'SCANNER' | 'TABLET' | 'PHONE' | 'OTHER';
  model?: string;
  serialNumber?: string;
  appVersion?: string;
  userId?: string;
  userName?: string;
  lastSyncedAt?: string;
  isActive: boolean;
  status?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDeviceRequest {
  isActive?: boolean;
  label?: string | null;
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
