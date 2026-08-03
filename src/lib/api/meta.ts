import { fetchWithAuthRoot } from './auth';

export interface PermissionsMatrix {
  roles: string[];
  permissions: Array<{ key: string; description: string }>;
  matrix: Record<string, Record<string, boolean>>;
}

export async function getPermissionsMatrix(): Promise<PermissionsMatrix> {
  const response = await fetchWithAuthRoot('/meta/permissions');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch permissions matrix');
}
