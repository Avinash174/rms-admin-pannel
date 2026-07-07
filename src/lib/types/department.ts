export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  clientId: string;
  clientName?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
  clientId: string;
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  description?: string;
  clientId?: string;
  isActive?: boolean;
}

export interface DepartmentListResponse {
  data: Department[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
