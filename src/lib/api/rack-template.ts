import { fetchWithAuth } from './auth';
import {
  CreateRackTemplateRequest,
  RackTemplate,
  RackTemplateListResponse,
  RackTemplatePreview,
  UpdateRackTemplateRequest
} from '../types/rack-template';

type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  warehouseType?: 'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';
};

function buildQuery(params: ListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.warehouseType) query.set('warehouseType', params.warehouseType);
  const value = query.toString();
  return value ? `?${value}` : '';
}

export async function getRackTemplates(params: ListParams = {}): Promise<RackTemplateListResponse> {
  const response = await fetchWithAuth(`/rack-templates${buildQuery(params)}`);
  return {
    data: response.data || [],
    meta: response.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 }
  };
}

export async function getRackTemplate(id: string): Promise<RackTemplate> {
  const response = await fetchWithAuth(`/rack-templates/${id}`);
  return response.data;
}

export async function createRackTemplate(data: CreateRackTemplateRequest): Promise<RackTemplate> {
  const response = await fetchWithAuth('/rack-templates', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function updateRackTemplate(id: string, data: UpdateRackTemplateRequest): Promise<RackTemplate> {
  const response = await fetchWithAuth(`/rack-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function deleteRackTemplate(id: string): Promise<void> {
  await fetchWithAuth(`/rack-templates/${id}`, { method: 'DELETE' });
}

export async function cloneRackTemplate(id: string, data: { name: string; code: string }): Promise<RackTemplate> {
  const response = await fetchWithAuth(`/rack-templates/${id}/clone`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function previewRackTemplate(id: string): Promise<RackTemplatePreview> {
  const response = await fetchWithAuth(`/rack-templates/${id}/preview`, { method: 'POST' });
  return response.data;
}

export async function previewRackTemplateDraft(data: CreateRackTemplateRequest): Promise<RackTemplatePreview> {
  const response = await fetchWithAuth('/rack-templates/preview', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function applyRackTemplate(
  id: string,
  data: { warehouseId: string; roomId: string }
): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/rack-templates/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function activateRackTemplate(id: string): Promise<RackTemplate> {
  const response = await fetchWithAuth(`/rack-templates/${id}/activate`, { method: 'PATCH' });
  return response.data;
}

export async function deactivateRackTemplate(id: string): Promise<RackTemplate> {
  const response = await fetchWithAuth(`/rack-templates/${id}/deactivate`, { method: 'PATCH' });
  return response.data;
}
