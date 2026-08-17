import { fetchWithAuth } from './auth';

export interface NotificationItem {
  id: string;
  type: 'DUPLICATE_SCAN' | 'WRONG_LOCATION' | 'WRONG_BOX' | 'INVENTORY_PENDING' | 'SYNC_FAILED' | 'LOW_BATTERY' | 'GPS_DISABLED';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  actionUrl?: string | null;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'DUPLICATE_SCAN' | 'WRONG_LOCATION' | 'WRONG_BOX' | 'INVENTORY_PENDING' | 'SYNC_FAILED' | 'LOW_BATTERY' | 'GPS_DISABLED';
  targetUserId?: string;
}

export async function getNotifications(
  page: number = 1,
  limit: number = 20,
  filters?: { search?: string; type?: string; readFilter?: string }
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    adminView: 'true',
    ...(filters?.search && { search: filters.search }),
    ...(filters?.type && filters.type !== 'ALL' && { type: filters.type })
  });

  if (filters?.readFilter === 'READ') {
    params.set('isRead', 'true');
  } else if (filters?.readFilter === 'UNREAD') {
    params.set('isRead', 'false');
  }

  const response = await fetchWithAuth(`/notifications?${params.toString()}`);
  const items = Array.isArray(response.data) ? response.data : [];

  return {
    data: items,
    meta: {
      page: response.meta?.page || page,
      pageSize: response.meta?.limit || limit,
      total: response.meta?.total || items.length,
      totalPages: response.meta?.totalPages || 1
    }
  };
}

export async function createNotification(payload: CreateNotificationRequest): Promise<any> {
  const response = await fetchWithAuth('/notifications', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function markAsRead(notificationId: string): Promise<any> {
  const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
    method: 'PUT'
  });
  return response.data;
}

export async function markAllAsRead(): Promise<any> {
  const response = await fetchWithAuth('/notifications/read-all', {
    method: 'PUT'
  });
  return response.data;
}

export async function deleteNotification(notificationId: string): Promise<any> {
  const response = await fetchWithAuth(`/notifications/${notificationId}`, {
    method: 'DELETE'
  });
  return response.data;
}
