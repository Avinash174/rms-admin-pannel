"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw, X, Tablet, CheckCircle2, Info, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getDevices, updateDevice } from '@/lib/api/device';
import { Device } from '@/lib/types/device';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<Device | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [confirmDeactivate, setConfirmDeactivate] = useState<{
    isOpen: boolean;
    device: Device | null;
    onConfirm: () => void;
  }>({ isOpen: false, device: null, onConfirm: () => {} });

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['devices', page, searchTerm, modelFilter, statusFilter],
    queryFn: () =>
      getDevices(page, 20, {
        search: searchTerm || undefined,
        model: modelFilter || undefined,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive: boolean } }) => updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsEditDrawerOpen(false);
      setSelectedDevice(null);
      toast.success('Device updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update device');
    },
  });

  const handleToggleActive = (device: Device, nextActive: boolean) => {
    if (!nextActive) {
      setConfirmDeactivate({
        isOpen: true,
        device,
        onConfirm: () => {
          updateMutation.mutate({ id: device.id, data: { isActive: false } });
        },
      });
      return;
    }
    updateMutation.mutate({ id: device.id, data: { isActive: true } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">Loading devices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-900">Failed to load devices</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const devices = data?.data || [];
  const meta = data?.meta;
  const totalCount = meta?.total || devices.length;
  const activeCount = devices.filter((d) => d.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Device Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mobile devices auto-register at login. Deactivating a device blocks future sign-ins.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Devices are registered automatically when operators sign in from the mobile app. You cannot manually create devices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{totalCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{activeCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive</p>
          <h3 className="text-3xl font-extrabold text-rose-600 mt-2">{inactiveCount}</h3>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search serial number..."
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Input
          value={modelFilter}
          onChange={(e) => {
            setModelFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by model..."
          className="w-full md:w-48 h-10 rounded-xl"
        />
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg capitalize ${
                statusFilter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6">
            <Tablet className="w-10 h-10 mb-3" />
            <p className="text-sm font-semibold text-slate-800">No devices found</p>
            <p className="text-xs text-slate-400 mt-1">Devices appear here after mobile app login</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={devices}
            meta={meta}
            onPageChange={setPage}
            onEdit={(device: Device, isToggle?: boolean) => {
              if (isToggle) {
                handleToggleActive(device, !device.isActive);
              } else {
                setSelectedDevice(device);
                setIsEditDrawerOpen(true);
              }
            }}
            onCustomAction={(device: Device) => {
              setSelectedDeviceForDetail(device);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isEditDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsEditDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col p-6 transform transition-transform duration-300 ${isEditDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Edit Device</h3>
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsEditDrawerOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            {selectedDevice && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-bold">Serial Number</p>
                  <p className="font-mono text-sm">{selectedDevice.serialNumber || selectedDevice.deviceId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-bold">Model</p>
                  <p className="text-sm">{selectedDevice.model || '—'}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl">
                  <div>
                    <Label className="text-sm font-bold">Active</Label>
                    <p className="text-xs text-slate-400 mt-1">Deactivating blocks mobile logins from this device</p>
                  </div>
                  <Switch
                    checked={selectedDevice.isActive}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        handleToggleActive(selectedDevice, false);
                      } else {
                        updateMutation.mutate({ id: selectedDevice.id, data: { isActive: true } });
                        setSelectedDevice({ ...selectedDevice, isActive: true });
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col p-6 transform transition-transform duration-300 ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Device Details</h3>
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsDetailsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            {selectedDeviceForDetail && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Serial</span><span className="font-mono font-semibold">{selectedDeviceForDetail.serialNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Model</span><span>{selectedDeviceForDetail.model || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Last User</span><span>{selectedDeviceForDetail.userName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">App Version</span><span className="font-mono">{selectedDeviceForDetail.appVersion || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Last Seen</span><span>{selectedDeviceForDetail.lastSyncedAt ? new Date(selectedDeviceForDetail.lastSyncedAt).toLocaleString() : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={selectedDeviceForDetail.isActive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{selectedDeviceForDetail.isActive ? 'Active' : 'Inactive'}</span></div>
                <Button
                  className="w-full mt-4 rounded-xl"
                  onClick={() => {
                    setSelectedDevice(selectedDeviceForDetail);
                    setIsDetailsOpen(false);
                    setIsEditDrawerOpen(true);
                  }}
                >
                  Edit Device
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeactivate.isOpen}
        onClose={() => setConfirmDeactivate({ isOpen: false, device: null, onConfirm: () => {} })}
        onConfirm={() => {
          confirmDeactivate.onConfirm();
          setConfirmDeactivate({ isOpen: false, device: null, onConfirm: () => {} });
          setIsEditDrawerOpen(false);
        }}
        title="Deactivate Device"
        description={`Deactivating ${confirmDeactivate.device?.serialNumber || 'this device'} will block all future mobile logins from it.`}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
