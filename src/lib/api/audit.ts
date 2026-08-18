import { AuditLog, AuditLogFilters, AuditLogListResponse } from '../types/audit';
import { fetchWithAuthRoot } from './auth';

function mapAuditLog(log: any): AuditLog {
  const device = log.device
    ? {
        id: log.device.id,
        name: log.device.name || log.device.label || log.device.model || log.device.serialNumber || 'N/A',
        serialNumber: log.device.serialNumber ?? null,
        model: log.device.model ?? null,
        label: log.device.label ?? null
      }
    : null;

  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType || 'OTHER',
    entityId: log.entityId ?? null,
    previousState: log.previousState ?? null,
    newState: log.newState ?? null,
    user: log.user ?? null,
    device,
    createdAt: log.createdAt,
    userName: log.user?.fullName || 'System'
  };
}

export async function getAuditLogs(
  filters: AuditLogFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams();
  if (filters.userId) queryParams.append('userId', filters.userId);
  if (filters.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.entityType && filters.entityType !== 'OTHER') {
    queryParams.append('entityType', filters.entityType);
  }
  if (filters.entityId) queryParams.append('entityId', filters.entityId);
  if (filters.from) queryParams.append('from', filters.from);
  if (filters.to) queryParams.append('to', filters.to);
  queryParams.append('page', page.toString());
  queryParams.append('limit', pageSize.toString());

  const response = await fetchWithAuthRoot(`/audit?${queryParams.toString()}`);
  const rows = Array.isArray(response.data) ? response.data.map(mapAuditLog) : [];

  return {
    data: rows,
    meta: {
      page: response.meta?.page || page,
      limit: response.meta?.limit || pageSize,
      pageSize: response.meta?.limit || pageSize,
      total: response.meta?.total || rows.length,
      totalPages: response.meta?.totalPages || 1
    }
  };
}

export async function getAuditLogById(auditLogId: string): Promise<AuditLog> {
  const response = await fetchWithAuthRoot(`/audit/${auditLogId}`);
  if (response.success && response.data) {
    return mapAuditLog(response.data);
  }
  throw new Error('Failed to get audit log');
}
