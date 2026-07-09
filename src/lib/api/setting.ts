import { ReasonCode, CompanySettings, CreateReasonCodeRequest, UpdateCompanySettingsRequest } from '../types/setting';
import { fetchWithAuth } from './auth';

export async function getReasonCodes(appliesTo?: string): Promise<ReasonCode[]> {
  const url = appliesTo ? `/settings/reason-codes?appliesTo=${appliesTo}` : '/settings/reason-codes';
  const response = await fetchWithAuth(url);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to get reason codes');
}

export async function createReasonCode(data: CreateReasonCodeRequest): Promise<ReasonCode> {
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const companyId = user?.companyId || '1';

  const response = await fetchWithAuth('/settings/reason-codes', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      companyId
    }),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to create reason code');
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const response = await fetchWithAuth('/settings/company');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to get company settings');
}

export async function updateCompanySettings(data: UpdateCompanySettingsRequest): Promise<CompanySettings> {
  const response = await fetchWithAuth('/settings/company', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to update company settings');
}
