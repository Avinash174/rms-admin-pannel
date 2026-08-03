import { fetchWithAuthRoot } from './auth';
import {
  OperationsByDayEntry,
  RecentScanEvent,
  ReportsSummary
} from '../types/reports-summary';

export async function getReportsSummary(warehouseId?: string): Promise<ReportsSummary> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const response = await fetchWithAuthRoot(`/reports/summary${query}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch reports summary');
}

export async function getOperationsByDay(from: string, to: string): Promise<OperationsByDayEntry[]> {
  const params = new URLSearchParams({ from, to });
  const response = await fetchWithAuthRoot(`/reports/operations-by-day?${params.toString()}`);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to fetch operations by day');
}

export async function getRecentScans(limit: number = 10): Promise<RecentScanEvent[]> {
  const response = await fetchWithAuthRoot(`/audit?limit=${limit}`);
  if (!response.success || !Array.isArray(response.data)) {
    throw new Error('Failed to fetch recent scans');
  }

  return response.data.map((log: any) => {
    const state = (log.newState ?? {}) as Record<string, unknown>;
    const barcode =
      (state.barcode as string | undefined) ||
      (Array.isArray(state.boxBarcodes) ? state.boxBarcodes[0] : undefined) ||
      log.entityId ||
      '—';

    return {
      id: log.id,
      barcode,
      type: log.action,
      userName: log.user?.fullName || 'System',
      roleName: log.user?.roleName || 'Operator',
      scannedAt: log.createdAt
    };
  });
}
