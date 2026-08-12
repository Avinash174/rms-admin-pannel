export type AuditEntityType = 'BOX' | 'FILE_RECORD' | 'LOCATION' | 'USER' | 'DEVICE' | 'OTHER';

export interface AuditLogUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuditLogDevice {
  id: string;
  serialNumber: string;
  model?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string | null;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  user?: AuditLogUser | null;
  device?: AuditLogDevice | null;
  createdAt: string;
  userName?: string;
}

export interface AuditLogFilters {
  userId?: string;
  warehouseId?: string;
  action?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  from?: string;
  to?: string;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit?: number;
    pageSize?: number;
    total: number;
    totalPages: number;
  };
}
