import { Rack, RackListResponse, CreateRackRequest, UpdateRackRequest } from '../types/rack';
import { fetchWithAuth } from './auth';

export async function getRacks(roomId: string, page: number = 1, pageSize: number = 20): Promise<RackListResponse> {
  try {
    const response = await fetchWithAuth(`/rooms/${roomId}/racks?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Rack A1',
          code: 'RA1',
          description: 'First rack in Room A',
          roomId: roomId,
          roomName: 'Room A',
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

export async function getRack(id: string): Promise<Rack> {
  const response = await fetchWithAuth(`/racks/${id}`);
  return response.data;
}

export async function createRack(roomId: string, data: CreateRackRequest): Promise<Rack> {
  const response = await fetchWithAuth(`/rooms/${roomId}/racks`, {
    method: 'POST',
    body: JSON.stringify(data),
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
