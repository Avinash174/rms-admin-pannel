export type AuditEntityType =
  | 'BOX'
  | 'FILE_RECORD'
  | 'LOCATION'
  | 'WAREHOUSE'
  | 'BRANCH'
  | 'SITE'
  | 'ROOM'
  | 'RACK'
  | 'SHELF'
  | 'CLIENT'
  | 'DEPARTMENT'
  | 'USER'
  | 'DEVICE'
  | 'BARCODE'
  | 'WORK_ORDER'
  | 'SERVICE_REQUEST'
  | 'RACK_TEMPLATE'
  | 'TRANSFER'
  | 'SEGREGATION'
  | 'MERGE'
  | 'INVENTORY'
  | 'OTHER';

export interface AuditLogUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuditLogDevice {
  id: string;
  name?: string | null;
  serialNumber?: string | null;
  model?: string | null;
  label?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: AuditEntityType | string;
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
  entityType?: AuditEntityType | string;
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
