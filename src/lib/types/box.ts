export interface Box {
  id: string;
  barcode: string;
  status: string;
  description?: string;
  currentLocationId?: string;
  locationName?: string;
  clientId: string;
  clientName?: string;
  departmentId?: string;
  departmentName?: string;
  companyId: string;
  fileCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoxRequest {
  barcode: string;
  description?: string;
  clientId: string;
  departmentId?: string;
  currentLocationId?: string;
}

export interface UpdateBoxRequest {
  barcode?: string;
  description?: string;
  clientId?: string;
  departmentId?: string;
  currentLocationId?: string;
  status?: string;
}

export interface BoxListResponse {
  data: Box[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
