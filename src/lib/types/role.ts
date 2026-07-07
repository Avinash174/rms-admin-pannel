export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  companyId: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  label: string;
}

export interface UpdateRoleRequest {
  label: string;
}
