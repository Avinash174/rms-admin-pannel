import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchAuth(endpoint: string, options?: RequestInit) {
  // Skip API calls for now - return mock response
  return null;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  // Skip API call - mock response
  const response = {
    accessToken: 'mock_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
    user: {
      id: '1',
      email: data.email,
      firstName: 'Admin',
      lastName: 'User',
      companyId: '1',
      roleId: '1',
      roleName: 'Super Administrator'
    }
  };

  // Store tokens in localStorage
  if (response.accessToken) {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  return response;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  // Skip API call - mock response
  const response = {
    accessToken: 'mock_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now()
  };

  // Update tokens in localStorage
  if (response.accessToken) {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
  }

  return response;
}

export async function logout(): Promise<void> {
  // Skip API call - just clear tokens
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
