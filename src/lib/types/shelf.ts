export interface Shelf {
  id: string;
  name: string;
  code: string;
  description?: string;
  rackId: string;
  rackName?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShelfRequest {
  name: string;
  code: string;
  description?: string;
  rackId: string;
  isActive?: boolean;
}

export interface UpdateShelfRequest {
  name?: string;
  code?: string;
  description?: string;
  rackId?: string;
  isActive?: boolean;
}

export interface ShelfListResponse {
  data: Shelf[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
