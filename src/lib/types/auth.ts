export interface LoginRequest {
  email: string;
  password: string;
}

export interface EntityRef {
  id: string;
  name: string;
  code?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  username?: string;
  employeeCode?: string;
  mobile?: string | null;
  companyId: string;
  roleId: string;
  roleName: string;
  role?: string;
  permissions: string[];
  companyName?: string;
  branchId?: string | null;
  branchName?: string;
  warehouseId?: string | null;
  warehouseCode?: string;
  warehouseName?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: SessionUser;
  company: EntityRef;
  branch: EntityRef | null;
  warehouse: EntityRef;
  permissions: string[];
  availableCompanies?: EntityRef[];
  availableBranches?: EntityRef[];
  availableWarehouses?: EntityRef[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: SessionUser;
  company?: EntityRef;
  branch?: EntityRef | null;
  warehouse?: EntityRef;
  permissions?: string[];
  availableCompanies?: EntityRef[];
  availableBranches?: EntityRef[];
  availableWarehouses?: EntityRef[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
}

export const SESSION_STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'user',
  company: 'session_company',
  branch: 'session_branch',
  warehouse: 'session_warehouse',
  permissions: 'session_permissions',
  expiresAt: 'session_expires_at',
  availableCompanies: 'session_available_companies',
  availableBranches: 'session_available_branches',
  availableWarehouses: 'session_available_warehouses',
} as const;
