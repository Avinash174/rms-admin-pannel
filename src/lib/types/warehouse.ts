export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  siteId?: string;
  siteName?: string;
  site?: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  siteId?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseRequest {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  siteId?: string;
  isActive?: boolean;
}

export interface WarehouseListResponse {
  data: Warehouse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
