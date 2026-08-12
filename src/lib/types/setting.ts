export interface ReasonCode {
  id: string;
  code: string;
  label: string;
  appliesTo: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  code: string;
  defaultLocationCapacity: number;
  timezone: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanySettingsRequest {
  name?: string;
  defaultLocationCapacity?: number;
  timezone?: string;
}

export interface CreateReasonCodeRequest {
  code: string;
  label: string;
  appliesTo: string;
}
