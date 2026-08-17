"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Trash2,
  Check,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeaderCard } from '@/components/page-header-card';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  NotificationItem,
  CreateNotificationRequest
} from '@/lib/api/notification';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');
  
  // Modal state for creating notification
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<CreateNotificationRequest['type']>('INVENTORY_PENDING');
  const [targetUserId, setTargetUserId] = useState('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page, searchTerm, typeFilter, readFilter],
    queryFn: () => getNotifications(page, 20, { search: searchTerm, type: typeFilter, readFilter }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateNotificationRequest) => createNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewMessage('');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    createMutation.mutate({
      title: newTitle,
      message: newMessage,
      type: newType,
      targetUserId: targetUserId === 'ALL' ? undefined : targetUserId
    });
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      DUPLICATE_SCAN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      WRONG_LOCATION: 'bg-red-100 text-red-800 border-red-200',
      WRONG_BOX: 'bg-orange-100 text-orange-800 border-orange-200',
      INVENTORY_PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
      SYNC_FAILED: 'bg-rose-100 text-rose-800 border-rose-200',
      LOW_BATTERY: 'bg-amber-100 text-amber-800 border-amber-200',
      GPS_DISABLED: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[type] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-700',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[priority] || styles.LOW}`}>
        {priority}
      </span>
    );
  };

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: (row: NotificationItem) => (
        <div className="flex items-center gap-2">
          {!row.isRead && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 animate-pulse" />}
          <div className={`font-semibold ${!row.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
            {row.title}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row: NotificationItem) => getTypeBadge(row.type),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row: NotificationItem) => getPriorityBadge(row.priority),
    },
    {
      header: 'Message',
      accessorKey: 'message',
      cell: (row: NotificationItem) => <div className="max-w-md truncate text-slate-600">{row.message}</div>,
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      cell: (row: NotificationItem) => (
        <div className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isRead',
      cell: (row: NotificationItem) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${row.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
          {row.isRead ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: NotificationItem) => (
        <div className="flex items-center gap-2">
          {!row.isRead && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => markReadMutation.mutate(row.id)}
              disabled={markReadMutation.isPending}
              title="Mark as Read"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate(row.id)}
            disabled={deleteMutation.isPending}
            title="Delete"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">Failed to load notifications</h3>
          <p className="text-sm text-slate-500 mt-1">Please check your connection and try again</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const notifications = data?.data || [];
  const meta = data?.meta;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Notifications"
        description="View, send, and manage system notifications across mobile and web."
        badge="System Live · Alerts Center"
        icon={Bell}
      >
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
        <Button
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || unreadCount === 0}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All as Read
        </Button>
      </PageHeaderCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Notifications</p>
              <p className="text-2xl font-bold text-slate-900">{meta?.total || notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Unread</p>
              <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Urgent/High</p>
              <p className="text-2xl font-bold text-slate-900">
                {notifications.filter(n => n.priority === 'HIGH' || n.priority === 'URGENT').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">System Alerts</p>
              <p className="text-2xl font-bold text-slate-900">
                {notifications.filter(n => n.type === 'INVENTORY_PENDING' || n.type === 'SYNC_FAILED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search" className="text-xs font-semibold text-slate-600 mb-1 block">Search Notifications</Label>
            <Input
              id="search"
              placeholder="Search title or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {/* Read Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap w-12">Read</span>
              <div className="flex bg-slate-100 p-1 rounded-xl flex-1">
                {(['ALL', 'UNREAD', 'READ'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setReadFilter(status)}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all ${
                      readFilter === status
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Bell className="w-12 h-12 mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {columns.map((col) => (
                    <th key={col.header} className="text-left py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <tr key={notification.id} className={`hover:bg-slate-50/80 transition-colors ${!notification.isRead ? 'bg-blue-50/20' : ''}`}>
                    {columns.map((col) => (
                      <td key={col.accessorKey} className="py-3.5 px-4 text-sm">
                        {col.cell(notification)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Showing page {page} of {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Notification</h3>
                <p className="text-xs text-slate-500 mt-0.5">Broadcast an alert or message to users.</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-xs font-semibold text-slate-700 mb-1 block">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Scheduled System Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-xs font-semibold text-slate-700 mb-1 block">Notification Type</Label>
                <select
                  id="type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CreateNotificationRequest['type'])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INVENTORY_PENDING">INVENTORY_PENDING (High Priority)</option>
                  <option value="WRONG_LOCATION">WRONG_LOCATION (High Priority)</option>
                  <option value="WRONG_BOX">WRONG_BOX (High Priority)</option>
                  <option value="SYNC_FAILED">SYNC_FAILED (High Priority)</option>
                  <option value="DUPLICATE_SCAN">DUPLICATE_SCAN (Medium Priority)</option>
                  <option value="GPS_DISABLED">GPS_DISABLED (Medium Priority)</option>
                  <option value="LOW_BATTERY">LOW_BATTERY (Low Priority)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="message" className="text-xs font-semibold text-slate-700 mb-1 block">Message Content</Label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Enter detailed message text..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Notification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
