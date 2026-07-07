export interface Box {
  id: string;
  barcode: string;
  name?: string;
  description?: string;
  year?: number;
  locationId: string;
  locationName?: string;
  clientId: string;
  clientName?: string;
  departmentId?: string;
  departmentName?: string;
  companyId: string;
  fileCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoxRequest {
  barcode: string;
  name?: string;
  description?: string;
  year?: number;
  locationId: string;
  clientId: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface UpdateBoxRequest {
  barcode?: string;
  name?: string;
  description?: string;
  year?: number;
  locationId?: string;
  clientId?: string;
  departmentId?: string;
  isActive?: boolean;
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
