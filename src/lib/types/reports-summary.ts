export type OperationTypeKey =
  | 'INTAKE'
  | 'FRESH_BOX'
  | 'INVENTORY'
  | 'REFILE'
  | 'SEGREGATION'
  | 'LOOKUP';

export interface ReportsSummary {
  todayOperationsByType: Record<OperationTypeKey, number>;
  missingFilesCount: number;
  activeDevicesCount: number;
  rejectedRefilesCount: number;
}

export interface OperationsByDayEntry {
  date: string;
  counts: Record<OperationTypeKey, number>;
}

export interface RecentScanEvent {
  id: string;
  barcode: string;
  type: string;
  userName: string;
  roleName: string;
  scannedAt: string;
}
