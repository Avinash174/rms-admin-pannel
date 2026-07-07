import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1/admin';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
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
      email: result.user.email,
      firstName,
      lastName,
      companyId,
      roleId,
      roleName: result.user.role || 'Operator',
    },
  };

  // Store tokens in localStorage
  localStorage.setItem('access_token', responseData.accessToken);
  localStorage.setItem('refresh_token', responseData.refreshToken);
  localStorage.setItem('user', JSON.stringify(responseData.user));

  return responseData;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
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
  const token = localStorage.getItem('refresh_token');
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token }),
      });
    } catch (e) {
      console.error('Logout API call failed:', e);
    }
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
