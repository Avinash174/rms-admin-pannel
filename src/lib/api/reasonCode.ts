import { ReasonCode, CreateReasonCodeRequest } from '../types/reasonCode';

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

export async function getReasonCodes(): Promise<{ data: ReasonCode[] }> {
  try {
    const response = await fetchWithAuth('/reason-codes');
    return response;
  } catch (error) {
    // Mock Fallback Data
    return {
      data: [
        {
          id: '1',
          code: 'DAMAGED_BARCODE',
          description: 'The physical barcode on the box is unreadable/scratched',
          category: 'OVERRIDE',
          isActive: true,
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          code: 'TEMP_OUT_OF_BOUNDS',
          description: 'Warehouse sensor readings are out of standard bounds',
          category: 'REJECTION',
          isActive: true,
          companyId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
}

export async function createReasonCode(data: CreateReasonCodeRequest): Promise<ReasonCode> {
  const response = await fetchWithAuth('/reason-codes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}
