"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function LevelsMasterPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ rackId: '', name: '', code: '' });

  const { data: racks = [] } = useQuery({
    queryKey: ['racks-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/racks');
      return res.data || [];
    }
  });

  const { data: levelsList = [], refetch, isFetching } = useQuery({
    queryKey: ['levels-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/racks');
      const allRacks = res.data || [];
      const extractedLevels: any[] = [];
      allRacks.forEach((rk: any) => {
        (rk.levels || []).forEach((lv: any) => {
          extractedLevels.push({ ...lv, rackName: rk.name, rackCode: rk.code });
        });
      });
      return extractedLevels;
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Levels refreshed');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return fetchWithAuth(`/racks/${form.rackId}/levels`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
    },
    onSuccess: () => {
      toast.success('Level created successfully');
      setIsOpen(false);
      setForm({ rackId: '', name: '', code: '' });
      refetch();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create level')
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Levels Master</h1>
            <p className="text-xs text-slate-500">Configure vertical rack levels & shelf tiers (L01, L02, L03, L04...)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isFetching} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" /> + Add Level
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levelsList.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center rounded-2xl border text-slate-400 text-xs">
            No levels configured yet. Click "+ Add Level" or apply a Rack Template to generate levels automatically.
          </div>
        ) : (
          levelsList.map((lv: any) => (
            <div key={lv.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md uppercase">{lv.code}</span>
                <span className="text-xs text-slate-400 font-medium">{lv.rackName || 'Rack'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{lv.name}</h3>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Level</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div>
                  <label className="font-semibold text-slate-700">Select Rack</label>
                  <select value={form.rackId} onChange={(e) => setForm({ ...form, rackId: e.target.value })} className="w-full border rounded-xl h-9 px-2 mt-1">
                    <option value="">-- Choose Rack --</option>
                    {racks.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
                <div><label className="font-semibold text-slate-700">Level Code</label><input type="text" placeholder="L01" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Level Name</label><input type="text" placeholder="Level 01 - Top Tier" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700">Save Level</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
