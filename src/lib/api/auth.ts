import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';

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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Login failed: API not found. Start the backend on port 3002 (cd backend && npm run dev) and open the admin panel at http://localhost:3000'
      );
    }
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Login failed');
  }

  const result = json.data;

  // Split full name into first and last names for frontend compatibility
  const names = result.user.fullName ? result.user.fullName.split(' ') : ['Admin', 'User'];
  const firstName = names[0];
  const lastName = names.slice(1).join(' ') || '';

  // Decode JWT to extract companyId and roleId
  let companyId = '1';
  let roleId = '1';
  try {
    const payload = JSON.parse(atob(result.accessToken.split('.')[1]));
    companyId = payload.companyId || '1';
    roleId = payload.roleId || '1';
  } catch (e) {
    console.error('Failed to decode access token payload:', e);
  }

  const responseData: LoginResponse = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id: result.user.id,
      email: result.user.email || result.user.username,
      firstName,
      lastName,
      companyId,
      roleId,
      roleName: (result.user.role || 'SUPER_ADMIN').toString().trim().toUpperCase(),
      permissions: result.user.permissions || [],
      companyName: result.user.company?.name,
    },
  };

  // Store tokens in localStorage
  localStorage.setItem('access_token', responseData.accessToken);
  localStorage.setItem('refresh_token', responseData.refreshToken);
  localStorage.setItem('user', JSON.stringify(responseData.user));

  return responseData;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  };

  // Update tokens in localStorage
  localStorage.setItem('access_token', responseData.accessToken);
  localStorage.setItem('refresh_token', responseData.refreshToken);

  return responseData;
}

export async function logout(): Promise<void> {
  // Clear local storage regardless of API call success
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Attempt to notify backend (non-blocking)
  const token = localStorage.getItem('refresh_token');
  if (token) {
    fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: token }),
    }).catch(() => {
      // Silently ignore logout API failures - local storage is already cleared
    });
  }
}

export function getStoredUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

export async function getCurrentUser() {
  const json = await fetchWithAuth('/auth/me');
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to fetch current user');
  }
  return json.data;
}

export async function bindDevice(serialNumber: string, model: string) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/device-bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ serialNumber, model }),
  });

  if (!response.ok) {
    throw new Error(`Device bind failed: ${response.statusText}`);
  }

  const json = await response.json();
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

export async function fetchWithAuth(endpoint: string, options?: RequestInit): Promise<any> {
  return fetchWithAuthBase(getApiBaseUrl(), endpoint, options);
}

export async function fetchWithAuthRoot(endpoint: string, options?: RequestInit): Promise<any> {
  return fetchWithAuthBase(getApiRootUrl(), endpoint, options);
}

async function fetchWithAuthBase(baseUrl: string, endpoint: string, options?: RequestInit): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token }),
    ...options?.headers,
  };

  const url = baseUrl + endpoint;

  let response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
  });

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
                ...options,
                headers: retryHeaders,
              });

              if (!retryResponse.ok) {
                let retryErrorData = null;
                try {
                  retryErrorData = await retryResponse.json();
                } catch (_) {}
                reject(new Error(retryErrorData?.error?.message || 'API error: ' + retryResponse.status + ' ' + retryResponse.statusText));
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
            console.log('[API Auth] Attempting token refresh...');
            const refreshResponse = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken: refreshTokenStr }),
            });

            if (refreshResponse.ok) {
              const refreshJson = await refreshResponse.json();
              if (refreshJson.success && refreshJson.data) {
                const newAccessToken = refreshJson.data.accessToken;
                const newRefreshToken = refreshJson.data.refreshToken;

                if (typeof window !== 'undefined') {
                  localStorage.setItem('access_token', newAccessToken);
                  localStorage.setItem('refresh_token', newRefreshToken);
                }

                console.log('[API Auth] Token refresh successful.');
                isRefreshing = false;
                onRefreshed(newAccessToken);
              } else {
                throw new Error('Invalid refresh token response structure');
              }
            } else {
              throw new Error('Refresh token request failed with status: ' + refreshResponse.status);
            }
          } catch (refreshError) {
            isRefreshing = false;
            console.error('[API Auth] Refresh failed, logging out', refreshError);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
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
    console.error('[API Error] Failed: ' + response.status + ' ' + response.statusText + ' on ' + endpoint, JSON.stringify(errorData));

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    throw new Error(errorData?.error?.message || 'API error: ' + response.status + ' ' + response.statusText);
  }

  const data = await response.json();
  return data;
}
