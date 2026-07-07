export interface Location {
  id: string;
  barcode: string;
  name?: string;
  shelfId: string;
  shelfName?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  barcode: string;
  name?: string;
  shelfId: string;
  isActive?: boolean;
}

export interface UpdateLocationRequest {
  barcode?: string;
  name?: string;
  shelfId?: string;
  isActive?: boolean;
}

export interface LocationListResponse {
  data: Location[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
