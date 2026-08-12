import { OperationTypeKey } from './reports-summary';

export type ReportExportType =
  | 'OPERATIONS_BY_DAY'
  | 'PRODUCTIVITY'
  | 'OCCUPANCY'
  | 'MISSING_FILES'
  | 'CLIENT_HOLDINGS';

export interface ReportFilters {
  from?: string;
  to?: string;
  warehouseId?: string;
  clientId?: string;
}

export interface ProductivityRow {
  userId: string;
  fullName: string;
  date: string;
  scanCount: number;
}

export interface OccupancyRow {
  locationBarcode: string;
  capacity: number;
  occupied: number;
  warehouseCode: string;
}

export interface MissingFileRow {
  fileId: string;
  fileBarcode: string;
  boxBarcode: string;
  lastSeenLocationBarcode: string | null;
  lastSeenLocationName: string | null;
  flaggedAt: string;
}

export interface ClientHoldingRow {
  clientCode: string;
  clientName: string;
  boxCount: number;
  fileCount: number;
}

export interface ReportExportJob {
  jobId: string;
  reportType: ReportExportType;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
  downloadUrl?: string;
}

export const REPORT_TYPE_LABELS: Record<ReportExportType, string> = {
  OPERATIONS_BY_DAY: 'Operations by Day',
  PRODUCTIVITY: 'Operator Productivity',
  OCCUPANCY: 'Location Occupancy',
  MISSING_FILES: 'Missing Files',
  CLIENT_HOLDINGS: 'Client Holdings'
};

export const REPORT_CHART_TYPES: OperationTypeKey[] = [
  'INTAKE',
  'FRESH_BOX',
  'INVENTORY',
  'REFILE',
  'SEGREGATION'
];

export const REPORT_TYPE_COLORS: Record<OperationTypeKey, string> = {
  INTAKE: 'bg-emerald-500',
  FRESH_BOX: 'bg-violet-500',
  INVENTORY: 'bg-amber-500',
  REFILE: 'bg-orange-400',
  SEGREGATION: 'bg-slate-400',
  LOOKUP: 'bg-slate-300'
};
