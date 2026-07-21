import { Room, RoomListResponse, CreateRoomRequest, UpdateRoomRequest } from '../types/room';
import { fetchWithAuth } from './auth';

export async function getRooms(warehouseId: string, page: number = 1, pageSize: number = 20): Promise<RoomListResponse> {
  return fetchWithAuth(`/warehouses/${warehouseId}/rooms?page=${page}&pageSize=${pageSize}`);
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
