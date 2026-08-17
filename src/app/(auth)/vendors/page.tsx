"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, RefreshCw, X, Mail, Phone, MapPin } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';
import { PageHeaderCard } from '@/components/page-header-card';

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', contactEmail: '', phone: '', address: '' });

  const { data: vendors = [], refetch, isFetching } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetchWithAuth('/vendors');
      return res.data || [];
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Vendors list refreshed');
  };

  const createMutation = useMutation({
    mutationFn: async () => fetchWithAuth('/vendors', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      toast.success('Vendor created successfully');
      setIsOpen(false);
      setForm({ name: '', code: '', contactEmail: '', phone: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create vendor')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => fetchWithAuth(`/vendors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Vendor deleted');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Vendors Master"
        description="Manage external suppliers, logistics vendors & archiving service providers."
        badge="System Live · Vendor Registry"
        icon={Users}
        showAccessScope={true}
      >
        <button onClick={handleRefresh} disabled={isFetching} className="p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md rounded-xl transition-all" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-300' : ''}`} />
        </button>
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all">
          <Plus className="h-4 w-4" /> Add Vendor
        </button>
      </PageHeaderCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((v: any) => (
          <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">{v.code}</span>
              <h3 className="text-base font-bold text-slate-800">{v.name}</h3>
              {v.contactEmail && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {v.contactEmail}</p>}
              {v.phone && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {v.phone}</p>}
              {v.address && <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400" /> {v.address}</p>}
            </div>
            <button onClick={() => deleteMutation.mutate(v.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Vendor</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div><label className="font-semibold text-slate-700">Vendor Name</label><input type="text" placeholder="ABC Logistics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Vendor Code</label><input type="text" placeholder="VND-ABC" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Email</label><input type="email" placeholder="contact@abclogistics.com" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Phone</label><input type="text" placeholder="+1234567890" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">Save Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
