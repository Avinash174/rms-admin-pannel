"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  Plus,
  Users,
  Building2,
  Shield,
  Info,
  ExternalLink,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeaderCard } from '@/components/page-header-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  NotificationItem,
  CreateNotificationRequest
} from '@/lib/api/notification';
import { getUsers } from '@/lib/api/user';
import { getWarehouses } from '@/lib/api/warehouse';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');
  
  // Right-side sheet state for sending notification
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<CreateNotificationRequest['type']>('INVENTORY_PENDING');
  const [recipientType, setRecipientType] = useState<'ALL' | 'USER' | 'ROLE' | 'WAREHOUSE'>('ALL');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Details sheet & Delete confirmation state
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page, searchTerm, typeFilter, readFilter],
    queryFn: () => getNotifications(page, 20, { search: searchTerm, type: typeFilter, readFilter }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list-for-notifications'],
    queryFn: () => getUsers(1, 100, { isActive: true }),
    enabled: isCreateOpen
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list-for-notifications'],
    queryFn: () => getWarehouses(1, 100),
    enabled: isCreateOpen
  });

  const usersList = usersData?.data || [];
  const warehousesList = warehousesData?.data || [];

  const resetForm = () => {
    setNewTitle('');
    setNewMessage('');
    setNewType('INVENTORY_PENDING');
    setRecipientType('ALL');
    setTargetUserId('');
    setTargetRole('');
    setTargetWarehouseId('');
    setCreateError(null);
  };

  const handleCloseAttempt = () => {
    if (newTitle.trim() || newMessage.trim()) {
      setShowDiscardDialog(true);
    } else {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to mark notification as read');
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to mark all notifications as read');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete notification');
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateNotificationRequest) => createNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Notification sent successfully');
    },
    onError: (err: any) => {
      const errorMsg = err?.message || 'Failed to send notification';
      setCreateError(errorMsg);
      toast.error(errorMsg);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newTitle.trim()) {
      setCreateError('Notification title is required');
      return;
    }
    if (!newMessage.trim()) {
      setCreateError('Notification message is required');
      return;
    }
    if (recipientType === 'USER' && !targetUserId) {
      setCreateError('Please select a target user');
      return;
    }

    createMutation.mutate({
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      targetUserId: recipientType === 'USER' ? targetUserId : undefined
    });
  };

  const getActionUrl = (item: NotificationItem): string => {
    if (item.actionUrl) return item.actionUrl;
    const map: Record<string, string> = {
      DUPLICATE_SCAN: '/audit-logs',
      WRONG_LOCATION: '/locations',
      WRONG_BOX: '/boxes',
      INVENTORY_PENDING: '/workflows/inventory-verification',
      SYNC_FAILED: '/sync',
      LOW_BATTERY: '/devices',
      GPS_DISABLED: '/gps',
    };
    return map[item.type] || '/dashboard';
  };

  const getActionLabel = (type: string): string => {
    const map: Record<string, string> = {
      DUPLICATE_SCAN: 'View Logs',
      WRONG_LOCATION: 'View Locations',
      WRONG_BOX: 'View Boxes',
      INVENTORY_PENDING: 'Verify Inventory',
      SYNC_FAILED: 'Sync Status',
      LOW_BATTERY: 'View Devices',
      GPS_DISABLED: 'GPS Tracking',
    };
    return map[type] || 'View Action';
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
      cell: (row: NotificationItem) => {
        const actionUrl = getActionUrl(row);
        const actionLabel = getActionLabel(row.type);
        return (
          <div className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            {actionUrl && (
              <Link href={actionUrl}>
                <button
                  type="button"
                  title={`Navigate to ${actionLabel}`}
                  className="h-8 px-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>{actionLabel}</span>
                </button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedNotification(row);
                setIsDetailsOpen(true);
              }}
              title="View Notification"
              aria-label="View Notification"
              className="h-8 w-8 min-w-[32px] min-h-[32px] p-0 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            >
              <Eye className="w-[18px] h-[18px] shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => !row.isRead && markReadMutation.mutate(row.id)}
              disabled={(markReadMutation.isPending && markReadMutation.variables === row.id) || row.isRead}
              title={row.isRead ? "Already Read" : "Mark as Read"}
              aria-label="Mark as Read"
              className={`h-8 w-8 min-w-[32px] min-h-[32px] p-0 flex items-center justify-center rounded-lg transition-colors shrink-0 ${
                row.isRead
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer'
              }`}
            >
              <Check className="w-[18px] h-[18px] shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteTargetId(row.id);
                setShowDeleteDialog(true);
              }}
              disabled={deleteMutation.isPending && deleteMutation.variables === row.id}
              title="Delete Notification"
              aria-label="Delete Notification"
              className="h-8 w-8 min-w-[32px] min-h-[32px] p-0 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-[18px] h-[18px] shrink-0" />
            </button>
          </div>
        );
      },
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
                    <th
                      key={col.header}
                      className={`py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap ${
                        col.accessorKey === 'actions' ? 'text-right min-w-[280px]' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <tr key={notification.id} className={`hover:bg-slate-50/80 transition-colors ${!notification.isRead ? 'bg-blue-50/20' : ''}`}>
                    {columns.map((col) => (
                      <td
                        key={col.accessorKey}
                        className={`py-3.5 px-4 text-sm ${
                          col.accessorKey === 'actions' ? 'text-right whitespace-nowrap min-w-[280px]' : ''
                        }`}
                      >
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

      {/* Send Notification Right-Side Sheet / Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isCreateOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => !createMutation.isPending && handleCloseAttempt()}
        />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div
            className={`flex w-screen max-w-lg transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isCreateOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Send Notification</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Send a notification to selected users.
                </p>
              </div>
              <Button
                onClick={handleCloseAttempt}
                variant="ghost"
                disabled={createMutation.isPending}
                className="h-9 w-9 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sheet Form Body */}
            <form onSubmit={handleCreateSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {/* Notification Type */}
                <div className="space-y-2">
                  <Label htmlFor="notif-type" className="text-xs font-semibold text-slate-700">Notification Type *</Label>
                  <select
                    id="notif-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CreateNotificationRequest['type'])}
                    disabled={createMutation.isPending}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="INVENTORY_PENDING">Inventory Pending (High Priority)</option>
                    <option value="WRONG_LOCATION">Wrong Location (High Priority)</option>
                    <option value="WRONG_BOX">Wrong Box (High Priority)</option>
                    <option value="SYNC_FAILED">Sync Failed (High Priority)</option>
                    <option value="DUPLICATE_SCAN">Duplicate Scan (Medium Priority)</option>
                    <option value="GPS_DISABLED">GPS Disabled (Medium Priority)</option>
                    <option value="LOW_BATTERY">Low Battery (Low Priority)</option>
                  </select>
                </div>

                {/* Recipient Type Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Recipient Scope *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('ALL');
                        setTargetUserId('');
                      }}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                        recipientType === 'ALL'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users className={`h-4 w-4 shrink-0 ${recipientType === 'ALL' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="text-xs">
                        <div>All Company Users</div>
                        <div className="text-[10px] text-slate-400 font-normal">Broadcast to all active</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecipientType('USER')}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                        recipientType === 'USER'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className={`h-4 w-4 shrink-0 ${recipientType === 'USER' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="text-xs">
                        <div>Specific User</div>
                        <div className="text-[10px] text-slate-400 font-normal">Target single account</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Specific User Dropdown */}
                {recipientType === 'USER' && (
                  <div className="space-y-2">
                    <Label htmlFor="target-user" className="text-xs font-semibold text-slate-700">Select User *</Label>
                    <select
                      id="target-user"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      disabled={createMutation.isPending}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="">Select a user</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || u.username} ({u.roleName || u.roleKey || 'User'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="notif-title" className="text-xs font-semibold text-slate-700">Title *</Label>
                  <Input
                    id="notif-title"
                    placeholder="e.g. Scheduled Maintenance Alert"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={createMutation.isPending}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <Label htmlFor="notif-message" className="text-xs font-semibold text-slate-700">Message *</Label>
                  <textarea
                    id="notif-message"
                    rows={4}
                    placeholder="Enter message details for the notification..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={createMutation.isPending}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Priority & Scope Notice */}
                <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <span className="font-semibold">Recipient Scope:</span>{' '}
                    {recipientType === 'ALL'
                      ? 'This notification will be broadcast to all active users within your organization scope.'
                      : 'This notification will only be delivered to the selected user.'}
                  </div>
                </div>

                {/* Error Banner */}
                {createError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <span className="font-semibold">Submission Error:</span> {createError}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAttempt}
                  disabled={createMutation.isPending}
                  className="h-11 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !newTitle.trim() || !newMessage.trim() || (recipientType === 'USER' && !targetUserId)}
                  className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Notification Details Right-Side Sheet / Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isDetailsOpen && selectedNotification ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setIsDetailsOpen(false)}
        />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div
            className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isDetailsOpen && selectedNotification ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Notification Details</h3>
                  <p className="text-xs text-slate-500">System alert and dispatch information</p>
                </div>
              </div>
              <Button
                onClick={() => setIsDetailsOpen(false)}
                variant="ghost"
                className="h-9 w-9 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer Body */}
            {selectedNotification && (
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {/* Title and Badges */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(selectedNotification.type)}
                    {getPriorityBadge(selectedNotification.priority)}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${selectedNotification.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                      {selectedNotification.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 leading-snug">
                    {selectedNotification.title}
                  </h4>
                </div>

                {/* Message Body */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Message</span>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Info Metadata */}
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-xs shadow-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium text-slate-400">Notification ID</span>
                    <span className="font-mono text-[11px] select-all">{selectedNotification.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium text-slate-400">Dispatched At</span>
                    <span className="font-semibold text-slate-800">{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium text-slate-400">Target Action Module</span>
                    <span className="font-semibold text-blue-600">{getActionLabel(selectedNotification.type)}</span>
                  </div>
                </div>

                {/* Action Button Section */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">Quick Actions</span>
                  <Link href={getActionUrl(selectedNotification)} className="block w-full">
                    <Button className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 gap-2">
                      <span>Navigate to {getActionLabel(selectedNotification.type)}</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>

                  {!selectedNotification.isRead && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        markReadMutation.mutate(selectedNotification.id);
                        setSelectedNotification({ ...selectedNotification, isRead: true });
                      }}
                      disabled={markReadMutation.isPending}
                      className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl gap-2 font-semibold"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as Read</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteTargetId(selectedNotification.id);
                      setShowDeleteDialog(true);
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full h-11 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl gap-2 font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Notification</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discard Confirmation Centered Modal */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Discard changes?"
        description="You have unsaved changes in this notification. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Continue Editing"
        variant="warning"
      />

      {/* Delete Confirmation Centered Modal */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMutation.mutate(deleteTargetId);
            if (selectedNotification?.id === deleteTargetId) {
              setIsDetailsOpen(false);
              setSelectedNotification(null);
            }
          }
          setShowDeleteDialog(false);
          setDeleteTargetId(null);
        }}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
