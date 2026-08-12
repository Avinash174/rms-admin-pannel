"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw, X, Smartphone, CheckCircle2, Search, ShieldCheck, WifiOff } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getDevices, updateDevice } from '@/lib/api/device';
import { Device } from '@/lib/types/device';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['devices', page, searchTerm, modelFilter, statusFilter],
    queryFn: () =>
      getDevices(page, 20, {
        search: searchTerm || undefined,
        model: modelFilter || undefined,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("Devices list refreshed");
  };

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

  const devices = data?.data || [];
  const meta = data?.meta;
  const totalCount = meta?.total || devices.length;
  const activeCount = devices.filter((d) => d.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="w-full space-y-6 p-6 pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Scanner Devices & Mobile Handhelds</h1>
            <p className="text-xs text-slate-500">Manage registered barcode scanner devices, mobile apps & authorization status</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl h-9 text-xs" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-cyan-600' : ''}`} /> Refresh Devices
        </Button>
      </div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Scanners</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><Smartphone className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Devices</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive Devices</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{inactiveCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><WifiOff className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Authorized</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">100%</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search Serial Number / Model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 border rounded-xl px-3 text-xs bg-slate-50/50"
          >
            <option value="ALL">All Device Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={devices}
          meta={meta ? { page: meta.page, pageSize: meta.pageSize || 20, total: meta.total, totalPages: meta.totalPages } : undefined}
          onPageChange={setPage}
          onEdit={(device: any) => {
            setSelectedDevice(device);
            setIsEditDrawerOpen(true);
          }}
          onDeactivate={(device: any) => handleToggleActive(device, false)}
          onCustomAction={(device: any) => {
            setSelectedDeviceForDetail(device);
            setIsDetailsOpen(true);
          }}
        />
      </div>

      {/* Right Slide-Over Edit Drawer */}
      {isEditDrawerOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">Edit Device Access</h3>
                <button onClick={() => setIsEditDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4 text-xs pt-4">
                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <div><strong>Serial:</strong> {selectedDevice.serialNumber}</div>
                  <div><strong>Model:</strong> {selectedDevice.model}</div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="font-semibold text-slate-700">Device Active Status</label>
                  <Switch
                    checked={selectedDevice.isActive}
                    onCheckedChange={(checked) => setSelectedDevice({ ...selectedDevice, isActive: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsEditDrawerOpen(false)}>Cancel</Button>
              <Button className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700" onClick={() => updateMutation.mutate({ id: selectedDevice.id, data: { isActive: selectedDevice.isActive } })}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Right Slide-Over Details Drawer */}
      {isDetailsOpen && selectedDeviceForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">Device Specifications</h3>
                <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-3 text-xs pt-4">
                <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                  <div><strong>Serial Number:</strong> {selectedDeviceForDetail.serialNumber}</div>
                  <div><strong>Model:</strong> {selectedDeviceForDetail.model}</div>
                  <div><strong>App Version:</strong> {selectedDeviceForDetail.appVersion || 'v1.0.0'}</div>
                  <div><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-md font-bold ${selectedDeviceForDetail.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{selectedDeviceForDetail.isActive ? 'Active' : 'Inactive'}</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsDetailsOpen(false)}>Close Drawer</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDeactivate.isOpen}
        onClose={() => setConfirmDeactivate({ isOpen: false, device: null, onConfirm: () => {} })}
        onConfirm={confirmDeactivate.onConfirm}
        title="Deactivate Device?"
        description={`Are you sure you want to deactivate ${confirmDeactivate.device?.serialNumber}? This scanner will lose sync privileges.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}
