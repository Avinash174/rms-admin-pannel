import { ReasonCode, CreateReasonCodeRequest } from '../types/reasonCode';
import { fetchWithAuth } from './auth';

export async function getReasonCodes(): Promise<{ data: ReasonCode[] }> {
  const response = await fetchWithAuth('/reason-codes');
  if (response && Array.isArray(response.data)) {
    response.data = response.data.map((rc: any) => ({
      ...rc,
      category: rc.appliesTo,
      description: rc.label,
    }));
  }
  return response;
}

export async function createReasonCode(data: CreateReasonCodeRequest): Promise<ReasonCode> {
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const companyId = user?.companyId || '1';

  const payload = {
    code: data.code,
    label: data.description || data.label || '',
    appliesTo: data.category || data.appliesTo || 'REJECTION',
    isActive: data.isActive !== undefined ? data.isActive : true,
    companyId
  };

  const response = await fetchWithAuth('/reason-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response && response.data) {
    response.data.category = response.data.appliesTo;
    response.data.description = response.data.label;
  }
  return response.data;
}
