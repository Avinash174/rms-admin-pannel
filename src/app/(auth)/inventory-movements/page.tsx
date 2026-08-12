"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, ShieldAlert, CheckCircle2, FileText, Upload, RefreshCw, X, History } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function InventoryMovementsPage() {
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState<'TEMP_OUT' | 'RETURN' | 'PERM_OUT' | 'DESTROY' | null>(null);

  const [form, setForm] = useState({
    barcode: '',
    issuedTo: '',
    approvedBy: '',
    reason: '',
    remarks: '',
    documentUrl: ''
  });

  const { data: history = [], refetch, isFetching } = useQuery({
    queryKey: ['movement-history'],
    queryFn: async () => {
      const res = await fetchWithAuth('/inventory-movements/history');
      return res.data || [];
    }
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Movement log refreshed');
  };

  const movementMutation = useMutation({
    mutationFn: async (action: string) => {
      return fetchWithAuth('/inventory-movements/record', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          action
        })
      });
    },
    onSuccess: () => {
      toast.success('Movement recorded successfully');
      setActiveModal(null);
      setForm({ barcode: '', issuedTo: '', approvedBy: '', reason: '', remarks: '', documentUrl: '' });
      queryClient.invalidateQueries({ queryKey: ['movement-history'] });
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
    },
    onError: (err: any) => toast.error(err.message || 'Movement recording failed')
  });

  return (
    <div className="space-y-6 p-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inventory Movement & Destruction</h1>
            <p className="text-xs text-slate-500">Record Temporary Out, Returns, Permanent Out & Document Destruction with proof upload</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModal('TEMP_OUT')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            ⚡ Temporary Out
          </button>
          <button
            onClick={() => setActiveModal('RETURN')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            ↩ Return Item
          </button>
          <button
            onClick={() => setActiveModal('PERM_OUT')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            📦 Permanent Out
          </button>
          <button
            onClick={() => setActiveModal('DESTROY')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            🔥 Destroy Record
          </button>
        </div>
      </div>

      {/* Movement History Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-base">Immutable Movement History Log</h3>
          </div>
          <button onClick={handleRefresh} disabled={isFetching} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Barcode</th>
                <th className="p-3">Type</th>
                <th className="p-3">Action</th>
                <th className="p-3">Issued To</th>
                <th className="p-3">Approved By</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Doc Proof</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h: any) => (
                <tr key={h.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-mono font-bold text-slate-900">{h.barcode}</td>
                  <td className="p-3 font-semibold text-slate-600">{h.entityType}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      h.action === 'DESTROY' ? 'bg-rose-50 text-rose-600' :
                      h.action === 'TEMP_OUT' ? 'bg-amber-50 text-amber-600' :
                      h.action === 'PERM_OUT' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {h.action}
                    </span>
                  </td>
                  <td className="p-3">{h.issuedTo || '-'}</td>
                  <td className="p-3">{h.approvedBy || '-'}</td>
                  <td className="p-3">{h.reason || '-'}</td>
                  <td className="p-3">
                    {h.documentUrl ? (
                      <a href={h.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                        <FileText className="h-3 w-3" /> View Doc
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-slate-400">{new Date(h.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Right Slide-Over Drawer */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">
                  {activeModal === 'TEMP_OUT' && '⚡ Temporary Out Request'}
                  {activeModal === 'RETURN' && '↩ Return Item to Inventory'}
                  {activeModal === 'PERM_OUT' && '📦 Permanent Out Request'}
                  {activeModal === 'DESTROY' && '🔥 Record Destruction Approval'}
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4 text-xs pt-4">
                <div>
                  <label className="font-semibold text-slate-700">Scan / Enter Barcode</label>
                  <input
                    type="text"
                    placeholder="BOX000123"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value.toUpperCase() })}
                    className="w-full h-9 border rounded-xl px-3 mt-1 font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {activeModal === 'TEMP_OUT' && (
                  <div>
                    <label className="font-semibold text-slate-700">Issued To (Person / Dept)</label>
                    <input
                      type="text"
                      placeholder="John Doe (Legal Dept)"
                      value={form.issuedTo}
                      onChange={(e) => setForm({ ...form, issuedTo: e.target.value })}
                      className="w-full h-9 border rounded-xl px-3 mt-1"
                    />
                  </div>
                )}

                {(activeModal === 'PERM_OUT' || activeModal === 'DESTROY') && (
                  <div>
                    <label className="font-semibold text-slate-700">Approved By (Supervisor Name)</label>
                    <input
                      type="text"
                      placeholder="Manager Approval Code / Name"
                      value={form.approvedBy}
                      onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                      className="w-full h-9 border rounded-xl px-3 mt-1"
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700">Reason</label>
                  <input
                    type="text"
                    placeholder="Audit / Transfer / Legal Review"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full h-9 border rounded-xl px-3 mt-1"
                  />
                </div>

                {activeModal === 'DESTROY' && (
                  <div>
                    <label className="font-semibold text-slate-700">Document Upload Proof (URL or File Path)</label>
                    <input
                      type="text"
                      placeholder="https://storage.provider/proofs/destruction-cert.pdf"
                      value={form.documentUrl}
                      onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                      className="w-full h-9 border rounded-xl px-3 mt-1"
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700">Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Additional notes..."
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full border rounded-xl p-2 mt-1 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button
                onClick={() => movementMutation.mutate(activeModal)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white ${
                  activeModal === 'DESTROY' ? 'bg-rose-600 hover:bg-rose-700' :
                  activeModal === 'TEMP_OUT' ? 'bg-amber-500 hover:bg-amber-600' :
                  activeModal === 'PERM_OUT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Submit Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
