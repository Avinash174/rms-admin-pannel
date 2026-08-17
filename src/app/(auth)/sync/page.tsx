"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Smartphone, CheckCircle, Clock, XCircle, Wifi, WifiOff, History, BatteryCharging, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeaderCard } from '@/components/page-header-card';
import { toast } from 'sonner';
import { getSyncDeviceStatuses, DeviceSyncStatus } from '@/lib/api/sync';

export default function SyncMonitoringPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['sync-status', page],
    queryFn: () => getSyncDeviceStatuses(page, 20),
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("Sync state refreshed");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      SYNCED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      SYNCING: 'bg-blue-50 text-blue-600 border-blue-200',
      OFFLINE: 'bg-slate-100 text-slate-600 border-slate-200',
      ERROR: 'bg-rose-50 text-rose-600 border-rose-200',
    };
    const icons = {
      SYNCED: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
      SYNCING: <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />,
      OFFLINE: <WifiOff className="w-3.5 h-3.5 mr-1" />,
      ERROR: <XCircle className="w-3.5 h-3.5 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${styles[status as keyof typeof styles] || styles.OFFLINE}`}>
        {icons[status as keyof typeof icons] || icons.OFFLINE}
        {status}
      </span>
    );
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'bg-slate-200';
    if (level > 50) return 'bg-emerald-500';
    if (level > 20) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const allItems = data?.data || [];
  const items = allItems.filter((item) => {
    const matchesSearch = !searchTerm || item.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) || item.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const syncedCount = allItems.filter(d => d.status === 'SYNCED').length;
  const syncingCount = allItems.filter(d => d.status === 'SYNCING').length;
  const offlineCount = allItems.filter(d => d.status === 'OFFLINE').length;

  return (
    <div className="w-full space-y-6 p-6 pb-16">
      {/* Top Header Card */}
      <PageHeaderCard
        title="Sync Monitor & Offline Buffer"
        description="Real-time sync queue monitoring for mobile scanner devices & offline event logs"
        badge="Edge & Telemetry · Sync Engine"
        icon={History}
      >
        <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-xl h-10 px-3.5 text-xs font-medium transition backdrop-blur-md" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-indigo-300' : ''}`} /> Refresh Sync State
        </Button>
      </PageHeaderCard>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fully Synced</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{syncedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syncing Active</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{syncingCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wifi className="h-6 w-6 animate-pulse" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offline Devices</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{offlineCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><WifiOff className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Buffer</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">46 items</h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Clock className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search Device ID / Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm h-9 text-xs rounded-xl"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 border rounded-xl px-3 text-xs bg-slate-50/50 font-medium"
        >
          <option value="ALL">All Sync States</option>
          <option value="SYNCED">SYNCED</option>
          <option value="SYNCING">SYNCING</option>
          <option value="OFFLINE">OFFLINE</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px]">
            <tr>
              <th className="p-3">Device Code</th>
              <th className="p-3">Device Name</th>
              <th className="p-3">Sync Status</th>
              <th className="p-3">Pending Buffer</th>
              <th className="p-3">Battery Level</th>
              <th className="p-3">App Version</th>
              <th className="p-3">Last Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="p-3 font-mono font-bold text-slate-900">{row.deviceId}</td>
                <td className="p-3 font-semibold text-slate-800">{row.deviceName}</td>
                <td className="p-3">{getStatusBadge(row.status)}</td>
                <td className="p-3 font-bold text-slate-700">{row.pendingChanges} queued</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${getBatteryColor(row.batteryLevel)}`} style={{ width: `${row.batteryLevel || 0}%` }} />
                    </div>
                    <span className="font-semibold text-slate-700">{row.batteryLevel}%</span>
                  </div>
                </td>
                <td className="p-3 text-slate-500">{row.appVersion}</td>
                <td className="p-3 text-slate-400">{row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleTimeString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
