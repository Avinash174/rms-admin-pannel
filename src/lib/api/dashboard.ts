import { DashboardData, DashboardMetrics, ScanActivityData, RecentActivity } from '../types/dashboard';
import { fetchWithAuth } from './auth';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetchWithAuth('/dashboard/metrics');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch dashboard metrics');
}

export async function getScanActivity(days: number = 7): Promise<ScanActivityData[]> {
  const response = await fetchWithAuth(`/dashboard/scan-activity?days=${days}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch scan activity');
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  const response = await fetchWithAuth(`/dashboard/recent-activity?limit=${limit}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch recent activity');
}

export async function getDashboardData(): Promise<DashboardData> {
  const response = await fetchWithAuth('/dashboard?days=7&limit=5');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch dashboard data');
}
