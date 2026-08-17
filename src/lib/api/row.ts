import { fetchWithAuth } from './auth';
import { CreateRowRequest, Row, UpdateRowRequest } from '../types/row';

export async function createRow(roomId: string, data: CreateRowRequest): Promise<Row> {
  const response = await fetchWithAuth(`/rooms/${roomId}/rows`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function updateRow(roomId: string, rowId: string, data: UpdateRowRequest): Promise<Row> {
  const response = await fetchWithAuth(`/rooms/${roomId}/rows/${rowId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
}

export async function deleteRow(roomId: string, rowId: string): Promise<void> {
  await fetchWithAuth(`/rooms/${roomId}/rows/${rowId}`, { method: 'DELETE' });
}
