export interface ReasonCode {
  id: string;
  code: string;
  description: string;
  category: string; // e.g. OVERRIDE, REJECTION, DESTRUCTION
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReasonCodeRequest {
  code: string;
  description: string;
  category: string;
  isActive?: boolean;
}
