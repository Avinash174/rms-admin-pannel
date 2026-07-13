"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, AlertCircle, RefreshCw, X, Archive, CheckCircle2, Info, FileText, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getBoxes, createBox, updateBox, deleteBox } from '@/lib/api/box';
import { Box as BoxType } from '@/lib/types/box';
import { CreateBoxData, createBoxSchema } from '@/lib/validations/box';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getClients } from '@/lib/api/client';
import { getDepartments } from '@/lib/api/department';
import { getAllLocations } from '@/lib/api/location';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BoxesPage() {
  const [page, setPage] = useState(1);
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedBox, setSelectedBox] = useState<BoxType | null>(null);
  
  // Details drawer
  const [selectedBoxForDetail, setSelectedBoxForDetail] = useState<BoxType | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['boxes', page],
    queryFn: () => getBoxes(page, 20),
  });

  const createMutation = useMutation({
    mutationFn: createBox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success('Box created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create box');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBox(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setIsFormDrawerOpen(false);
      setSelectedBox(null);
      form.reset();
      toast.success('Box updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update box');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      if (selectedBoxForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedBoxForDetail(null);
      }
      toast.success('Box deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete box');
    },
  });

  const form = useForm<CreateBoxData>({
    resolver: zodResolver(createBoxSchema),
    defaultValues: {
      barcode: '',
      name: '',
      description: '',
      year: new Date().getFullYear(),
      locationId: '',
      clientId: '',
      departmentId: '',
      isActive: true,
    },
  });

  const selectedClientId = form.watch('clientId');

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients(1, 100),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-for-client', selectedClientId],
    queryFn: () => getDepartments(selectedClientId, 1, 100),
    enabled: !!selectedClientId,
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations-all'],
    queryFn: () => getAllLocations(),
  });

  const clients = clientsData?.data || [];
  const departments = departmentsData?.data || [];
  const locations = locationsData?.data || [];

  const handleFormSubmit = (data: CreateBoxData) => {
    const { isActive, name, ...rest } = data;
    const apiData = {
      ...rest,
      description: data.description || name || '',
      status: isActive ? 'ACTIVE' as const : 'IN_TRANSIT' as const,
    };

    if (formMode === 'CREATE') {
      createMutation.mutate(apiData as any);
    } else if (selectedBox) {
      updateMutation.mutate({ id: selectedBox.id, data: apiData as any });
    }
  };

  const handleDelete = (box: BoxType) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Box',
      description: `Are you sure you want to delete box ${box.barcode}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(box.id);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Archive className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading boxes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load boxes</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const boxes = data?.data || [];
  const meta = data?.meta;

  const totalCount = boxes.length;
  const activeCount = boxes.filter(b => b.status === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;

  const filteredBoxes = boxes.filter((b) => {
    const matchesSearch = !searchTerm ||
      b.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const isActive = b.status === 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Box Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage physical box storage records containing folder details.</p>
        </div>
        <Button 
          onClick={() => {
            setFormMode('CREATE');
            setSelectedBox(null);
            form.reset({
              barcode: '',
              name: '',
              description: '',
              year: new Date().getFullYear(),
              locationId: '',
              clientId: '',
              departmentId: '',
              isActive: true,
            });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Add Box
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Boxes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Archive className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Physical box packages registered
          </div>
        </div>

        {/* Active */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Boxes</p>
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
            Active container slots
          </div>
        </div>

        {/* Suspended */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive Boxes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <X className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Offline or suspended boxes
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by barcode or name..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
          />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 md:flex-none px-5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all capitalize ${
                statusFilter === status
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm">
        {filteredBoxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Archive className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No boxes found</p>
              <p className="text-xs text-slate-400">Add a new box to start storing folders</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredBoxes}
            meta={meta}
            onPageChange={setPage}
            onEdit={(box, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: box.id, data: { status: box.status } });
              } else {
                setSelectedBox(box);
                setFormMode('EDIT');
                form.reset({
                  barcode: box.barcode,
                  name: box.description || '',
                  description: box.description || '',
                  year: new Date().getFullYear(),
                  locationId: box.currentLocationId || '',
                  clientId: box.clientId,
                  departmentId: box.departmentId || '',
                  isActive: box.status === 'ACTIVE',
                });
                setIsFormDrawerOpen(true);
              }
            }}
            onDelete={handleDelete}
            onCustomAction={(box) => {
              setSelectedBoxForDetail(box);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit Box */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add Box' : 'Edit Box'}
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
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" placeholder="BOX-101" className="h-11 rounded-xl border-slate-200 uppercase font-mono" {...form.register('barcode')} />
                    {form.formState.errors.barcode && <p className="text-xs text-red-500">{form.formState.errors.barcode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Box Name</Label>
                    <Input id="name" placeholder="Audit Records" className="h-11 rounded-xl border-slate-200" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" type="number" placeholder="2026" className="h-11 rounded-xl border-slate-200" {...form.register('year', { valueAsNumber: true })} />
                    {form.formState.errors.year && <p className="text-xs text-red-500">{form.formState.errors.year.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationId">Storage Location</Label>
                    <Select 
                      value={form.watch('locationId') || 'none'} 
                      onValueChange={(val) => form.setValue('locationId', val === 'none' ? '' : val)}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Unassigned</SelectItem>
                        {locations.map((loc: any) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.barcode} ({loc.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.locationId && <p className="text-xs text-red-500">{form.formState.errors.locationId.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <Select 
                      value={form.watch('clientId') || undefined} 
                      onValueChange={(val) => {
                        form.setValue('clientId', val);
                        form.setValue('departmentId', ''); // Reset department
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.clientId && <p className="text-xs text-red-500">{form.formState.errors.clientId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department (optional)</Label>
                    <Select 
                      value={form.watch('departmentId') || 'none'} 
                      onValueChange={(val) => form.setValue('departmentId', val === 'none' ? '' : val)}
                      disabled={!selectedClientId}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200">
                        <SelectValue placeholder={selectedClientId ? "Select department" : "Select client first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="Specify physical attributes..." className="h-11 rounded-xl border-slate-200" {...form.register('description')} />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Status</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Enable or disable operator visibility for this box</p>
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

      {/* SLIDE-OVER DRAWER: Box Details */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Box Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedBoxForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md mb-3">
                    {selectedBoxForDetail.barcode}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedBoxForDetail.description || 'No Description'}</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mt-3 ${
                    selectedBoxForDetail.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedBoxForDetail.status === 'ACTIVE' ? 'In Warehouse' : 'Checked Out'}
                  </span>
                </div>

                 <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Info</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Client</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedBoxForDetail.clientName || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Department</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedBoxForDetail.departmentName || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Location</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedBoxForDetail.locationName || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">File Count</span>
                      <span className="text-xs font-semibold text-slate-705 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-450" />
                        {selectedBoxForDetail.fileCount || 0} files
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Description</span>
                      <span className="text-xs font-semibold text-slate-700 text-right">{selectedBoxForDetail.description || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    onClick={() => {
                      setSelectedBox(selectedBoxForDetail);
                      setFormMode('EDIT');
                      form.reset({
                        barcode: selectedBoxForDetail.barcode,
                        name: selectedBoxForDetail.description || '',
                        description: selectedBoxForDetail.description || '',
                        year: new Date().getFullYear(),
                        locationId: selectedBoxForDetail.currentLocationId || '',
                        clientId: selectedBoxForDetail.clientId,
                        departmentId: selectedBoxForDetail.departmentId || '',
                        isActive: selectedBoxForDetail.status === 'ACTIVE',
                      });
                      setIsDetailsOpen(false);
                      setIsFormDrawerOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Box
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedBoxForDetail)}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Box
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
