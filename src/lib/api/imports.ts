import { fetchWithAuthRoot } from './auth';

export interface RecordsImportRow {
  clientCode?: string;
  clientName?: string;
  locationBarcode?: string;
  boxBarcode: string;
  fileBarcode?: string;
}

export interface RecordsImportResult {
  boxesCreated: number;
  filesCreated: number;
  clientsCreated: number;
}

export interface SegregationPlanRow {
  oldBoxBarcode: string;
  fileBarcode: string;
}

export interface SegregationPlanItem {
  id: string;
  oldBoxBarcode: string;
  fileBarcode: string;
  isDone: boolean;
  createdAt: string;
}

export async function importRecords(rows: RecordsImportRow[]): Promise<RecordsImportResult> {
  const response = await fetchWithAuthRoot('/imports/records', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
  return response.data;
}

export async function importSegregationPlan(
  rows: SegregationPlanRow[]
): Promise<{ planned: number }> {
  const response = await fetchWithAuthRoot('/imports/segregation-plan', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
  return response.data;
}

export async function listSegregationPlanItems(): Promise<SegregationPlanItem[]> {
  const response = await fetchWithAuthRoot('/imports/segregation-plan');
  return response.data || [];
}
