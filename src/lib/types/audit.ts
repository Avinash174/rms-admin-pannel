export interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  userName?: string;
  warehouseId?: string;
  boxId?: string;
  fileRecordId?: string;
  action: string;
  outcome: string;
  reasonCodeId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  // Computed fields for UI
  entity?: string;
  entityId?: string;
  entityType?: string;
  status?: string;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  userId?: string;
  warehouseId?: string;
  boxId?: string;
  fileRecordId?: string;
  action?: string;
  start?: string;
  end?: string;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
