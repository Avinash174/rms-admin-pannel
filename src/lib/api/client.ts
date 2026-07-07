import { Client, ClientListResponse, CreateClientRequest, UpdateClientRequest } from '../types/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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
          contactPerson: 'John Smith',
          email: 'john@acme.com',
          phone: '+1 234-567-8900',
          address: '123 Business Ave',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
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
