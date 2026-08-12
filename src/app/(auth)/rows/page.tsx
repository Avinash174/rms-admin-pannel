"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Trash2, RefreshCw, X, Building } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function RowsMasterPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ roomId: '', name: '', code: '' });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/rooms');
      return res.data || [];
    }
  });

  const { data: rowsList = [], refetch, isFetching } = useQuery({
    queryKey: ['rows-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/rooms');
      const allRooms = res.data || [];
      const extractedRows: any[] = [];
      allRooms.forEach((rm: any) => {
        (rm.rows || []).forEach((rw: any) => {
          extractedRows.push({ ...rw, roomName: rm.name, roomCode: rm.code });
        });
      });
      return extractedRows;
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Rows refreshed');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return fetchWithAuth(`/rooms/${form.roomId}/rows`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
    },
    onSuccess: () => {
      toast.success('Row created successfully');
      setIsOpen(false);
      setForm({ roomId: '', name: '', code: '' });
      refetch();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create row')
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Rows Master</h1>
            <p className="text-xs text-slate-500">Configure physical warehouse aisles & rows (R01, R02, R03...)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isFetching} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-violet-600' : ''}`} />
          </button>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" /> + Add Row
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rowsList.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center rounded-2xl border text-slate-400 text-xs">
            No rows configured yet. Click "+ Add Row" or apply a Rack Template to generate rows automatically.
          </div>
        ) : (
          rowsList.map((rw: any) => (
            <div key={rw.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase">{rw.code}</span>
                <span className="text-xs text-slate-400 font-medium">{rw.roomName || 'Room'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{rw.name}</h3>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Row</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div>
                  <label className="font-semibold text-slate-700">Select Room</label>
                  <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} className="w-full border rounded-xl h-9 px-2 mt-1">
                    <option value="">-- Choose Room --</option>
                    {rooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
                <div><label className="font-semibold text-slate-700">Row Code</label><input type="text" placeholder="R01" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Row Name</label><input type="text" placeholder="Row 01 - Main Aisle" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Save Row</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
