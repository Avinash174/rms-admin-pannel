"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Bell, CheckCircle, Clock, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isRead: boolean;
  userId?: string;
  createdAt: string;
  readAt?: string;
}

const mockData: Notification[] = [
  {
    id: '1',
    title: 'System Maintenance Scheduled',
    message: 'The system will undergo maintenance on January 20th from 2 AM to 4 AM.',
    type: 'INFO',
    priority: 'MEDIUM',
    isRead: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Low Battery Alert - DEV-003',
    message: 'Device DEV-003 battery level is below 30%. Please charge the device.',
    type: 'WARNING',
    priority: 'HIGH',
    isRead: false,
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: '3',
    title: 'Sync Failed - DEV-002',
    message: 'Device DEV-002 failed to sync. Error: Connection timeout.',
    type: 'ERROR',
    priority: 'URGENT',
    isRead: false,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '4',
    title: 'Inventory Verification Completed',
    message: 'Inventory verification INV-2024-001 has been completed successfully.',
    type: 'SUCCESS',
    priority: 'LOW',
    isRead: true,
    createdAt: '2024-01-14T15:30:00Z',
    readAt: '2024-01-14T15:35:00Z',
  },
];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      return { data: mockData, meta: { page, pageSize: 20, total: 4, totalPages: 1 } };
    },
  });

  const getTypeBadge = (type: string) => {
    const styles = {
      INFO: 'bg-blue-100 text-blue-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      SUCCESS: 'bg-green-100 text-green-800',
    };
    const icons = {
      INFO: <Info className="w-3 h-3 mr-1" />,
      WARNING: <AlertTriangle className="w-3 h-3 mr-1" />,
      ERROR: <XCircle className="w-3 h-3 mr-1" />,
      SUCCESS: <CheckCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type as keyof typeof styles] || styles.INFO}`}>
        {icons[type as keyof typeof icons] || icons.INFO}
        {type}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-slate-100 text-slate-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles] || styles.LOW}`}>
        {priority}
      </span>
    );
  };

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {!row.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
          <div className={`font-medium ${!row.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
            {row.title}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row: any) => getTypeBadge(row.type),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row: any) => getPriorityBadge(row.priority),
    },
    {
      header: 'Message',
      accessorKey: 'message',
      cell: (row: any) => <div className="max-w-md truncate">{row.message}</div>,
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      cell: (row: any) => <div>{new Date(row.createdAt).toLocaleString()}</div>,
    },
    {
      header: 'Status',
      accessorKey: 'isRead',
      cell: (row: any) => (
        <div className={row.isRead ? 'text-slate-500' : 'text-blue-600'}>
          {row.isRead ? 'Read' : 'Unread'}
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

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || notification.type === typeFilter;
    const matchesRead = readFilter === 'ALL' || 
      (readFilter === 'READ' && notification.isRead) ||
      (readFilter === 'UNREAD' && !notification.isRead);
    return matchesSearch && matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage system notifications.</p>
        </div>
        <Button>
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All as Read
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-slate-500">Total Notifications</p>
              <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-slate-500">Unread</p>
              <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-xs text-slate-500">Urgent</p>
              <p className="text-2xl font-bold text-slate-900">{notifications.filter(n => n.priority === 'URGENT').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-xs text-slate-500">Info</p>
              <p className="text-2xl font-bold text-slate-900">{notifications.filter(n => n.type === 'INFO').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Search by Title or Message</Label>
            <Input
              id="search"
              placeholder="System maintenance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {/* Type Filter Pill Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap w-10">Type</span>
              <div className="flex bg-slate-100 p-1 rounded-xl flex-1">
                {(['ALL', 'INFO', 'WARNING', 'ERROR', 'SUCCESS'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all ${
                      typeFilter === type
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Read Status Pill Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap w-10">Read</span>
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

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Bell className="w-12 h-12 mb-2" />
            <p className="text-sm">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  {columns.map((col) => (
                    <th key={col.header} className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="border-b border-slate-100 hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.accessorKey} className="py-3 px-4 text-sm">
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
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600 py-2">
              Page {page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
