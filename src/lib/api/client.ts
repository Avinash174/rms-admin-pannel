import { Client, ClientListResponse, CreateClientRequest, UpdateClientRequest } from '../types/client';
import { fetchWithAuth } from './auth';

export async function getClients(page: number = 1, pageSize: number = 20): Promise<ClientListResponse> {
  try {
    const response = await fetchWithAuth(`/clients?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Acme Corporation',
          code: 'ACME',
          contactEmail: 'contact@acme.com',
          contactPhone: '12345678900',
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

export async function getClient(id: string): Promise<Client> {
  const response = await fetchWithAuth(`/clients/${id}`);
  return response.data;
}

export async function createClient(data: CreateClientRequest): Promise<Client> {
  const response = await fetchWithAuth('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
  const response = await fetchWithAuth(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteClient(id: string): Promise<void> {
  await fetchWithAuth(`/clients/${id}`, {
    method: 'DELETE',
  });
}
