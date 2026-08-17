import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthSession,
  EntityRef,
} from '../types/auth';
import {
  applyLoginResponse,
  clearPersistedSession,
  mapApiUserToSessionUser,
  mapLoginDataToResponse,
  persistSession,
  readPersistedSession,
} from '@/lib/session';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3002/api/v1/admin`;
  }
  return 'http://localhost:3002/api/v1/admin';
}

function getApiRootUrl(): string {
  if (process.env.NEXT_PUBLIC_API_ROOT_URL) return process.env.NEXT_PUBLIC_API_ROOT_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3002/api/v1`;
  }
  return 'http://localhost:3002/api/v1';
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Login failed: API not found. Start the backend on port 3002 (cd backend && npm run dev) and open the admin panel at http://localhost:3000'
      );
    }
    let message = response.statusText;
    try {
      const err = await response.json();
      message = err.error?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message || 'Login failed');
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Login failed');
  }

  const responseData = mapLoginDataToResponse(json.data);
  applyLoginResponse(responseData);
  return responseData;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Token refresh failed');
  }

  const result = json.data;
  const responseData: RefreshTokenResponse = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt,
  };

  const existing = readPersistedSession();
  const user = mapApiUserToSessionUser(
    result.user || {},
    result.company,
    result.branch,
    result.warehouse,
    result.permissions,
    existing?.user
  );

  persistSession({
    accessToken: responseData.accessToken,
    refreshToken: responseData.refreshToken,
    expiresAt: responseData.expiresAt,
    user,
    company: result.company,
    branch: result.branch,
    warehouse: result.warehouse,
    permissions: result.permissions,
  });

  return responseData;
}

export async function logout(): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

  if (token) {
    try {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
    } catch {
      // ignore logout API failures
    }
  }

  clearPersistedSession();
}

export function getStoredUser() {
  const session = readPersistedSession();
  return session?.user ?? null;
}

export function getStoredSession(): Partial<AuthSession> | null {
  return readPersistedSession();
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export async function getCurrentUser() {
  const json = await fetchWithAuth('/auth/me', { redirectOn401: false });
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to fetch current user');
  }
  return json.data;
}

export async function getPermissions() {
  const json = await fetchWithAuth('/auth/permissions');
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to fetch permissions');
  }
  return json.data.permissions as string[];
}

async function applySwitchResponse(data: Record<string, unknown>) {
  const mapped = mapLoginDataToResponse(data);
  return applyLoginResponse(mapped);
}

export async function switchWarehouse(warehouseId: string): Promise<AuthSession> {
  const json = await fetchWithAuth('/auth/switch-warehouse', {
    method: 'POST',
    body: JSON.stringify({ warehouseId }),
  });
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to switch warehouse');
  }
  return applySwitchResponse(json.data);
}

export async function switchBranch(branchId: string): Promise<AuthSession> {
  const json = await fetchWithAuth('/auth/switch-branch', {
    method: 'POST',
    body: JSON.stringify({ branchId }),
  });
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to switch branch');
  }
  return applySwitchResponse(json.data);
}

export async function switchCompany(companyId: string): Promise<AuthSession> {
  const json = await fetchWithAuth('/auth/switch-company', {
    method: 'POST',
    body: JSON.stringify({ companyId }),
  });
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to switch company');
  }
  return applySwitchResponse(json.data);
}

export async function bindDevice(serialNumber: string, model: string) {
  const json = await fetchWithAuth('/auth/device-bind', {
    method: 'POST',
    body: JSON.stringify({ serialNumber, model }),
  });
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Device bind failed');
  }
  return json.data;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

type FetchWithAuthOptions = RequestInit & { redirectOn401?: boolean };

export async function fetchWithAuth(endpoint: string, options?: FetchWithAuthOptions): Promise<any> {
  return fetchWithAuthBase(getApiBaseUrl(), endpoint, options);
}

export async function fetchWithAuthRoot(endpoint: string, options?: FetchWithAuthOptions): Promise<any> {
  return fetchWithAuthBase(getApiRootUrl(), endpoint, options);
}

async function fetchWithAuthBase(
  baseUrl: string,
  endpoint: string,
  options?: FetchWithAuthOptions
): Promise<any> {
  const { redirectOn401 = true, ...fetchOptions } = options ?? {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token }),
    ...fetchOptions?.headers,
  };

  const url = baseUrl + endpoint;

  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      ...fetchOptions,
      headers,
    });
  } catch (networkErr: any) {
    if (networkErr.message === 'Failed to fetch' || networkErr.name === 'TypeError') {
      throw new Error('Cannot connect to backend server. Please verify backend is running on port 3002.');
    }
    throw networkErr;
  }

  if (response.status === 401) {
    let errorData = null;
    try {
      errorData = await response.clone().json();
    } catch (_) {}

    if (errorData?.error?.code === 'TOKEN_EXPIRED') {
      const refreshTokenStr = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (refreshTokenStr) {
        const refreshPromise = new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken: string) => {
            try {
              const retryHeaders = {
                ...headers,
                Authorization: 'Bearer ' + newToken,
              };
              const retryResponse = await fetch(url, {
                cache: 'no-store',
                ...fetchOptions,
                headers: retryHeaders,
              });

              if (!retryResponse.ok) {
                let retryErrorData = null;
                try {
                  retryErrorData = await retryResponse.json();
                } catch (_) {}
                reject(new Error(retryErrorData?.error?.message || 'API error: ' + retryResponse.status));
              } else {
                resolve(await retryResponse.json());
              }
            } catch (e) {
              reject(e);
            }
          });
        });

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await refreshToken({ refreshToken: refreshTokenStr });
            const newAccessToken = localStorage.getItem('access_token');
            if (!newAccessToken) throw new Error('No access token after refresh');
            isRefreshing = false;
            onRefreshed(newAccessToken);
          } catch (refreshError) {
            isRefreshing = false;
            clearPersistedSession();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw refreshError;
          }
        }

        return refreshPromise;
      }
    }
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (_) {}

    if (response.status === 401 && redirectOn401) {
      clearPersistedSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    if (response.status === 403) {
      const err = new Error(errorData?.error?.message || 'Permission denied') as Error & { status?: number };
      err.status = 403;
      throw err;
    }

    throw new Error(errorData?.error?.message || 'API error: ' + response.status + ' ' + response.statusText);
  }

  return response.json();
}

export function hydrateSessionFromMe(me: Record<string, unknown>, existing?: Partial<AuthSession>): AuthSession {
  const company = me.company as EntityRef;
  const branch = (me.branch as EntityRef | null) ?? null;
  const warehouse = me.warehouse as EntityRef;
  const permissions = (me.permissions as string[]) || (me.role as { permissions?: string[] })?.permissions || [];

  const user = mapApiUserToSessionUser(
    {
      id: me.id,
      email: me.email,
      employeeCode: me.employeeCode,
      name: me.fullName,
      mobile: me.phone,
      role: (me.role as { name?: string })?.name,
      roleId: (me.role as { id?: string })?.id,
    },
    company,
    branch,
    warehouse,
    permissions,
    existing?.user
  );

  const session: AuthSession = {
    accessToken: existing?.accessToken || localStorage.getItem('access_token') || '',
    refreshToken: existing?.refreshToken || localStorage.getItem('refresh_token') || '',
    expiresAt: existing?.expiresAt,
    user,
    company,
    branch,
    warehouse,
    permissions,
    availableCompanies: (me.availableCompanies ?? me.companies) as EntityRef[] | undefined,
    availableBranches: (me.availableBranches ?? me.branches) as EntityRef[] | undefined,
    availableWarehouses: (me.availableWarehouses ?? me.warehouses) as EntityRef[] | undefined,
  };

  persistSession(session);
  return session;
}
