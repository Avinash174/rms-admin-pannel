import { Rack, RackListResponse, CreateRackRequest, UpdateRackRequest } from '../types/rack';
import { fetchWithAuth } from './auth';

type RackListFilters = {
  roomId?: string;
  warehouseId?: string;
  page?: number;
  pageSize?: number;
};

export async function getRacks(filters: RackListFilters = {}): Promise<RackListResponse> {
  const params = new URLSearchParams();
  if (filters.roomId) params.set('roomId', filters.roomId);
  if (filters.warehouseId) params.set('warehouseId', filters.warehouseId);
  const query = params.toString();
  const response = await fetchWithAuth(`/racks${query ? `?${query}` : ''}`);
  const rows = Array.isArray(response.data) ? response.data : [];
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  return {
    data: rows,
    meta: {
      page,
      pageSize,
      total: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize))
    }
  };
}

export async function getRack(id: string): Promise<Rack> {
  const response = await fetchWithAuth(`/racks/${id}`);
  return response.data;
}

export async function createRack(roomId: string, data: CreateRackRequest): Promise<Rack> {
  const response = await fetchWithAuth('/racks', {
    method: 'POST',
    body: JSON.stringify({ ...data, roomId }),
  });
  return response.data;
}

export async function updateRack(id: string, data: UpdateRackRequest): Promise<Rack> {
  const response = await fetchWithAuth(`/racks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteRack(id: string): Promise<void> {
  await fetchWithAuth(`/racks/${id}`, {
    method: 'DELETE',
  });
}
