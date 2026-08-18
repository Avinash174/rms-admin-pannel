import { fetchWithAuth } from './auth';

export type BarcodeType = 'LOCATION' | 'BOX' | 'FILE_RECORD';
export type BarcodeStatus = 'ACTIVE' | 'INACTIVE' | 'ASSIGNED' | 'UNASSIGNED' | 'LOST' | 'DESTROYED';

export interface BarcodeMasterItem {
  id: string;
  barcode: string;
  type: BarcodeType;
  status: BarcodeStatus;
  companyId: string;
  siteId?: string | null;
  branchId?: string | null;
  warehouseId?: string | null;
  isAssigned: boolean;
  assignedToType?: string | null;
  assignedToId?: string | null;
  assignedAt?: string | null;
  createdById: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  site?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  warehouse?: { id: string; name: string; code: string } | null;
  createdBy?: { id: string; fullName: string; email: string } | null;
  history?: BarcodeHistoryItem[];
}

export interface BarcodeHistoryItem {
  id: string;
  barcodeMasterId: string;
  barcode: string;
  action: string;
  previousStatus?: BarcodeStatus;
  newStatus?: BarcodeStatus;
  userId?: string;
  ipAddress?: string;
  deviceInfo?: string;
  remarks?: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string };
}

export interface BarcodeStats {
  total: number;
  boxCount: number;
  fileCount: number;
  locationCount: number;
  assignedCount: number;
  unassignedCount: number;
  inactiveCount: number;
  todayGenerated: number;
}

export interface ListBarcodesParams {
  siteId?: string;
  branchId?: string;
  warehouseId?: string;
  type?: BarcodeType;
  status?: BarcodeStatus;
  isAssigned?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BulkGenerateRequest {
  siteId?: string;
  branchId?: string;
  warehouseId?: string;
  type: BarcodeType;
  prefix: string;
  startingNumber: number;
  quantity: number;
  remarks?: string;
}

export interface ImportBarcodeRow {
  barcode: string;
  type: BarcodeType;
  status?: BarcodeStatus;
  siteCode?: string;
  branchCode?: string;
  warehouseCode?: string;
  remarks?: string;
}

export async function getBarcodeStats(): Promise<BarcodeStats> {
  const response = await fetchWithAuth('/barcode/stats');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch barcode statistics');
}

export async function listBarcodes(params: ListBarcodesParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });

  const queryStr = searchParams.toString();
  const url = `/barcode${queryStr ? `?${queryStr}` : ''}`;
  const response = await fetchWithAuth(url);

  if (response.success) {
    return {
      data: response.data as BarcodeMasterItem[],
      pagination: response.pagination || { total: response.data.length, page: 1, limit: 20, totalPages: 1 }
    };
  }
  throw new Error(response.message || 'Failed to fetch barcodes');
}

export async function getBarcodeById(id: string): Promise<BarcodeMasterItem> {
  const response = await fetchWithAuth(`/barcode/${id}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch barcode details');
}

export async function getNextBoxBarcode(): Promise<string> {
  const response = await fetchWithAuth('/barcode/next-box');
  if (response.success && response.data?.barcode) {
    return response.data.barcode;
  }
  throw new Error(response.message || 'Failed to generate next box barcode');
}

export async function getNextFileBarcode(): Promise<string> {
  const response = await fetchWithAuth('/barcode/next-file');
  if (response.success && response.data?.barcode) {
    return response.data.barcode;
  }
  throw new Error(response.message || 'Failed to generate next file barcode');
}

export async function createBarcode(data: {
  siteId?: string;
  branchId?: string;
  warehouseId?: string;
  barcode?: string;
  type: BarcodeType;
  status?: BarcodeStatus;
  remarks?: string;
}): Promise<BarcodeMasterItem> {
  const response = await fetchWithAuth('/barcode', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to create barcode');
}

export async function updateBarcode(id: string, data: {
  status?: BarcodeStatus;
  siteId?: string | null;
  branchId?: string | null;
  warehouseId?: string | null;
  isAssigned?: boolean;
  assignedToType?: string | null;
  assignedToId?: string | null;
  remarks?: string | null;
}): Promise<BarcodeMasterItem> {
  const response = await fetchWithAuth(`/barcode/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to update barcode');
}

export async function deleteBarcode(id: string): Promise<void> {
  const response = await fetchWithAuth(`/barcode/${id}`, {
    method: 'DELETE'
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete barcode');
  }
}

export async function bulkGenerateBarcodes(data: BulkGenerateRequest) {
  const response = await fetchWithAuth('/barcode/generate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to bulk generate barcodes');
}

export async function importBarcodes(rows: Array<{
  barcode: string;
  type: BarcodeType;
  status?: BarcodeStatus;
  siteCode?: string;
  branchCode?: string;
  warehouseCode?: string;
  remarks?: string;
}>) {
  const response = await fetchWithAuth('/barcode/import', {
    method: 'POST',
    body: JSON.stringify({ rows })
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to import barcodes');
}

export async function bulkActionBarcodes(ids: string[], action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE') {
  const response = await fetchWithAuth('/barcode/bulk-action', {
    method: 'POST',
    body: JSON.stringify({ ids, action })
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to execute bulk action');
}

export async function bulkAssignBarcodes(ids: string[], data: {
  warehouseId?: string | null;
  siteId?: string | null;
  branchId?: string | null;
}) {
  const response = await fetchWithAuth('/barcode/bulk-assign', {
    method: 'POST',
    body: JSON.stringify({ ids, ...data })
  });
  if (response.success) {
    return response;
  }
  throw new Error(response.message || 'Failed to bulk assign barcodes');
}


export async function printBarcodes(ids: string[]) {
  const response = await fetchWithAuth('/barcode/print', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to generate print label payload');
}

export async function validateBarcode(barcode: string) {
  const response = await fetchWithAuth('/barcode/validate', {
    method: 'POST',
    body: JSON.stringify({ barcode })
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to validate barcode');
}
