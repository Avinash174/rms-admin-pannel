export interface Location {
  id: string;
  barcode: string;
  name?: string;
  code?: string;
  shelfId?: string;
  shelfName?: string;
  warehouseId?: string;
  warehouseName?: string;
  fullLocation?: string;
  row?: string;
  rack?: string;
  level?: string;
  location?: string;
  fullLocation2?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  companyId?: string;
  isActive: boolean;
  isOccupied?: boolean;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string; code: string };
  shelf?: any;
  currentBox?: any;
}

export interface CreateLocationRequest {
  barcode: string;
  name?: string;
  shelfId?: string;
  warehouseId?: string;
  fullLocation?: string;
  row?: string;
  rack?: string;
  level?: string;
  location?: string;
  fullLocation2?: string;
  isActive?: boolean;
}

export interface UpdateLocationRequest {
  barcode?: string;
  name?: string;
  shelfId?: string;
  warehouseId?: string;
  fullLocation?: string;
  row?: string;
  rack?: string;
  level?: string;
  location?: string;
  fullLocation2?: string;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface LocationImportRow {
  'Full Location'?: string;
  'NRow'?: string;
  'NRack2'?: string;
  'Nlevel'?: string;
  'NLocation'?: string;
  'NFull Location2'?: string;
  fullLocation?: string;
  row?: string;
  rack?: string;
  level?: string;
  location?: string;
  fullLocation2?: string;
  barcode?: string;
  name?: string;
}

export interface LocationImportResult {
  totalRecords: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    location: string;
    error: string;
  }>;
}

export interface LocationListResponse {
  data: Location[];
  meta: {
    page: number;
    pageSize: number;
    limit?: number;
    total: number;
    totalPages: number;
  };
}
