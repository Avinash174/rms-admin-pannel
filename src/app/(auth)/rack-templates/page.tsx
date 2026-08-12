"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Grid,
  Layers,
  Building,
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function RackTemplatesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    rowsCount: 2,
    racksCount: 4,
    levelsCount: 5,
    locRows: 3,
    locCols: 3
  });

  const [applyForm, setApplyForm] = useState({
    templateId: '',
    roomId: ''
  });

  // Queries
  const { data: templates = [], refetch, isFetching } = useQuery({
    queryKey: ['rack-templates'],
    queryFn: async () => {
      const res = await fetchWithAuth('/rack-templates');
      return res.data || [];
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Rack Templates refreshed');
  };

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/rooms');
      return res.data || [];
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      return fetchWithAuth('/rack-templates', {
        method: 'POST',
        body: JSON.stringify(form)
      });
    },
    onSuccess: () => {
      toast.success('Rack Template created successfully!');
      setIsCreateOpen(false);
      setForm({ name: '', code: '', description: '', rowsCount: 2, racksCount: 4, levelsCount: 5, locRows: 3, locCols: 3 });
      queryClient.invalidateQueries({ queryKey: ['rack-templates'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create template')
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return fetchWithAuth('/rack-templates/apply', {
        method: 'POST',
        body: JSON.stringify(applyForm)
      });
    },
    onSuccess: (res: any) => {
      toast.success(res.data?.message || 'Template applied successfully!');
      setIsApplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to apply template')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth(`/rack-templates/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['rack-templates'] });
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Rack Templates Master</h1>
            <p className="text-xs text-slate-500">Configure warehouse grid templates & auto-generate Rows, Racks, Levels & Locations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Grid className="h-4 w-4" /> Apply Template to Room
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> + Create Template
          </button>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl: any) => (
          <div key={tpl.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {tpl.code}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{tpl.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{tpl.description || 'No description provided'}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(tpl.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
              <div><span className="font-semibold text-slate-900">{tpl.rowsCount}</span> Rows</div>
              <div><span className="font-semibold text-slate-900">{tpl.racksCount}</span> Racks / Row</div>
              <div><span className="font-semibold text-slate-900">{tpl.levelsCount}</span> Levels / Rack</div>
              <div><span className="font-semibold text-slate-900">{tpl.locRows}x{tpl.locCols}</span> Matrix ({tpl.locRows * tpl.locCols} slots)</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total capacity: <strong className="text-slate-800">{tpl.rowsCount * tpl.racksCount * tpl.levelsCount * tpl.locRows * tpl.locCols}</strong> locations</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Right Slide-Over Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Rack Template</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div>
                  <label className="font-semibold text-slate-700">Template Name</label>
                  <input
                    type="text"
                    placeholder="Standard 10x15 Rack"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-9 border rounded-xl px-3 mt-1 text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Template Code</label>
                  <input
                    type="text"
                    placeholder="TPL-STD-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full h-9 border rounded-xl px-3 mt-1 text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700">Rows</label>
                    <input type="number" min="1" value={form.rowsCount} onChange={(e) => setForm({ ...form, rowsCount: parseInt(e.target.value) || 1 })} className="w-full h-9 border rounded-xl px-2 mt-1 text-xs" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Racks</label>
                    <input type="number" min="1" value={form.racksCount} onChange={(e) => setForm({ ...form, racksCount: parseInt(e.target.value) || 1 })} className="w-full h-9 border rounded-xl px-2 mt-1 text-xs" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Levels</label>
                    <input type="number" min="1" value={form.levelsCount} onChange={(e) => setForm({ ...form, levelsCount: parseInt(e.target.value) || 1 })} className="w-full h-9 border rounded-xl px-2 mt-1 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700">Matrix Rows</label>
                    <input type="number" min="1" value={form.locRows} onChange={(e) => setForm({ ...form, locRows: parseInt(e.target.value) || 1 })} className="w-full h-9 border rounded-xl px-2 mt-1 text-xs" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Matrix Cols</label>
                    <input type="number" min="1" value={form.locCols} onChange={(e) => setForm({ ...form, locCols: parseInt(e.target.value) || 1 })} className="w-full h-9 border rounded-xl px-2 mt-1 text-xs" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700">Save Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Template Right Slide-Over Drawer */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">Apply Layout Template</h3>
                <button onClick={() => setIsApplyOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div>
                  <label className="font-semibold text-slate-700">Select Template</label>
                  <select
                    value={applyForm.templateId}
                    onChange={(e) => setApplyForm({ ...applyForm, templateId: e.target.value })}
                    className="w-full h-9 border rounded-xl px-3 mt-1 text-xs"
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Select Destination Room</label>
                  <select
                    value={applyForm.roomId}
                    onChange={(e) => setApplyForm({ ...applyForm, roomId: e.target.value })}
                    className="w-full h-9 border rounded-xl px-3 mt-1 text-xs"
                  >
                    <option value="">-- Choose Room --</option>
                    {rooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsApplyOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => applyMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">Generate Structure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
