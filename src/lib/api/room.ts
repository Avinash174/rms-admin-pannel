import { Room, RoomListResponse, CreateRoomRequest, UpdateRoomRequest } from '../types/room';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1/admin';

async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getRooms(warehouseId: string, page: number = 1, pageSize: number = 20): Promise<RoomListResponse> {
  try {
    const response = await fetchWithAuth(`/warehouses/${warehouseId}/rooms?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Room A',
          code: 'RA',
          description: 'Main storage room',
          warehouseId: warehouseId,
          warehouseName: 'Main Warehouse',
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

export async function getRoom(id: string): Promise<Room> {
  const response = await fetchWithAuth(`/rooms/${id}`);
  return response.data;
}

export async function createRoom(warehouseId: string, data: CreateRoomRequest): Promise<Room> {
  const response = await fetchWithAuth(`/warehouses/${warehouseId}/rooms`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateRoom(id: string, data: UpdateRoomRequest): Promise<Room> {
  const response = await fetchWithAuth(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteRoom(id: string): Promise<void> {
  await fetchWithAuth(`/rooms/${id}`, {
    method: 'DELETE',
  });
}
