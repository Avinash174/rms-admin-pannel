import { DashboardData, DashboardMetrics, ScanActivityData, RecentActivity } from '../types/dashboard';
import { fetchWithAuth } from './auth';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    console.log('[Dashboard API] Fetching metrics');
    const response = await fetchWithAuth('/dashboard/metrics');
    
    if (response.success && response.data) {
      console.log('[Dashboard API] Metrics fetched:', response.data);
      return response.data;
    }
    
    throw new Error('Failed to fetch dashboard metrics');
  } catch (error) {
    // Return mock data for development when API is unavailable
    return {
      totalWarehouses: 12,
      totalBoxes: 45821,
      totalFiles: 142394,
      scansToday: 1204,
      activeUsers: 24,
    };
  }
}

export async function getScanActivity(days: number = 7): Promise<ScanActivityData[]> {
  try {
    console.log(`[Dashboard API] Fetching scan activity for ${days} days`);
    const response = await fetchWithAuth(`/dashboard/scan-activity?days=${days}`);
    
    if (response.success && response.data) {
      console.log('[Dashboard API] Scan activity fetched:', response.data);
      return response.data;
    }
    
    throw new Error('Failed to fetch scan activity');
  } catch (error) {
    // Return mock data for development when API is unavailable
    const data: ScanActivityData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        scans: Math.floor(Math.random() * 500) + 100,
      });
    }
    
    return data;
  }
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  try {
    console.log(`[Dashboard API] Fetching recent activity with limit ${limit}`);
    const response = await fetchWithAuth(`/dashboard/recent-activity?limit=${limit}`);
    
    if (response.success && response.data) {
      console.log('[Dashboard API] Recent activity fetched:', response.data);
      return response.data;
    }
    
    throw new Error('Failed to fetch recent activity');
  } catch (error) {
    // Return mock data for development when API is unavailable
    return [
      {
        id: 'ACT-001',
        userId: 'user-1',
        userName: 'John Doe',
        action: 'FRESH_BOX_MOVE',
        location: 'Warehouse A - Rack 4',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: 'ACT-002',
        userId: 'user-2',
        userName: 'Sarah Smith',
        action: 'INVENTORY_VERIFY',
        location: 'Branch 2 - HR Dept',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: 'ACT-003',
        userId: 'user-3',
        userName: 'Mike Johnson',
        action: 'TRANSFER_INITIATE',
        location: 'Warehouse B to A',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
    ];
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    console.log('[Dashboard API] Fetching complete dashboard data');
    const response = await fetchWithAuth('/dashboard?days=7&limit=5');
    
    if (response.success && response.data) {
      console.log('[Dashboard API] Complete dashboard data fetched:', response.data);
      return response.data;
    }
    
    throw new Error('Failed to fetch dashboard data');
  } catch (error) {
    // Fallback to individual endpoints
    const [metrics, scanActivity, recentActivity] = await Promise.all([
      getDashboardMetrics(),
      getScanActivity(7),
      getRecentActivity(5),
    ]);

    return {
      metrics,
      scanActivity,
      recentActivity,
    };
  }
}
