export interface DashboardMetrics {
  totalCompanies?: number;
  totalBranches?: number;
  totalSites?: number;
  totalWarehouses?: number;
  totalBoxes: number;
  totalFiles: number;
  scansToday: number;
  scansPeriod?: number;
  activeUsers?: number;
  totalRooms?: number;
  totalRacks?: number;
  totalLocations?: number;
  occupiedLocations?: number;
  availableLocations?: number;
  occupancyRate?: number;
  pendingOperations?: number;
  pendingWorkOrders?: number;
  todayFreshBoxMoves?: number;
  todayTransfers?: number;
  todayRefiles?: number;
  pendingSegregations?: number;
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
