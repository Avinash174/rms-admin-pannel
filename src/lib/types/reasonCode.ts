export interface ReasonCode {
  id: string;
  code: string;
  label: string;
  appliesTo: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  description?: string;
}

export interface CreateReasonCodeRequest {
  code: string;
  label: string;
  appliesTo: string;
  isActive?: boolean;
  category?: string;
  description?: string;
}
