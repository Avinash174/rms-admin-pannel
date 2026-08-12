"use client";

import { useState } from 'react';
import { Activity, Plus, RefreshCw, CheckCircle2, ShieldAlert, PackageCheck, Truck, Flame, Archive, AlertCircle, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface StatusItem {
  id: string;
  code: string;
  name: string;
  category: 'BOX' | 'FILE' | 'INVENTORY' | 'BARCODE';
  description: string;
  color: string;
  isSystem: boolean;
}

const DEFAULT_STATUSES: StatusItem[] = [
  { id: '1', code: 'AVAILABLE', name: 'Available', category: 'INVENTORY', description: 'Item is present in warehouse location & available', color: 'emerald', isSystem: true },
  { id: '2', code: 'OCCUPIED', name: 'Occupied', category: 'INVENTORY', description: 'Location is currently assigned to a box', color: 'blue', isSystem: true },
  { id: '3', code: 'MOVED', name: 'Moved', category: 'INVENTORY', description: 'Item has been relocated to another position', color: 'indigo', isSystem: true },
  { id: '4', code: 'TEMP_OUT', name: 'Temporary Out', category: 'INVENTORY', description: 'Item issued temporarily for audit / legal review', color: 'amber', isSystem: true },
  { id: '5', code: 'PERM_OUT', name: 'Permanent Out', category: 'INVENTORY', description: 'Item permanently retrieved from warehouse', color: 'violet', isSystem: true },
  { id: '6', code: 'DESTROYED', name: 'Destroyed', category: 'INVENTORY', description: 'Document record destroyed per retention schedule', color: 'rose', isSystem: true },
  { id: '7', code: 'ARCHIVED', name: 'Archived', category: 'FILE', description: 'Record archived in deep storage', color: 'slate', isSystem: true },
  { id: '8', code: 'MISSING', name: 'Missing', category: 'INVENTORY', description: 'Flagged missing during inventory audit scan', color: 'red', isSystem: true },
  { id: '9', code: 'RETURNED', name: 'Returned', category: 'INVENTORY', description: 'Returned from temporary issue and refiled', color: 'teal', isSystem: true },
  { id: '10', code: 'DISPOSED', name: 'Disposed', category: 'INVENTORY', description: 'Recycled or disposed of per compliance policy', color: 'gray', isSystem: true }
];

export default function StatusMasterPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>(DEFAULT_STATUSES);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', category: 'INVENTORY', description: '' });

  const filtered = filterCategory === 'ALL' ? statuses : statuses.filter(s => s.category === filterCategory);

  const handleAdd = () => {
    if (!form.code || !form.name) return toast.error('Code and Name are required');
    const newItem: StatusItem = {
      id: String(Date.now()),
      code: form.code.toUpperCase(),
      name: form.name,
      category: form.category as any,
      description: form.description || 'Custom configured status',
      color: 'blue',
      isSystem: false
    };
    setStatuses([newItem, ...statuses]);
    toast.success('Custom status created');
    setIsOpen(false);
    setForm({ code: '', name: '', category: 'INVENTORY', description: '' });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Status Master</h1>
            <p className="text-xs text-slate-500">Configure system-wide inventory, box, file & location lifecycle status codes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success("Status master refreshed")} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 border rounded-xl text-xs font-semibold px-3 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="INVENTORY">Inventory Statuses</option>
            <option value="BOX">Box Statuses</option>
            <option value="FILE">File Statuses</option>
          </select>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" /> + Add Status Code
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                {s.category}
              </span>
              {s.isSystem && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  System Core
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">{s.code}</p>
            </div>
            <p className="text-xs text-slate-500">{s.description}</p>
          </div>
        ))}
      </div>

      {/* Add Right Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Custom Status</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div><label className="font-semibold text-slate-700">Status Code</label><input type="text" placeholder="TEMP_AUDIT" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Status Name</label><input type="text" placeholder="Temporary Audit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl h-9 px-2 mt-1">
                    <option value="INVENTORY">Inventory</option>
                    <option value="BOX">Box</option>
                    <option value="FILE">File</option>
                  </select>
                </div>
                <div><label className="font-semibold text-slate-700">Description</label><input type="text" placeholder="Description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700">Save Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
