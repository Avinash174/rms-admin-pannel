import { fetchWithAuthRoot } from './auth';

export type OperationType = 'INVENTORY' | 'REFILE' | 'SEGREGATION' | 'FRESH_BOX' | 'INTAKE';
export type OperationStatus = 'COMPLETED' | 'REJECTED';

export interface OperationSummary {
  id: string;
  type: OperationType;
  status: OperationStatus;
  performedAt: string;
  user: { id: string; fullName: string; email: string };
  summary: string;
  reasonCode?: string;
  fileBarcode?: string;
  boxBarcode?: string;
  warehouseName?: string;
  verifiedCount?: number;
  missingCount?: number;
  warningsCount?: number;
  oldBoxBarcode?: string;
  newBoxBarcode?: string;
  outCount?: number;
  inCount?: number;
}

export interface OperationDetail {
  id: string;
  type: OperationType;
  status: OperationStatus;
  performedAt: string;
  user: { id: string; fullName: string; email: string };
  reasonCode?: string;
  file?: { id: string; barcode: string; title?: string | null };
  expected?: {
    location?: { id: string; barcode: string; name: string } | null;
    box?: { id: string; barcode: string; description?: string | null };
  };
  scanned?: {
    location?: { id: string; barcode: string; name: string } | null;
    box?: { id: string; barcode: string; description?: string | null };
  };
  box?: { id: string; barcode: string; description?: string | null };
  oldBox?: { id: string; barcode: string; description?: string | null };
  newBox?: { id: string; barcode: string; description?: string | null };
  summary?: {
    missingFileCount?: number;
    unexpectedFileCount?: number;
    scanCount?: number;
  };
  scanEvents?: Array<{
    barcode: string;
    scannedAt?: string;
    isExpected?: boolean;
    isMissingFlag?: boolean;
    remark?: string;
    client?: string;
    result?: string;
  }>;
}

export interface OperationsListParams {
  page?: number;
  limit?: number;
  type?: OperationType;
  status?: OperationStatus;
  from?: string;
  to?: string;
  hasMissing?: boolean;
}

function normalizeMeta(meta: any, page: number, limit: number) {
  return {
    page: meta?.page || page,
    pageSize: meta?.limit || limit,
    total: meta?.total || 0,
    totalPages: meta?.totalPages || 1,
  };
}

export async function listOperations(params: OperationsListParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params.type && { type: params.type }),
    ...(params.status && { status: params.status }),
    ...(params.from && { from: params.from }),
    ...(params.to && { to: params.to }),
    ...(params.hasMissing !== undefined && { hasMissing: String(params.hasMissing) }),
  });

  const response = await fetchWithAuthRoot(`/operations?${qs}`);
  return {
    data: (response.data || []) as OperationSummary[],
    meta: normalizeMeta(response.meta, page, limit),
  };
}

export async function getOperation(id: string): Promise<OperationDetail> {
  const response = await fetchWithAuthRoot(`/operations/${id}`);
  return response.data;
}
