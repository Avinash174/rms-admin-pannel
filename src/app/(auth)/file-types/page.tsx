"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function FileTypesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', defaultRetentionYears: 5 });

  const { data: fileTypes = [], refetch, isFetching } = useQuery({
    queryKey: ['file-types'],
    queryFn: async () => {
      const res = await fetchWithAuth('/file-types');
      return res.data || [];
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('File Types refreshed');
  };

  const createMutation = useMutation({
    mutationFn: async () => fetchWithAuth('/file-types', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      toast.success('File Type created successfully');
      setIsOpen(false);
      setForm({ name: '', code: '', description: '', defaultRetentionYears: 5 });
      queryClient.invalidateQueries({ queryKey: ['file-types'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create file type')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => fetchWithAuth(`/file-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('File Type deleted');
      queryClient.invalidateQueries({ queryKey: ['file-types'] });
    }
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">File Types Master</h1>
            <p className="text-xs text-slate-500">Define document categories (Invoice, Agreement, Medical) & default retention schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isFetching} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><Plus className="h-4 w-4" /> + Add File Type</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fileTypes.map((ft: any) => (
          <div key={ft.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">{ft.code}</span>
              <h3 className="text-base font-bold text-slate-800 mt-1">{ft.name}</h3>
              <p className="text-xs text-slate-500">{ft.description || 'Standard Document'}</p>
              <div className="mt-3 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg inline-block">
                Default Retention: {ft.defaultRetentionYears} Years
              </div>
            </div>
            <button onClick={() => deleteMutation.mutate(ft.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New File Type</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div><label className="font-semibold text-slate-700">Name</label><input type="text" placeholder="Invoice" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Code</label><input type="text" placeholder="FT-INV" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Retention Period (Years)</label><input type="number" min="1" value={form.defaultRetentionYears} onChange={(e) => setForm({ ...form, defaultRetentionYears: parseInt(e.target.value) || 5 })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700">Save File Type</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
