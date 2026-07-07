import { DashboardData, DashboardMetrics, ScanActivityData, RecentActivity } from '../types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // In a real implementation, this would aggregate data from multiple endpoints
    // For now, we'll fetch from individual endpoints
    const [warehousesRes, boxesRes] = await Promise.all([
      fetchWithAuth('/warehouses?page=1&pageSize=1'),
      fetchWithAuth('/boxes?page=1&pageSize=1'),
    ]);

    const warehouses = warehousesRes.data?.meta?.total || 0;
    const boxes = boxesRes.data?.meta?.total || 0;

    // Mock data for files and scans until proper endpoints are available
    return {
      totalWarehouses: warehouses,
      totalBoxes: boxes,
      totalFiles: Math.floor(boxes * 3.5), // Approximate
      scansToday: 0, // Would come from a scan statistics endpoint
      activeUsers: 0, // Would come from user activity endpoint
    };
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
  // This would call a dedicated scan statistics endpoint
  // For now, return mock data
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

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  try {
    const response = await fetchWithAuth(`/audit-logs?page=1&pageSize=${limit}`);
    
    if (response.success && response.data) {
      return response.data.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user?.fullName || 'Unknown User',
        action: log.action,
        location: log.locationId || undefined,
        timestamp: log.createdAt,
        status: 'success' as const,
      }));
    }
    
    return [];
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
