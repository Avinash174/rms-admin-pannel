"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, AlertCircle, RefreshCw, X, User, CheckCircle2, Info, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/api/client';
import { Client } from '@/lib/types/client';
import { CreateClientData, createClientSchema } from '@/lib/validations/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Details drawer
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clients', page],
    queryFn: () => getClients(page, 20),
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success('Client created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create client');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsFormDrawerOpen(false);
      setSelectedClient(null);
      form.reset();
      toast.success('Client updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update client');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (selectedClientForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedClientForDetail(null);
      }
      toast.success('Client deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete client');
    },
  });

  const form = useForm<CreateClientData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: '',
      code: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
    },
  });

  const handleFormSubmit = (data: CreateClientData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(data);
    } else if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, data });
    }
  };

  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <User className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading clients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load clients</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const clients = data?.data || [];
  const meta = data?.meta;

  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && client.isActive) ||
      (statusFilter === 'INACTIVE' && !client.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-sm text-slate-500">Manage client organizations and contact details.</p>
        </div>
        <Button
          onClick={() => {
            setFormMode('CREATE');
            setSelectedClient(null);
            form.reset({ name: '', code: '', contactEmail: '', contactPhone: '', isActive: true });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Create Client
        </Button>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search client name or code..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
          />
        </div>

        {/* Status Filter Tab Buttons */}
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

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <User className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No results found</p>
              <p className="text-xs text-slate-400">Try altering your keyword or clear current filters</p>
            </div>
            <Button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              variant="outline"
              className="text-xs font-bold text-blue-600 hover:bg-slate-50 border-slate-200 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredClients}
            meta={meta}
            onPageChange={setPage}
            onEdit={(client, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: client.id, data: { isActive: client.isActive } });
              } else {
                setFormMode('EDIT');
                setSelectedClient(client);
                form.reset({
                  name: client.name,
                  code: client.code,
                  contactEmail: client.contactEmail || '',
                  contactPhone: client.contactPhone || '',
                  isActive: client.isActive,
                });
                setIsFormDrawerOpen(true);
              }
            }}
            onDelete={handleDelete}
            onCustomAction={(client) => {
              setSelectedClientForDetail(client);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit Client */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add Client' : 'Edit Client'}
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
                    <Label htmlFor="name">Client Name</Label>
                    <Input id="name" placeholder="Acme Corp" className="h-11 rounded-xl border-slate-200" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Client Code</Label>
                    <Input id="code" placeholder="ACM" className="uppercase h-11 rounded-xl border-slate-200" {...form.register('code')} />
                    {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" placeholder="contact@acme.com" className="h-11 rounded-xl border-slate-200" {...form.register('contactEmail')} />
                    {form.formState.errors.contactEmail && <p className="text-xs text-red-500">{form.formState.errors.contactEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" placeholder="911234567890" className="h-11 rounded-xl border-slate-200" {...form.register('contactPhone')} />
                    {form.formState.errors.contactPhone && <p className="text-xs text-red-500">{form.formState.errors.contactPhone.message}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Status</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Enable or disable operator visibility for this client</p>
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

      {/* SLIDE-OVER DRAWER: Client Details */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Client Insights</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedClientForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md mb-3">
                    {selectedClientForDetail.code}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedClientForDetail.name}</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mt-3 ${
                    selectedClientForDetail.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedClientForDetail.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Info</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Email</span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">{selectedClientForDetail.contactEmail || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Phone</span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">{selectedClientForDetail.contactPhone || '-'}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
