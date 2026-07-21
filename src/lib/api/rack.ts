import { Rack, RackListResponse, CreateRackRequest, UpdateRackRequest } from '../types/rack';
import { fetchWithAuth } from './auth';

// Backend route is flat (`/racks?roomId=...`), not nested under `/rooms/:id/racks`,
// and does not support pagination — it returns the full array with no `meta`.
export async function getRacks(roomId: string, page: number = 1, pageSize: number = 20): Promise<RackListResponse> {
  return fetchWithAuth(`/racks?roomId=${roomId}`);
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
