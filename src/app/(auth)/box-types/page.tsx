"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Trash2, Edit, RefreshCw, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';
import { PageHeaderCard } from '@/components/page-header-card';

export default function BoxTypesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', defaultCapacity: 25 });

  const { data: boxTypes = [], refetch, isFetching } = useQuery({
    queryKey: ['box-types'],
    queryFn: async () => {
      const res = await fetchWithAuth('/box-types');
      return res.data || [];
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Box Types refreshed');
  };

  const createMutation = useMutation({
    mutationFn: async () => fetchWithAuth('/box-types', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      toast.success('Box Type created successfully');
      setIsOpen(false);
      setForm({ name: '', code: '', description: '', defaultCapacity: 25 });
      queryClient.invalidateQueries({ queryKey: ['box-types'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create box type')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => fetchWithAuth(`/box-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Box Type deleted');
      queryClient.invalidateQueries({ queryKey: ['box-types'] });
    }
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeaderCard
        title="Box Types Master"
        description="Configure standard box dimensions & default file capacity limits"
        badge="Asset Standards · Box Master"
        icon={Package}
      >
        <button onClick={handleRefresh} disabled={isFetching} className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-300' : ''}`} />
        </button>
        <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition">
          <Plus className="h-4 w-4" /> Add Box Type
        </button>
      </PageHeaderCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boxTypes.map((bt: any) => (
          <div key={bt.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{bt.code}</span>
              <h3 className="text-base font-bold text-slate-800 mt-1">{bt.name}</h3>
              <p className="text-xs text-slate-500">{bt.description || 'Standard Box'}</p>
              <div className="mt-3 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg inline-block">
                Default Capacity: {bt.defaultCapacity} Files
              </div>
            </div>
            <button onClick={() => deleteMutation.mutate(bt.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Box Type</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div><label className="font-semibold text-slate-700">Name</label><input type="text" placeholder="Legal Box" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Code</label><input type="text" placeholder="BOX-LGL" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Capacity (Files)</label><input type="number" min="1" value={form.defaultCapacity} onChange={(e) => setForm({ ...form, defaultCapacity: parseInt(e.target.value) || 25 })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700">Save Box Type</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
