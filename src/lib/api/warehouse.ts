import { Warehouse, WarehouseListResponse, CreateWarehouseRequest, UpdateWarehouseRequest } from '../types/warehouse';
import { fetchWithAuth } from './auth';

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
          zipCode: 10003,
          phone: '12345678902',
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
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch warehouse');
}

export async function createWarehouse(data: CreateWarehouseRequest): Promise<Warehouse> {
  const response = await fetchWithAuth('/warehouses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to create warehouse');
}

export async function updateWarehouse(id: string, data: UpdateWarehouseRequest): Promise<Warehouse> {
  const response = await fetchWithAuth(`/warehouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to update warehouse');
}

export async function deleteWarehouse(id: string): Promise<void> {
  const response = await fetchWithAuth(`/warehouses/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('Failed to delete warehouse');
  }
}
