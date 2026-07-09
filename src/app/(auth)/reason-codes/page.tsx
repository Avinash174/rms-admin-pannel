"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, Loader2, AlertCircle, RefreshCw, Settings, 
  CheckCircle2, XCircle, Info, Sparkles, X, Tag, Search
} from 'lucide-react';
import { getReasonCodes, createReasonCode } from '@/lib/api/reasonCode';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ReasonCodesPage() {
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OVERRIDE' | 'REJECTION' | 'DESTRUCTION' | 'ADJUSTMENT'>('ALL');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reason-codes'],
    queryFn: getReasonCodes,
  });

  const createMutation = useMutation({
    mutationFn: createReasonCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reason-codes'] });
      setIsFormDrawerOpen(false);
      resetForm();
      toast.success('Reason code created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create reason code');
    },
  });

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      description: '',
      category: 'REJECTION',
    }
  });

  const handleFormSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      code: data.code.toUpperCase().replace(/\s+/g, '_')
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Settings className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading reason codes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load reason codes</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const reasonCodes = data?.data || [];
  const totalCount = reasonCodes.length;
  const overrideCount = reasonCodes.filter(rc => rc.category === 'OVERRIDE').length;
  const rejectionCount = reasonCodes.filter(rc => rc.category === 'REJECTION').length;

  const filteredReasonCodes = reasonCodes.filter((rc) => {
    const matchesSearch = !searchTerm ||
      rc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rc.description && rc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || rc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Reason Codes</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> System Settings
            </span>
          </div>
          <p className="text-sm text-slate-500">Configure lookup codes for manual overrides, load rejections, and inventory adjustments.</p>
        </div>
        <Button
          onClick={() => {
            resetForm({ code: '', description: '', category: 'REJECTION' });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Create Reason Code
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Codes */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Reason Codes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Tag className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Active codes for manual overrides
          </div>
        </div>

        {/* Rejections */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-50 to-orange-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejection Policies</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{rejectionCount}</h3>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50 shadow-sm">
              <XCircle className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Active rejection codes
          </div>
        </div>

        {/* Overrides */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Override Thresholds</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{overrideCount}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-emerald-500" /> Active override codes
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by code or description..." className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm" />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          {(['ALL', 'OVERRIDE', 'REJECTION', 'DESTRUCTION', 'ADJUSTMENT'] as const).map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all capitalize ${categoryFilter === cat ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>{cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReasonCodes.map((rc) => (
          <div 
            key={rc.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-slate-50 to-slate-100/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
            
            <div className="relative z-10 flex justify-between items-start gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs font-bold uppercase tracking-wider shadow-xs">
                {rc.code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                rc.category === 'OVERRIDE' 
                  ? 'bg-blue-50/60 text-blue-700 border-blue-200'
                  : rc.category === 'REJECTION'
                  ? 'bg-amber-50/60 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-105'
              }`}>
                {rc.category}
              </span>
            </div>
            
            <p className="relative z-10 text-xs text-slate-500 leading-relaxed font-semibold">{rc.description}</p>
            
            <div className="relative z-10 flex items-center gap-1.5 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              ACTIVE SYSTEM PARAMETER
            </div>
          </div>
        ))}
      </div>

      {/* SLIDE-OVER DRAWER: Add Reason Code */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Reason Code</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define scan exceptions and verification alerts.</p>
              </div>
              <Button onClick={() => setIsFormDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Code Key</Label>
                <Input
                  id="code"
                  {...register('code', { required: 'Code key is required' })}
                  placeholder="e.g. SCATTERED_BOX"
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-mono tracking-wider transition-all uppercase"
                />
                {errors.code && <p className="text-xs font-semibold text-rose-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Exception Category</Label>
                <select
                  id="category"
                  {...register('category', { required: true })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="OVERRIDE">OVERRIDE</option>
                  <option value="REJECTION">REJECTION</option>
                  <option value="DESTRUCTION">DESTRUCTION</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Detailed Description</Label>
                <Input
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="e.g. Explains physical box structural failure..."
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs"
                />
                {errors.description && <p className="text-xs font-semibold text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDrawerOpen(false)}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/10 transition-all"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Code'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}
