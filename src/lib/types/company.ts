export interface Company {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateCompanyRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface CompanyListResponse {
  data: Company[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
