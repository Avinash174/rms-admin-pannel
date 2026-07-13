"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, AlertCircle, RefreshCw, X, Building, MapPin, Phone, CheckCircle2, Info, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/lib/api/warehouse';
import { getSites } from '@/lib/api/site';
import { Warehouse } from '@/lib/types/warehouse';
import { CreateWarehouseData, createWarehouseSchema } from '@/lib/validations/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function WarehousesPage() {
  const [page, setPage] = useState(1);
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Details panel state
  const [selectedWarehouseForDetail, setSelectedWarehouseForDetail] = useState<Warehouse | null>(null);
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
    queryKey: ['warehouses', page],
    queryFn: () => getWarehouses(page, 20),
  });

  const { data: sitesData } = useQuery({
    queryKey: ['sites-all'],
    queryFn: () => getSites(1, 100),
  });
  const sites = sitesData?.data || [];

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success('Warehouse created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create warehouse');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsFormDrawerOpen(false);
      setSelectedWarehouse(null);
      form.reset();
      toast.success('Warehouse updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update warehouse');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    },
  });

  const form = useForm<CreateWarehouseData>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: undefined,
      phone: '',
      siteId: '',
      isActive: true,
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Building className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading warehouses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load warehouses</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const warehouses = data?.data || [];
  const meta = data?.meta;

  const totalCount = warehouses.length;
  const activeCount = warehouses.filter(w => w.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const filteredWarehouses = warehouses.filter((w) => {
    const matchesSearch = !searchTerm ||
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && w.isActive) ||
      (statusFilter === 'INACTIVE' && !w.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleFormSubmit = (data: CreateWarehouseData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(data);
    } else if (selectedWarehouse) {
      updateMutation.mutate({ id: selectedWarehouse.id, data });
    }
  };

  const handleDelete = (warehouse: Warehouse) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Warehouse',
      description: `Are you sure you want to delete warehouse ${warehouse.name}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(warehouse.id);
      },
    });
  };

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Warehouse Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage warehouse records within company sites.</p>
        </div>
        <Button 
          onClick={() => {
            setFormMode('CREATE');
            setSelectedWarehouse(null);
            form.reset({
              name: '',
              code: '',
              address: '',
              city: '',
              state: '',
              country: '',
              zipCode: undefined,
              phone: '',
              siteId: '',
              isActive: true,
            });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Add Warehouse
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Warehouses</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Building className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Physical warehouse sites registered
          </div>
        </div>

        {/* Active */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Sites</p>
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
            Active status operational
          </div>
        </div>

        {/* Inactive */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suspended Sites</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <X className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Offline or suspended sites
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or code..." className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm" />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`flex-1 md:flex-none px-5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all capitalize ${statusFilter === status ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>{status.toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm">
        {filteredWarehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Building className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No warehouses found</p>
              <p className="text-xs text-slate-400">Add a new warehouse to start managing spatial hierarchy</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredWarehouses}
            meta={meta}
            onPageChange={setPage}
            onEdit={(warehouse) => {
              setSelectedWarehouse(warehouse);
              setFormMode('EDIT');
              form.reset({
                name: warehouse.name,
                code: warehouse.code,
                address: warehouse.address || '',
                city: warehouse.city || '',
                state: warehouse.state || '',
                country: warehouse.country || '',
                zipCode: warehouse.zipCode || undefined,
                phone: warehouse.phone || '',
                siteId: warehouse.siteId || '',
                isActive: warehouse.isActive,
              });
              setIsFormDrawerOpen(true);
            }}
            onDelete={handleDelete}
            onCustomAction={(warehouse) => {
              setSelectedWarehouseForDetail(warehouse);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit Warehouse */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add Warehouse' : 'Edit Warehouse'}
                </h3>
              </div>
              <Button 
                onClick={() => setIsFormDrawerOpen(false)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Name and Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Warehouse Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Main Warehouse" 
                      className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                      {...form.register('name')} 
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Warehouse Code</Label>
                    <Input 
                      id="code" 
                      placeholder="MW" 
                      className="uppercase h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                      {...form.register('code')} 
                    />
                    {form.formState.errors.code && (
                      <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
                    )}
                  </div>
                </div>

                {/* Site Selection */}
                <div className="space-y-2">
                  <Label htmlFor="siteId">Site *</Label>
                  <select
                    id="siteId"
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('siteId')}
                  >
                    <option value="">Select a site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.siteId && (
                    <p className="text-xs text-red-500">{form.formState.errors.siteId.message}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    placeholder="789 Industrial Blvd" 
                    className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                    {...form.register('address')} 
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      placeholder="New York" 
                      className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                      {...form.register('city')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      placeholder="NY" 
                      className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                      {...form.register('state')} 
                    />
                  </div>
                </div>

                {/* Country and ZipCode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      placeholder="USA" 
                      className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                      {...form.register('country')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input 
                      id="zipCode" 
                      placeholder="10003" 
                      className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                      {...form.register('zipCode', { setValueAs: (v) => v === '' ? undefined : Number(v) })} 
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Contact</Label>
                  <Input 
                    id="phone" 
                    placeholder="+1 234-567-8902" 
                    className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500" 
                    {...form.register('phone')} 
                  />
                </div>

                {/* Active Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Status</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Enable or disable operator visibility for this warehouse</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormDrawerOpen(false)}
                  className="rounded-xl border-slate-200 h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 h-11 px-5"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: Warehouse Details Panel */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Warehouse Insights</h3>
              </div>
              <Button 
                onClick={() => setIsDetailsOpen(false)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Content */}
            {selectedWarehouseForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Brand Showcase */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-md border-4 border-white mb-3">
                    {selectedWarehouseForDetail.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 leading-tight">{selectedWarehouseForDetail.name}</h4>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider font-mono border border-slate-200">
                      {selectedWarehouseForDetail.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedWarehouseForDetail.isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {selectedWarehouseForDetail.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>

                {/* Information Details */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">General Information</h5>
                  
                  <div className="grid grid-cols-1 gap-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Warehouse ID</span>
                      <span className="font-mono text-slate-800 font-bold select-all">{selectedWarehouseForDetail.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Associated Site</span>
                      <span className="text-slate-800 font-bold">{selectedWarehouseForDetail.site?.name || 'Unassigned'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Contact Phone</span>
                      <span className="text-slate-800 font-bold">{selectedWarehouseForDetail.phone || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Created At</span>
                      <span className="text-slate-800 font-bold">{new Date(selectedWarehouseForDetail.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location Address</h5>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3.5 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 font-semibold">Street Address</span>
                      <span className="text-slate-800 font-bold max-w-[200px] text-right">{selectedWarehouseForDetail.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">City</span>
                      <span className="text-slate-800 font-bold">{selectedWarehouseForDetail.city || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">State/Region</span>
                      <span className="text-slate-800 font-bold">{selectedWarehouseForDetail.state || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Country</span>
                      <span className="text-slate-800 font-bold">{selectedWarehouseForDetail.country || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Zip Code</span>
                      <span className="text-slate-800 font-bold">{selectedWarehouseForDetail.zipCode || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Storage Quick View Actions */}
                <div className="pt-2 space-y-3">
                  <Button 
                    onClick={() => {
                      setIsDetailsOpen(false);
                      window.location.href = `/warehouses/${selectedWarehouseForDetail.id}/rooms`;
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white rounded-xl h-11 flex items-center justify-center font-semibold text-xs tracking-wider uppercase transition-colors"
                  >
                    Manage Spatial Rooms
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedWarehouse(selectedWarehouseForDetail);
                      setFormMode('EDIT');
                      form.reset({
                        name: selectedWarehouseForDetail.name,
                        code: selectedWarehouseForDetail.code,
                        address: selectedWarehouseForDetail.address || '',
                        city: selectedWarehouseForDetail.city || '',
                        state: selectedWarehouseForDetail.state || '',
                        country: selectedWarehouseForDetail.country || '',
                        zipCode: selectedWarehouseForDetail.zipCode || undefined,
                        phone: selectedWarehouseForDetail.phone || '',
                        siteId: selectedWarehouseForDetail.siteId || '',
                        isActive: selectedWarehouseForDetail.isActive,
                      });
                      setIsDetailsOpen(false);
                      setIsFormDrawerOpen(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Warehouse
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedWarehouseForDetail)}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Warehouse
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
