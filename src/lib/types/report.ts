export type ReportType = 'BOX_INVENTORY' | 'USER_WORKLOAD' | 'CUSTODY_HISTORY';

export interface ReportJob {
  id: string;
  companyId: string;
  type: ReportType;
  status: string;
  filePath?: string;
  createdAt: string;
  completedAt?: string;
  // UI fields
  name?: string;
  description?: string;
  generatedBy?: string;
  fileUrl?: string;
  generatedAt?: string; // Alias for createdAt for UI compatibility
}

export interface GenerateReportRequest {
  type: ReportType;
  name?: string;
  description?: string;
}

export interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  error?: string;
  completedAt?: string;
}
