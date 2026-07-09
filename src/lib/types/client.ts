export interface Client {
  id: string;
  name: string;
  code: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  name: string;
  code: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface UpdateClientRequest {
  name?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive?: boolean;
}

export interface ClientListResponse {
  data: Client[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
