import { ReportJob, GenerateReportRequest, JobStatus, ReportType } from '../types/report';
import { fetchWithAuth } from './auth';

function mapRawReportJobToReportJob(job: any): ReportJob {
  if (!job) return job;
  
  const id = job.jobId || job.id;
  
  // Map backend status to frontend expected states
  let status = 'READY';
  if (job.status === 'PENDING') status = 'GENERATING';
  if (job.status === 'FAILED') status = 'FAILED';
  if (job.status === 'COMPLETED' || job.status === 'READY') status = 'READY';

  const type = job.type as ReportType;
  
  // Generate friendly UI fallback name & description
  const createdAtFormatted = new Date(job.createdAt).toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const defaultNames = {
    BOX_INVENTORY: 'Box Inventory Report',
    USER_WORKLOAD: 'User Workload Audit',
    CUSTODY_HISTORY: 'Custody History Trail',
  };
  
  const defaultDescriptions = {
    BOX_INVENTORY: 'Active inventory count, warehouse location layout, and box tracking data.',
    USER_WORKLOAD: 'Workload distribution, scan history speed, and operator action counts.',
    CUSTODY_HISTORY: 'Chronological audit of box handovers, file access logs, and custody transfers.',
  };

  const name = job.name || defaultNames[type] || 'System Report';
  const description = job.description || defaultDescriptions[type] || `Generated on ${createdAtFormatted}`;

  return {
    ...job,
    id,
    type,
    status,
    name,
    description,
    generatedBy: job.generatedBy || 'System Operator',
    fileUrl: `/reports/jobs/${id}/download`,
    createdAt: job.createdAt,
    generatedAt: job.createdAt,
  };
}

export async function generateReport(data: GenerateReportRequest): Promise<ReportJob> {
  const response = await fetchWithAuth('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return mapRawReportJobToReportJob(response.data);
  }
  throw new Error('Failed to generate report');
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetchWithAuth(`/reports/jobs/${jobId}/status`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to get job status');
}

export async function downloadReport(jobId: string): Promise<Blob> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const response = await fetch(`${baseUrl}/reports/jobs/${jobId}/download`, {
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    }
  });
  if (response.ok) {
    return response.blob();
  }
  throw new Error('Failed to download report');
}

export async function listReports(): Promise<ReportJob[]> {
  const response = await fetchWithAuth('/reports');
  if (response.success && Array.isArray(response.data)) {
    return response.data.map(mapRawReportJobToReportJob);
  }
  throw new Error('Failed to list reports');
}

export async function updateReport(jobId: string, data: { name?: string; description?: string }): Promise<ReportJob> {
  const response = await fetchWithAuth(`/reports/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return mapRawReportJobToReportJob(response.data);
  }
  throw new Error('Failed to update report');
}

export async function deleteReport(jobId: string): Promise<boolean> {
  const response = await fetchWithAuth(`/reports/jobs/${jobId}`, {
    method: 'DELETE',
  });
  return response.success;
}
