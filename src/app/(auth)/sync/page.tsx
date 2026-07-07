"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Smartphone, CheckCircle, Clock, XCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SyncStatus {
  id: string;
  deviceId: string;
  deviceName: string;
  lastSyncAt?: string;
  status: 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'ERROR';
  pendingChanges: number;
  lastError?: string;
  appVersion?: string;
  batteryLevel?: number;
  createdAt: string;
}

const mockData: SyncStatus[] = [
  {
    id: '1',
    deviceId: 'DEV-001',
    deviceName: 'Scanner Device 1',
    lastSyncAt: '2024-01-15T14:30:00Z',
    status: 'SYNCED',
    pendingChanges: 0,
    appVersion: '1.0.0',
    batteryLevel: 85,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    deviceId: 'DEV-002',
    deviceName: 'Scanner Device 2',
    lastSyncAt: '2024-01-15T14:25:00Z',
    status: 'SYNCING',
    pendingChanges: 15,
    appVersion: '1.0.0',
    batteryLevel: 62,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    deviceId: 'DEV-003',
    deviceName: 'Tablet Device 1',
    lastSyncAt: '2024-01-15T13:00:00Z',
    status: 'OFFLINE',
    pendingChanges: 45,
    appVersion: '1.0.0',
    batteryLevel: 30,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export default function SyncMonitoringPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sync-status', page],
    queryFn: async () => {
      return { data: mockData, meta: { page, pageSize: 20, total: 3, totalPages: 1 } };
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      SYNCED: 'bg-green-100 text-green-800',
      SYNCING: 'bg-blue-100 text-blue-800',
      OFFLINE: 'bg-slate-100 text-slate-800',
      ERROR: 'bg-red-100 text-red-800',
    };
    const icons = {
      SYNCED: <CheckCircle className="w-3 h-3 mr-1" />,
      SYNCING: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
      OFFLINE: <WifiOff className="w-3 h-3 mr-1" />,
      ERROR: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.OFFLINE}`}>
        {icons[status as keyof typeof icons] || icons.OFFLINE}
        {status}
      </span>
    );
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'bg-slate-200';
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const columns = [
    {
      header: 'Device',
      accessorKey: 'deviceName',
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.deviceName}</div>
          <div className="text-xs text-slate-500 font-mono">{row.deviceId}</div>
        </div>
      ),
    },
    {
      header: 'App Version',
      accessorKey: 'appVersion',
      cell: (row: any) => <div className="font-mono">{row.appVersion || '-'}</div>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => getStatusBadge(row.status),
    },
    {
      header: 'Pending Changes',
      accessorKey: 'pendingChanges',
      cell: (row: any) => (
        <div className={row.pendingChanges > 0 ? 'font-medium text-orange-600' : 'text-slate-600'}>
          {row.pendingChanges}
        </div>
      ),
    },
    {
      header: 'Battery',
      accessorKey: 'batteryLevel',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getBatteryColor(row.batteryLevel)}`}
              style={{ width: `${row.batteryLevel || 0}%` }}
            />
          </div>
          <span className="text-xs">{row.batteryLevel || '-'}%</span>
        </div>
      ),
    },
    {
      header: 'Last Sync',
      accessorKey: 'lastSyncAt',
      cell: (row: any) => <div>{row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString() : '-'}</div>,
    },
    {
      header: 'Last Error',
      accessorKey: 'lastError',
      cell: (row: any) => <div className="text-red-600 text-xs max-w-xs truncate">{row.lastError || '-'}</div>,
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
          <h3 className="text-lg font-semibold text-slate-900">Failed to load sync status</h3>
          <p className="text-sm text-slate-500 mt-1">Please check your connection and try again</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const syncStatuses = data?.data || [];
  const meta = data?.meta;

  const filteredSyncStatuses = syncStatuses.filter((sync) => {
    const matchesSearch = sync.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sync.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sync.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onlineCount = syncStatuses.filter(s => s.status !== 'OFFLINE').length;
  const offlineCount = syncStatuses.filter(s => s.status === 'OFFLINE').length;
  const totalPending = syncStatuses.reduce((sum, s) => sum + s.pendingChanges, 0);

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Sync Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor device synchronization status and pending changes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-slate-500">Online Devices</p>
              <p className="text-2xl font-bold text-slate-900">{onlineCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Offline Devices</p>
              <p className="text-2xl font-bold text-slate-900">{offlineCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-slate-500">Pending Changes</p>
              <p className="text-2xl font-bold text-slate-900">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Search by Device Name or ID</Label>
            <Input
              id="search"
              placeholder="Scanner Device 1 or DEV-001..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Status Filter Pill Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {(['ALL', 'SYNCED', 'SYNCING', 'OFFLINE', 'ERROR'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {filteredSyncStatuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Smartphone className="w-12 h-12 mb-2" />
            <p className="text-sm">No devices found</p>
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
                {filteredSyncStatuses.map((sync) => (
                  <tr key={sync.id} className="border-b border-slate-100 hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.accessorKey} className="py-3 px-4 text-sm">
                        {col.cell(sync)}
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
