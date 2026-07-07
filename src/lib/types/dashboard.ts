export interface DashboardMetrics {
  totalWarehouses: number;
  totalBoxes: number;
  totalFiles: number;
  scansToday: number;
  activeUsers: number;
}

export interface ScanActivityData {
  date: string;
  scans: number;
}

export interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  location?: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export interface DashboardData {
  metrics: DashboardMetrics;
  scanActivity: ScanActivityData[];
  recentActivity: RecentActivity[];
}
