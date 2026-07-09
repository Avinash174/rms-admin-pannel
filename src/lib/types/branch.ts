export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateBranchRequest {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  isActive?: boolean;
}

export interface BranchListResponse {
  data: Branch[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
