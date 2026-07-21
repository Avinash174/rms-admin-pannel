import { Room, RoomListResponse, CreateRoomRequest, UpdateRoomRequest } from '../types/room';
import { fetchWithAuth } from './auth';

// Backend route is flat (`/rooms?warehouseId=...`), not nested under `/warehouses/:id/rooms`,
// and does not support pagination — it returns the full array with no `meta`.
export async function getRooms(warehouseId: string, page: number = 1, pageSize: number = 20): Promise<RoomListResponse> {
  return fetchWithAuth(`/rooms?warehouseId=${warehouseId}`);
}

export async function getRoom(id: string): Promise<Room> {
  const response = await fetchWithAuth(`/rooms/${id}`);
  return response.data;
}

export async function createRoom(warehouseId: string, data: CreateRoomRequest): Promise<Room> {
  const response = await fetchWithAuth('/rooms', {
    method: 'POST',
    body: JSON.stringify({ ...data, warehouseId }),
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
