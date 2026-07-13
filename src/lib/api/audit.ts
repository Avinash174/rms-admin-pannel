import { AuditLog, AuditLogFilters, AuditLogListResponse } from '../types/audit';
import { fetchWithAuth } from './auth';

function mapRawAuditLogToAuditLog(log: any): AuditLog {
  if (!log) return log;

  // Determine entity name and entity ID based on which optional ID is present
  let entity = 'System';
  let entityId = '-';
  if (log.boxId) {
    entity = 'Box';
    entityId = log.boxId;
  } else if (log.fileRecordId) {
    entity = 'FileRecord';
    entityId = log.fileRecordId;
  } else if (log.warehouseId) {
    entity = 'Warehouse';
    entityId = log.warehouseId;
  } else if (log.branchId) {
    entity = 'Branch';
    entityId = log.branchId;
  } else if (log.locationId) {
    entity = 'Location';
    entityId = log.locationId;
  }

  // Parse outcome/status
  const status = log.outcome || 'SUCCESS';

  // Format changes from previousState and newState
  let changes = '';
  if (log.previousState || log.newState) {
    const prev = log.previousState ? JSON.stringify(log.previousState) : '';
    const next = log.newState ? JSON.stringify(log.newState) : '';
    changes = prev && next ? `${prev} → ${next}` : next || prev || '';
  }

  return {
    ...log,
    userName: log.user?.fullName || 'System',
    entity,
    entityId,
    status,
    changes,
    ipAddress: log.metadata?.ip || log.metadata?.ipAddress || '-',
    userAgent: log.metadata?.userAgent || 'System/Cron',
  };
}

export async function getAuditLogs(filters: AuditLogFilters, page: number = 1, pageSize: number = 20): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams();
  
  if (filters.userId) queryParams.append('userId', filters.userId);
  if (filters.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
  if (filters.boxId) queryParams.append('boxId', filters.boxId);
  if (filters.fileRecordId) queryParams.append('fileRecordId', filters.fileRecordId);
  
  // Only pass action to the backend if it is a valid specific backend WorkflowAction enum value,
  // not generic UI categories like CREATE, UPDATE, DELETE, or READ.
  const genericActions = ['CREATE', 'UPDATE', 'DELETE', 'READ'];
  if (filters.action && !genericActions.includes(filters.action)) {
    queryParams.append('action', filters.action);
  }
  
  if (filters.start) queryParams.append('start', filters.start);
  if (filters.end) queryParams.append('end', filters.end);
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());

  const response = await fetchWithAuth(`/audit-logs?${queryParams.toString()}`);
  if (response && Array.isArray(response.data)) {
    response.data = response.data.map(mapRawAuditLogToAuditLog);
  }
  return response;
}

export async function getAuditLogById(auditLogId: string): Promise<AuditLog> {
  const response = await fetchWithAuth(`/audit-logs/${auditLogId}`);
  if (response.success && response.data) {
    return mapRawAuditLogToAuditLog(response.data);
  }
  throw new Error('Failed to get audit log');
}
