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
  companyId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReasonCodeRequest {
  code: string;
  label: string;
  appliesTo: string;
}

export interface UpdateCompanySettingsRequest {
  name?: string;
}
