import { CreateVendorRequest, UpdateVendorRequest, Vendor, VendorListResponse } from '../types/vendor';
import { fetchWithAuth } from './auth';

export async function getVendors(
  page: number = 1,
  pageSize: number = 20,
  filters?: { search?: string; status?: 'ALL' | 'ACTIVE' | 'INACTIVE'; companyId?: string }
): Promise<VendorListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && filters.status !== 'ALL' && { status: filters.status }),
    ...(filters?.companyId && { companyId: filters.companyId })
  });

  const response = await fetchWithAuth(`/vendors?${params.toString()}`);
  return {
    data: response.data || [],
    meta: response.meta || {
      page,
      pageSize,
      total: response.data?.length || 0,
      totalPages: 1
    }
  };
}

export async function getVendor(id: string): Promise<Vendor> {
  const response = await fetchWithAuth(`/vendors/${id}`);
  return response.data;
}

export async function createVendor(data: CreateVendorRequest): Promise<Vendor> {
  const response = await fetchWithAuth('/vendors', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function updateVendor(id: string, data: UpdateVendorRequest): Promise<Vendor> {
  const response = await fetchWithAuth(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await fetchWithAuth(`/vendors/${id}`, {
    method: 'DELETE'
  });
}
