"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, AlertCircle, RefreshCw, X, Tablet, CheckCircle2, Info, User, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getDevices, createDevice, updateDevice, deleteDevice } from '@/lib/api/device';
import { Device } from '@/lib/types/device';
import { CreateDeviceData, createDeviceSchema } from '@/lib/validations/device';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Details drawer
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<Device | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['devices', page],
    queryFn: () => getDevices(page, 20),
  });

  const createMutation = useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success('Device created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create device');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsFormDrawerOpen(false);
      setSelectedDevice(null);
      form.reset();
      toast.success('Device updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update device');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      if (selectedDeviceForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedDeviceForDetail(null);
      }
      toast.success('Device deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete device');
    },
  });

  const form = useForm<CreateDeviceData>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      deviceId: '',
      name: '',
      type: 'SCANNER',
      model: '',
      serialNumber: '',
      userId: '',
      isActive: true,
    },
  });

  const handleFormSubmit = (data: CreateDeviceData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(data);
    } else if (selectedDevice) {
      updateMutation.mutate({ id: selectedDevice.id, data });
    }
  };

  const handleDelete = (device: Device) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Device',
      description: `Are you sure you want to delete device ${device.name}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(device.id);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Tablet className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading devices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load devices</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const devices = data?.data || [];
  const meta = data?.meta;

  const totalCount = devices.length;
  const activeCount = devices.filter(d => d.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const filteredDevices = devices.filter((d) => {
    const matchesSearch = !searchTerm ||
      d.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && d.isActive) ||
      (statusFilter === 'INACTIVE' && !d.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Device Registry</h1>
          <p className="text-sm text-slate-500 mt-1">Manage mobile scanning devices and operator terminals.</p>
        </div>
        <Button 
          onClick={() => {
            setFormMode('CREATE');
            setSelectedDevice(null);
            form.reset({
              deviceId: '',
              name: '',
              type: 'SCANNER',
              model: '',
              serialNumber: '',
              userId: '',
              isActive: true,
            });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Register Device
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Terminals</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Tablet className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Active hand-held scan systems
          </div>
        </div>

        {/* Active */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online Devices</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeCount}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Fully active terminals
          </div>
        </div>

        {/* Suspended */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offline Devices</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <X className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Offline or locked terminals
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by serial or model..." className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm" />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`flex-1 md:flex-none px-5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all capitalize ${statusFilter === status ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>{status.toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm">
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Tablet className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No devices found</p>
              <p className="text-xs text-slate-400">Add a new device to start registering physical barcode terminals</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredDevices}
            meta={meta}
            onPageChange={setPage}
            onEdit={(device: Device, isToggle?: boolean) => {
              if (isToggle) {
                updateMutation.mutate({ id: device.id, data: device });
              } else {
                setSelectedDevice(device);
                setFormMode('EDIT');
                form.reset({
                  deviceId: device.deviceId,
                  name: device.name,
                  type: device.type,
                  model: device.model || '',
                  serialNumber: device.serialNumber || '',
                  userId: device.userId || '',
                  isActive: device.isActive,
                });
                setIsFormDrawerOpen(true);
              }
            }}
            onDelete={handleDelete}
            onCustomAction={(device: Device) => {
              setSelectedDeviceForDetail(device);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit Device */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tablet className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Register Device' : 'Edit Device'}
                </h3>
              </div>
              <Button onClick={() => setIsFormDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceId">Device ID</Label>
                    <Input id="deviceId" disabled={formMode === 'EDIT'} placeholder="DEV-909" className="h-11 rounded-xl border-slate-200 uppercase font-mono" {...form.register('deviceId')} />
                    {form.formState.errors.deviceId && <p className="text-xs text-red-500">{form.formState.errors.deviceId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Friendly Name</Label>
                    <Input id="name" placeholder="Honeywell Scan 1" className="h-11 rounded-xl border-slate-200" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Device Type</Label>
                  <Select 
                    defaultValue={form.watch('type')} 
                    onValueChange={(val: 'SCANNER' | 'PHONE' | 'TABLET' | 'OTHER') => form.setValue('type', val)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCANNER">Scanner</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="TABLET">Tablet</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="EDA51" className="h-11 rounded-xl border-slate-200" {...form.register('model')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input id="serialNumber" placeholder="SN-928928392" className="h-11 rounded-xl border-slate-200 font-mono" {...form.register('serialNumber')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId">Assigned User ID (optional)</Label>
                  <Input id="userId" placeholder="Assign target operator user id" className="h-11 rounded-xl border-slate-200" {...form.register('userId')} />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Status</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Enable or lock sync access for this device</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                </div>

              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsFormDrawerOpen(false)} className="rounded-xl border-slate-200 h-11">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 h-11 px-5"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: Device Details */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tablet className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Device Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedDeviceForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md mb-3">
                    {selectedDeviceForDetail.name[0]}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedDeviceForDetail.name}</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mt-3 ${
                    selectedDeviceForDetail.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedDeviceForDetail.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                 <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Info</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Device ID</span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">{selectedDeviceForDetail.deviceId}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Model</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedDeviceForDetail.model || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Serial Number</span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">{selectedDeviceForDetail.serialNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">User Assigned</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedDeviceForDetail.userName || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">App Version</span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">{selectedDeviceForDetail.appVersion || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    onClick={() => {
                      setSelectedDevice(selectedDeviceForDetail);
                      setFormMode('EDIT');
                      form.reset({
                        deviceId: selectedDeviceForDetail.deviceId,
                        name: selectedDeviceForDetail.name,
                        type: selectedDeviceForDetail.type,
                        model: selectedDeviceForDetail.model || '',
                        serialNumber: selectedDeviceForDetail.serialNumber || '',
                        userId: selectedDeviceForDetail.userId || '',
                        isActive: selectedDeviceForDetail.isActive,
                      });
                      setIsDetailsOpen(false);
                      setIsFormDrawerOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Device
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedDeviceForDetail)}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Device
                  </Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDelete.title}
        description={confirmDelete.description}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
