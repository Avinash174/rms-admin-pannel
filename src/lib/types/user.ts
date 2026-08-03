export type RoleNameKey =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SUPERVISOR'
  | 'OPERATOR'
  | 'VIEWER';

export interface UserWarehouse {
  id: string;
  code: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  username?: string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  roleKey?: RoleNameKey;
  warehouseId?: string;
  warehouseName?: string;
  warehousesCount?: number;
  warehouses?: UserWarehouse[];
  warehouseIds?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isActive?: boolean;
  companyId: string;
  employeeCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: RoleNameKey;
  password: string;
  warehouseIds?: string[];
}

export interface UpdateUserRequest {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: RoleNameKey;
  isActive?: boolean;
}

export interface UserListResponse {
  data: User[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
