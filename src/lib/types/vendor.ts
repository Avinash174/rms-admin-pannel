export interface Vendor {
  id: string;
  companyId: string;
  name: string;
  code: string;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface VendorListResponse {
  data: Vendor[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateVendorRequest {
  name: string;
  code: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  companyId?: string;
}

export interface UpdateVendorRequest {
  name?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}
