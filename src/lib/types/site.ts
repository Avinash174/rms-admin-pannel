export interface Site {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  branchId: string;
  branchName?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  branchId: string;
  isActive?: boolean;
}

export interface UpdateSiteRequest {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  branchId?: string;
  isActive?: boolean;
}

export interface SiteListResponse {
  data: Site[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
