"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Loader2, AlertCircle, RefreshCw, Search, Building2, 
  CheckCircle2, XCircle, Info, Sparkles, X, Calendar, 
  Activity, ArrowRight, ShieldCheck, KeyRound, Globe, Tag
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/api/company';
import { Company } from '@/lib/types/company';
import { CreateCompanyFormData, createCompanySchema } from '@/lib/validations/company';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Details panel state
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState<Company | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['companies', page],
    queryFn: () => getCompanies(page, 20),
  });

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsFormDrawerOpen(false);
      createForm.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsFormDrawerOpen(false);
      setSelectedCompany(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (selectedCompanyForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedCompanyForDetail(null);
      }
    },
  });

  const createForm = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      code: '',
      isActive: true,
    },
  });

  const handleFormSubmit = (data: CreateCompanyFormData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(data);
    } else if (selectedCompany) {
      updateMutation.mutate({ id: selectedCompany.id, data });
    }
  };

  const handleDelete = (company: Company) => {
    if (confirm(`Are you sure you want to delete ${company.name}?`)) {
      deleteMutation.mutate(company.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Building2 className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading company records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="text-center max-w-sm space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Failed to load companies</h3>
          <p className="text-sm text-slate-500">Please check your connection or authentication status and try again</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const companies = data?.data || [];
  const meta = data?.meta;

  const filteredCompanies = companies.filter((company: Company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && company.isActive) ||
      (statusFilter === 'INACTIVE' && !company.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalCount = meta?.total || companies.length;
  const activeCount = companies.filter(c => c.isActive).length;
  const inactiveCount = companies.filter(c => !c.isActive).length;

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Companies</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Multi-Tenant System
            </span>
          </div>
          <p className="text-sm text-slate-500">Create, manage, and configure individual enterprise client tenants and system structures.</p>
        </div>
        <Button
          onClick={() => {
            setFormMode('CREATE');
            setSelectedCompany(null);
            createForm.reset({ name: '', code: '', isActive: true });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Create Company
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Companies */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Tenants</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Building2 className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Managed multi-tenant records
          </div>
        </div>

        {/* Active Companies */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Status</p>
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
            Fully active and synchronizing data
          </div>
        </div>

        {/* Inactive Companies */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suspended Access</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <XCircle className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-450 text-rose-500" /> Logins and API routes restricted
          </div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company name or code..."
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Building2 className="w-10 h-10 text-slate-350 stroke-[1.5]" />
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
            data={filteredCompanies}
            meta={meta}
            onPageChange={setPage}
            onEdit={(company, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: company.id, data: { isActive: company.isActive } });
              } else {
                setFormMode('EDIT');
                setSelectedCompany(company);
                createForm.reset({
                  name: company.name,
                  code: company.code,
                  isActive: company.isActive,
                });
                setIsFormDrawerOpen(true);
              }
            }}
            onDelete={handleDelete}
            onCustomAction={(company) => {
              setSelectedCompanyForDetail(company);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit Company */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add Company Tenant' : 'Edit Company Tenant'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formMode === 'CREATE' ? 'Deploy a brand new tenant environment.' : 'Modify tenant details and configurations.'}
                </p>
              </div>
              <Button 
                onClick={() => setIsFormDrawerOpen(false)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Content */}
            <form onSubmit={createForm.handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Company Name</Label>
                  <Input
                    id="name"
                    {...createForm.register('name')}
                    placeholder="e.g. Acme Records Group"
                    className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Company Code</Label>
                  <Input
                    id="code"
                    {...createForm.register('code')}
                    placeholder="e.g. ACME"
                    className="h-11 rounded-xl border-slate-200 uppercase focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-mono tracking-wider transition-all"
                  />
                  {createForm.formState.errors.code && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-100/80">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Operational Status</Label>
                    <p className="text-xs text-slate-500">Allow instant systems sync and authorization</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={createForm.watch('isActive')}
                    onCheckedChange={(checked) => createForm.setValue('isActive', checked)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDrawerOpen(false)}
                  className="flex-1 rounded-xl h-11 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/10 transition-all"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    formMode === 'CREATE' ? 'Save Tenant' : 'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: Company Details Panel */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-650 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Tenant Insights</h3>
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
            {selectedCompanyForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Brand Showcase */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-md border-4 border-white mb-3">
                    {selectedCompanyForDetail.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 leading-tight">{selectedCompanyForDetail.name}</h4>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-650 text-xs font-bold uppercase tracking-wider font-mono border border-slate-205 border-slate-200">
                      {selectedCompanyForDetail.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedCompanyForDetail.isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedCompanyForDetail.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {selectedCompanyForDetail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Metadata Properties */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Config</h5>
                  
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Tenant ID</span>
                      </div>
                      <span className="text-xs font-mono text-slate-700 select-all font-bold">{selectedCompanyForDetail.id}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Acronym/Code</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 uppercase font-mono">{selectedCompanyForDetail.code}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Registration Date</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(selectedCompanyForDetail.createdAt).toLocaleString(undefined, { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Last Modified</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(selectedCompanyForDetail.updatedAt).toLocaleString(undefined, { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Subsystem Connections */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subsystems & Hierarchy</h5>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100/80 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">Associated Branches</p>
                          <p className="text-[10px] text-slate-400">Manage site subdivisions under this tenant</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100/80 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-50 text-violet-650 text-violet-600 rounded-lg group-hover:scale-105 transition-transform">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">Operational Logins</p>
                          <p className="text-[10px] text-slate-400">View users authorized with company domain</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    onClick={() => {
                      setFormMode('EDIT');
                      setSelectedCompany(selectedCompanyForDetail);
                      createForm.reset({
                        name: selectedCompanyForDetail.name,
                        code: selectedCompanyForDetail.code,
                        isActive: selectedCompanyForDetail.isActive,
                      });
                      setIsDetailsOpen(false);
                      setIsFormDrawerOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Tenant Config
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedCompanyForDetail)}
                    variant="outline"
                    className="w-full text-red-650 text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Tenant Instance
                  </Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
