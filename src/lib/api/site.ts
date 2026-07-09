import { Site, SiteListResponse, CreateSiteRequest, UpdateSiteRequest } from '../types/site';
import { fetchWithAuth } from './auth';

export async function getSites(page: number = 1, pageSize: number = 20): Promise<SiteListResponse> {
  try {
    const response = await fetchWithAuth(`/sites?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Downtown Site',
          code: 'DS',
          address: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          phone: '+1 234-567-8901',
          branchId: '1',
          branchName: 'Main Branch',
          companyId: '1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page, pageSize, total: 1, totalPages: 1 },
    };
  }
}

export async function getSite(id: string): Promise<Site> {
  const response = await fetchWithAuth(`/sites/${id}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch site');
}

export async function createSite(data: CreateSiteRequest): Promise<Site> {
  const response = await fetchWithAuth('/sites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to create site');
}

export async function updateSite(id: string, data: UpdateSiteRequest): Promise<Site> {
  const response = await fetchWithAuth(`/sites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to update site');
}

export async function deleteSite(id: string): Promise<void> {
  const response = await fetchWithAuth(`/sites/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('Failed to delete site');
  }
}
