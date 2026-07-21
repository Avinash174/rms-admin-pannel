import { Site, SiteListResponse, CreateSiteRequest, UpdateSiteRequest } from '../types/site';
import { fetchWithAuth } from './auth';

export async function getSites(page: number = 1, pageSize: number = 20): Promise<SiteListResponse> {
  return fetchWithAuth(`/sites?page=${page}&pageSize=${pageSize}`);
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
