import { Warehouse, WarehouseListResponse, CreateWarehouseRequest, UpdateWarehouseRequest } from '../types/warehouse';

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

export async function getWarehouses(page: number = 1, pageSize: number = 20): Promise<WarehouseListResponse> {
  try {
    const response = await fetchWithAuth(`/warehouses?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    return {
      data: [
        {
          id: '1',
          name: 'Main Warehouse',
          code: 'MW',
          address: '789 Industrial Blvd',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10003',
          phone: '+1 234-567-8902',
          siteId: '1',
          siteName: 'Downtown Site',
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

export async function getWarehouse(id: string): Promise<Warehouse> {
  const response = await fetchWithAuth(`/warehouses/${id}`);
  return response.data;
}

export async function createWarehouse(data: CreateWarehouseRequest): Promise<Warehouse> {
  const response = await fetchWithAuth('/warehouses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateWarehouse(id: string, data: UpdateWarehouseRequest): Promise<Warehouse> {
  const response = await fetchWithAuth(`/warehouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await fetchWithAuth(`/warehouses/${id}`, {
    method: 'DELETE',
  });
}
