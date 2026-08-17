"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Plus, Trash2, RefreshCw, X, CheckCircle, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'PICKUP',
    priority: 'MEDIUM',
    assignedUserId: '',
    startDate: '',
    endDate: '',
    remarks: '',
    barcodesText: ''
  });

  const { data: workOrders = [], refetch, isFetching } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const res = await fetchWithAuth('/work-orders');
      return res.data || [];
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Work Orders refreshed');
  };

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/users');
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.users)) return res.data.users;
      if (Array.isArray(res.users)) return res.users;
      return [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const barcodes = form.barcodesText.split('\n').map((s) => s.trim()).filter(Boolean);
      return fetchWithAuth('/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          barcodes
        })
      });
    },
    onSuccess: () => {
      toast.success('Work Order generated successfully');
      setIsOpen(false);
      setForm({ type: 'PICKUP', priority: 'MEDIUM', assignedUserId: '', startDate: '', endDate: '', remarks: '', barcodesText: '' });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create work order')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return fetchWithAuth(`/work-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast.success('Work Order status updated');
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => fetchWithAuth(`/work-orders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Work Order deleted');
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    }
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Work Orders Master</h1>
            <p className="text-xs text-slate-500">Create & track operational work orders for Pickups, Returns, Transfer & Destruction</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isFetching} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-violet-600' : ''}`} />
          </button>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><Plus className="h-4 w-4" /> + Create Work Order</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workOrders.map((wo: any) => (
          <div key={wo.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase">{wo.type}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{wo.orderNumber}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                wo.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                wo.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {wo.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>Priority:</strong> <span className="uppercase text-slate-800 font-semibold">{wo.priority}</span></div>
              <div><strong>Assigned To:</strong> {wo.assignedUser?.fullName || (wo.assignedUser ? `${wo.assignedUser.firstName || ''} ${wo.assignedUser.lastName || ''}`.trim() : null) || wo.assignedUser?.email || 'Unassigned'}</div>
              <div><strong>Items Count:</strong> {wo.items?.length || 0} Barcodes</div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between gap-2">
              <select
                value={wo.status}
                onChange={(e) => updateStatusMutation.mutate({ id: wo.id, status: e.target.value })}
                className="text-xs border rounded-lg h-8 px-2 bg-slate-50 font-medium"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <button onClick={() => deleteMutation.mutate(wo.id)} className="text-slate-400 hover:text-rose-600 p-1.5"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Work Order</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700">Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-xl h-9 px-2 mt-1">
                      <option value="PICKUP">PICKUP</option>
                      <option value="RETURN">RETURN</option>
                      <option value="DESTROY">DESTROY</option>
                      <option value="ARCHIVE">ARCHIVE</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="BULK_MOVEMENT">BULK MOVEMENT</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border rounded-xl h-9 px-2 mt-1">
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Assign To User</label>
                  <select value={form.assignedUserId} onChange={(e) => setForm({ ...form, assignedUserId: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1">
                    <option value="">-- Unassigned --</option>
                    {users.map((u: any) => {
                      const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';
                      const code = u.employeeCode ? ` (${u.employeeCode})` : '';
                      return (
                        <option key={u.id} value={u.id}>
                          {name}{code}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Barcodes (One per line)</label>
                  <textarea rows={4} placeholder="BOX001&#10;BOX002&#10;FILE001" value={form.barcodesText} onChange={(e) => setForm({ ...form, barcodesText: e.target.value })} className="w-full border rounded-xl p-2 mt-1 font-mono text-xs" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => createMutation.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Generate Work Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
