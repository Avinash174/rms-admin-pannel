import { AuditLog, AuditLogFilters, AuditLogListResponse } from '../types/audit';
import { fetchWithAuth } from './auth';

export async function getAuditLogs(filters: AuditLogFilters, page: number = 1, pageSize: number = 20): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams();
  
  if (filters.userId) queryParams.append('userId', filters.userId);
  if (filters.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
  if (filters.boxId) queryParams.append('boxId', filters.boxId);
  if (filters.fileRecordId) queryParams.append('fileRecordId', filters.fileRecordId);
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.start) queryParams.append('start', filters.start);
  if (filters.end) queryParams.append('end', filters.end);
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());

  const response = await fetchWithAuth(`/audit-logs?${queryParams.toString()}`);
  return response;
}

export async function getAuditLogById(auditLogId: string): Promise<AuditLog> {
  const response = await fetchWithAuth(`/audit-logs/${auditLogId}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to get audit log');
}
