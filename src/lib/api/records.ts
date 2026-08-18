import { fetchWithAuth, fetchWithAuthRoot } from './auth';

export interface RecordTimelineEntry {
  id: string;
  action: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  user?: { id: string; fullName: string; email: string } | null;
  device?: { id: string; serialNumber: string; model: string } | null;
  createdAt: string;
}

export interface RecordBox {
  id: string;
  barcode: string;
  label?: string;
  status: string;
  fileCapacity?: number;
  fileCount?: number;
  client?: { id: string; code: string; name: string };
  location?: { id: string; barcode: string; name: string };
  files?: Array<{
    id: string;
    barcode: string;
    label?: string;
    status: string;
    updatedAt: string;
  }>;
  updatedAt: string;
}

export interface RecordFile {
  id: string;
  barcode: string;
  label?: string;
  status: string;
  homeBoxId?: string;
  box?: { id: string; barcode: string; label?: string; status: string };
  client?: { id: string; code: string; name: string };
  location?: {
    id: string;
    barcode: string;
    name: string;
    breadcrumb?: string[];
  } | null;
  updatedAt: string;
}

function normalizeMeta(meta: any, page: number, limit: number) {
  return {
    page: meta?.page || page,
    pageSize: meta?.limit || meta?.pageSize || limit,
    total: meta?.total || 0,
    totalPages: meta?.totalPages || 1,
  };
}

export async function listRecordBoxes(
  page = 1,
  limit = 20,
  filters?: {
    search?: string;
    status?: string;
    clientId?: string;
    warehouseId?: string;
  }
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.clientId && { clientId: filters.clientId }),
    ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
  });

  const response = await fetchWithAuthRoot(`/records/boxes?${params}`);
  return {
    data: (response.data || []) as RecordBox[],
    meta: normalizeMeta(response.meta, page, limit),
  };
}

export async function getRecordBox(id: string): Promise<RecordBox> {
  const response = await fetchWithAuthRoot(`/records/boxes/${id}`);
  return response.data;
}

export async function updateRecordBox(id: string, data: { label?: string }) {
  const response = await fetchWithAuthRoot(`/records/boxes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data as RecordBox;
}

export async function deleteRecordBox(id: string): Promise<void> {
  const boxRes = await fetchWithAuthRoot(`/boxes/${id}`, {
    method: 'DELETE',
  });
  if (boxRes.success) return;

  // Fallback to barcode endpoint if it was a standalone barcode ID
  const barcodeRes = await fetchWithAuth(`/barcode/${id}`, {
    method: 'DELETE',
  });
  if (!barcodeRes.success) {
    throw new Error(barcodeRes.message || boxRes.message || 'Failed to delete box');
  }
}

export async function getRecordBoxTimeline(id: string): Promise<RecordTimelineEntry[]> {
  const response = await fetchWithAuthRoot(`/records/boxes/${id}/timeline`);
  return response.data || [];
}

export async function listRecordFiles(
  page = 1,
  limit = 20,
  filters?: {
    search?: string;
    status?: string;
    clientId?: string;
    boxId?: string;
  }
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.clientId && { clientId: filters.clientId }),
    ...(filters?.boxId && { boxId: filters.boxId }),
  });

  const response = await fetchWithAuthRoot(`/records/files?${params}`);
  return {
    data: (response.data || []) as RecordFile[],
    meta: normalizeMeta(response.meta, page, limit),
  };
}

export async function getRecordFile(id: string): Promise<RecordFile> {
  const response = await fetchWithAuthRoot(`/records/files/${id}`);
  return response.data;
}

export async function updateRecordFile(
  id: string,
  data: { label?: string; homeBoxId?: string }
) {
  const response = await fetchWithAuthRoot(`/records/files/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data as RecordFile;
}

export async function getRecordFileTimeline(id: string): Promise<RecordTimelineEntry[]> {
  const response = await fetchWithAuthRoot(`/records/files/${id}/timeline`);
  return response.data || [];
}

export async function getNextFileBarcode(): Promise<string> {
  const response = await fetchWithAuth('/barcode/next-file');
  return response.data?.barcode || response.data?.fileCode || response.data;
}

export async function createRecordFile(data: { boxId: string; barcode?: string; title?: string; status?: 'ACTIVE' | 'ARCHIVED' | 'DESTROYED' }) {
  const response = await fetchWithAuth('/file-records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteRecordFile(id: string): Promise<void> {
  await fetchWithAuth(`/file-records/${id}`, {
    method: 'DELETE',
  });
}

export interface BulkGenerateFilesRequest {
  boxId: string;
  prefix?: string;
  startingNumber?: number;
  quantity: number;
  padding?: number;
  titlePrefix?: string;
}

export async function bulkGenerateRecordFiles(data: BulkGenerateFilesRequest): Promise<any> {
  const response = await fetchWithAuth('/file-records/bulk-generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function bulkActionRecordFiles(ids: string[], action: 'ACTIVATE' | 'ARCHIVE' | 'DELETE'): Promise<any> {
  return fetchWithAuth('/file-records/bulk-action', {
    method: 'POST',
    body: JSON.stringify({ ids, action }),
  });
}

export async function bulkImportRecordFiles(boxId: string, rows: { barcode: string; label?: string; boxBarcode?: string }[]): Promise<any> {
  const response = await fetchWithAuth('/file-records/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ boxId, rows }),
  });
  return response.data;
}

export interface BarcodeLookupResult {
  entityType: 'LOCATION' | 'BOX' | 'FILE';
  entity: Record<string, unknown>;
  contents: Array<Record<string, unknown>>;
  path: Array<{ type: string; name: string }>;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const response = await fetchWithAuthRoot(
    `/mobile/scan/lookup?barcode=${encodeURIComponent(barcode)}`
  );
  return response.data;
}
