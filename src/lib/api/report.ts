import { ReportJob, GenerateReportRequest, JobStatus } from '../types/report';
import { fetchWithAuth } from './auth';

export async function generateReport(data: GenerateReportRequest): Promise<ReportJob> {
  const response = await fetchWithAuth('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
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
  const response = await fetchWithAuth(`/reports/jobs/${jobId}/download`);
  if (response.ok) {
    return response.blob();
  }
  throw new Error('Failed to download report');
}

export async function listReports(): Promise<ReportJob[]> {
  const response = await fetchWithAuth('/reports');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to list reports');
}
