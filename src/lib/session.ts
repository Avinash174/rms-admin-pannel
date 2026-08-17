import {
  AuthSession,
  EntityRef,
  LoginResponse,
  SESSION_STORAGE_KEYS,
  SessionUser,
} from '@/lib/types/auth';
import { normalizeRoleName } from '@/lib/permissions';

export function parseNames(fullName?: string) {
  const names = fullName ? fullName.split(' ') : ['Admin', 'User'];
  return {
    firstName: names[0],
    lastName: names.slice(1).join(' ') || '',
  };
}

export function mapApiUserToSessionUser(
  apiUser: Record<string, unknown>,
  company?: EntityRef | null,
  branch?: EntityRef | null,
  warehouse?: EntityRef | null,
  permissions?: string[],
  existing?: Partial<SessionUser>
): SessionUser {
  const fullName =
    (apiUser.name as string) ||
    (apiUser.fullName as string) ||
    (existing?.firstName
      ? `${existing.firstName} ${existing.lastName ?? ''}`.trim()
      : '');
  const { firstName, lastName } = parseNames(fullName);

  let companyId = company?.id ?? existing?.companyId ?? (apiUser.companyId as string) ?? '';
  let roleId = existing?.roleId ?? (apiUser.roleId as string) ?? '';
  const roleName =
    normalizeRoleName(
      (apiUser.role as string) || existing?.roleName || (apiUser.roleName as string)
    ) || 'OPERATOR';

  const perms =
    permissions ??
    (Array.isArray(apiUser.permissions) ? (apiUser.permissions as string[]) : []) ??
    existing?.permissions ??
    [];

  return {
    id: (apiUser.id as string) || existing?.id || '',
    email: (apiUser.email as string) || existing?.email || '',
    firstName: firstName || existing?.firstName || 'Admin',
    lastName: lastName || existing?.lastName || '',
    fullName: fullName || `${firstName} ${lastName}`.trim() || existing?.fullName,
    username: (apiUser.username as string) || existing?.username || (apiUser.email as string),
    employeeCode: (apiUser.employeeCode as string) || existing?.employeeCode,
    mobile: (apiUser.mobile as string) ?? (apiUser.phone as string) ?? existing?.mobile,
    companyId,
    roleId,
    roleName,
    role: roleName,
    permissions: perms,
    companyName: company?.name ?? existing?.companyName,
    branchId: branch?.id ?? existing?.branchId ?? null,
    branchName: branch?.name ?? existing?.branchName,
    warehouseId: warehouse?.id ?? existing?.warehouseId ?? null,
    warehouseCode: warehouse?.code ?? existing?.warehouseCode,
    warehouseName: warehouse?.name ?? existing?.warehouseName,
  };
}

export function persistSession(session: Partial<AuthSession>) {
  if (typeof window === 'undefined') return;

  if (session.accessToken) {
    localStorage.setItem(SESSION_STORAGE_KEYS.accessToken, session.accessToken);
  }
  if (session.refreshToken) {
    localStorage.setItem(SESSION_STORAGE_KEYS.refreshToken, session.refreshToken);
  }
  if (session.expiresAt) {
    localStorage.setItem(SESSION_STORAGE_KEYS.expiresAt, session.expiresAt);
  }
  if (session.user) {
    localStorage.setItem(SESSION_STORAGE_KEYS.user, JSON.stringify(session.user));
  }
  if (session.company) {
    localStorage.setItem(SESSION_STORAGE_KEYS.company, JSON.stringify(session.company));
  }
  if (session.branch) {
    localStorage.setItem(SESSION_STORAGE_KEYS.branch, JSON.stringify(session.branch));
  } else if (session.branch === null) {
    localStorage.removeItem(SESSION_STORAGE_KEYS.branch);
  }
  if (session.warehouse) {
    localStorage.setItem(SESSION_STORAGE_KEYS.warehouse, JSON.stringify(session.warehouse));
  }
  if (session.permissions) {
    localStorage.setItem(SESSION_STORAGE_KEYS.permissions, JSON.stringify(session.permissions));
  }
  if (session.availableCompanies) {
    localStorage.setItem(
      SESSION_STORAGE_KEYS.availableCompanies,
      JSON.stringify(session.availableCompanies)
    );
  }
  if (session.availableBranches) {
    localStorage.setItem(
      SESSION_STORAGE_KEYS.availableBranches,
      JSON.stringify(session.availableBranches)
    );
  }
  if (session.availableWarehouses) {
    localStorage.setItem(
      SESSION_STORAGE_KEYS.availableWarehouses,
      JSON.stringify(session.availableWarehouses)
    );
  }
}

export function clearPersistedSession() {
  if (typeof window === 'undefined') return;
  Object.values(SESSION_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function readPersistedSession(): Partial<AuthSession> | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(SESSION_STORAGE_KEYS.accessToken);
  if (!token) return null;

  const userStr = localStorage.getItem(SESSION_STORAGE_KEYS.user);
  const companyStr = localStorage.getItem(SESSION_STORAGE_KEYS.company);
  const branchStr = localStorage.getItem(SESSION_STORAGE_KEYS.branch);
  const warehouseStr = localStorage.getItem(SESSION_STORAGE_KEYS.warehouse);
  const permissionsStr = localStorage.getItem(SESSION_STORAGE_KEYS.permissions);

  return {
    accessToken: token,
    refreshToken: localStorage.getItem(SESSION_STORAGE_KEYS.refreshToken) || '',
    expiresAt: localStorage.getItem(SESSION_STORAGE_KEYS.expiresAt) || undefined,
    user: userStr ? JSON.parse(userStr) : undefined,
    company: companyStr ? JSON.parse(companyStr) : undefined,
    branch: branchStr ? JSON.parse(branchStr) : null,
    warehouse: warehouseStr ? JSON.parse(warehouseStr) : undefined,
    permissions: permissionsStr ? JSON.parse(permissionsStr) : [],
    availableCompanies: readJson(SESSION_STORAGE_KEYS.availableCompanies),
    availableBranches: readJson(SESSION_STORAGE_KEYS.availableBranches),
    availableWarehouses: readJson(SESSION_STORAGE_KEYS.availableWarehouses),
  };
}

function readJson(key: string): EntityRef[] | undefined {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : undefined;
}

export function mapLoginDataToResponse(data: Record<string, unknown>): LoginResponse {
  const userRaw = (data.user as Record<string, unknown>) || {};
  const company = (data.currentCompany ?? data.company) as EntityRef | undefined;
  const branch = ((data.currentBranch ?? data.branch) as EntityRef | null) ?? null;
  const warehouse = (data.currentWarehouse ?? data.warehouse) as EntityRef | undefined;
  const permissions = (data.permissions as string[]) || (userRaw.permissions as string[]) || [];

  let companyId = company?.id ?? '';
  let roleId = '';
  try {
    const payload = JSON.parse(atob((data.accessToken as string).split('.')[1]));
    companyId = payload.companyId || companyId;
    roleId = payload.roleId || '';
  } catch {
    // ignore decode errors
  }

  const user = mapApiUserToSessionUser(
    { ...userRaw, companyId, roleId },
    company,
    branch,
    warehouse,
    permissions
  );

  return {
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
    expiresAt: data.expiresAt as string | undefined,
    user,
    role: data.role as LoginResponse['role'],
    company,
    branch,
    warehouse,
    permissions,
    availableCompanies: (data.availableCompanies ?? data.companies) as EntityRef[] | undefined,
    availableBranches: (data.availableBranches ?? data.branches) as EntityRef[] | undefined,
    availableWarehouses: (data.availableWarehouses ?? data.warehouses) as EntityRef[] | undefined,
    companies: data.companies as EntityRef[] | undefined,
    branches: data.branches as EntityRef[] | undefined,
    warehouses: data.warehouses as EntityRef[] | undefined,
    currentCompany: (data.currentCompany ?? data.company) as EntityRef | undefined,
    currentBranch: (data.currentBranch ?? data.branch) as EntityRef | null | undefined,
    currentWarehouse: (data.currentWarehouse ?? data.warehouse) as EntityRef | undefined,
  };
}

export function applyLoginResponse(response: LoginResponse): AuthSession {
  const session: AuthSession = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: response.expiresAt,
    user: response.user,
    company: response.company!,
    branch: response.branch ?? null,
    warehouse: response.warehouse!,
    permissions: response.permissions ?? response.user.permissions,
    availableCompanies: response.availableCompanies,
    availableBranches: response.availableBranches,
    availableWarehouses: response.availableWarehouses,
  };
  persistSession(session);
  return session;
}
