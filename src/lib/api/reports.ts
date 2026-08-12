import { fetchWithAuthRoot } from './auth';
import { OperationsByDayEntry } from '../types/reports-summary';
import {
  ClientHoldingRow,
  MissingFileRow,
  OccupancyRow,
  ProductivityRow,
  ReportExportJob,
  ReportExportType,
  ReportFilters
} from '../types/reports';

const API_ROOT_URL = process.env.NEXT_PUBLIC_API_ROOT_URL || 'http://localhost:3001/api/v1';

function buildQuery(filters: ReportFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.warehouseId) params.set('warehouseId', filters.warehouseId);
  if (filters.clientId) params.set('clientId', filters.clientId);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getOperationsByDayReport(
  filters: ReportFilters
): Promise<OperationsByDayEntry[]> {
  const response = await fetchWithAuthRoot(`/reports/operations-by-day${buildQuery(filters)}`);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to fetch operations by day report');
}

export async function getProductivityReport(filters: ReportFilters): Promise<ProductivityRow[]> {
  const response = await fetchWithAuthRoot(`/reports/productivity${buildQuery(filters)}`);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to fetch productivity report');
}

export async function getOccupancyReport(filters: ReportFilters): Promise<OccupancyRow[]> {
  const response = await fetchWithAuthRoot(`/reports/occupancy${buildQuery(filters)}`);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to fetch occupancy report');
}

export async function getMissingFilesReport(filters: ReportFilters): Promise<MissingFileRow[]> {
  const response = await fetchWithAuthRoot(`/reports/missing-files${buildQuery(filters)}`);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to fetch missing files report');
}

export async function getClientHoldingsReport(
  filters: ReportFilters
): Promise<ClientHoldingRow[]> {
  const response = await fetchWithAuthRoot(`/reports/client-holdings${buildQuery(filters)}`);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to fetch client holdings report');
}

export async function startReportExport(
  reportType: ReportExportType,
  filters: ReportFilters
): Promise<{ jobId: string }> {
  const response = await fetchWithAuthRoot('/reports/export', {
    method: 'POST',
    body: JSON.stringify({
      reportType,
      ...filters
    })
  });
  if (response.success && response.data?.jobId) {
    return response.data;
  }
  throw new Error('Failed to start report export');
}

export async function getReportExportStatus(jobId: string): Promise<ReportExportJob> {
  const response = await fetchWithAuthRoot(`/reports/export/${jobId}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch export status');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function downloadReportExport(
  reportType: ReportExportType,
  filters: ReportFilters
): Promise<void> {
  const { jobId } = await startReportExport(reportType, filters);

  let status: ReportExportJob['status'] = 'PENDING';
  let attempts = 0;
  while (status === 'PENDING' && attempts < 30) {
    await sleep(500);
    const job = await getReportExportStatus(jobId);
    status = job.status;
    if (status === 'FAILED') {
      throw new Error(job.error || 'Export failed');
    }
    attempts += 1;
  }

  if (status !== 'COMPLETED') {
    throw new Error('Export timed out');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const response = await fetch(`${API_ROOT_URL}/reports/export/${jobId}/download`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download export');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${reportType.toLowerCase()}-${jobId}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
