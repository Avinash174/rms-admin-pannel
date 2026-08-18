import { DashboardData, DashboardMetrics, ScanActivityData, RecentActivity } from '../types/dashboard';
import { fetchWithAuth } from './auth';

export interface DashboardFilterParams {
  companyId?: string;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
  days?: number;
  limit?: number;
  status?: string;
  operationType?: string;
}

function buildFilterQuery(filters?: DashboardFilterParams): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.companyId && filters.companyId !== 'ALL') params.set('companyId', filters.companyId);
  if (filters.warehouseId && filters.warehouseId !== 'ALL') params.set('warehouseId', filters.warehouseId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  if (filters.days) params.set('days', String(filters.days));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.operationType && filters.operationType !== 'ALL') params.set('operationType', filters.operationType);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export interface SuperAdminSummary {
  totalCompanies: number;
  totalBranches: number;
  totalSites: number;
  totalWarehouses: number;
  totalUsers: number;
  totalClients: number;
  totalVendors: number;
  totalBoxes: number;
  totalFiles: number;
  scansToday: number;
}

export async function getSuperAdminSummary(filters?: DashboardFilterParams): Promise<SuperAdminSummary> {
  const query = buildFilterQuery(filters);
  const response = await fetchWithAuth(`/dashboard/super-admin-summary${query}`);
  if (response.success && response.data) {
    return response.data as SuperAdminSummary;
  }
  throw new Error('Failed to fetch super admin summary');
}

export async function getDashboardMetrics(filters?: DashboardFilterParams): Promise<DashboardMetrics> {
  const query = buildFilterQuery(filters);
  const response = await fetchWithAuth(`/dashboard/metrics${query}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch dashboard metrics');
}

export async function getScanActivity(filters?: DashboardFilterParams): Promise<ScanActivityData[]> {
  const query = buildFilterQuery(filters);
  const response = await fetchWithAuth(`/dashboard/scan-activity${query}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch scan activity');
}

export async function getRecentActivity(filters?: DashboardFilterParams): Promise<RecentActivity[]> {
  const query = buildFilterQuery(filters);
  const response = await fetchWithAuth(`/dashboard/recent-activity${query}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch recent activity');
}

export async function getDashboardData(filters?: DashboardFilterParams): Promise<DashboardData> {
  const query = buildFilterQuery({ days: 7, limit: 5, ...filters });
  const response = await fetchWithAuth(`/dashboard${query}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch dashboard data');
}
