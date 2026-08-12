"use client";

import { useState } from 'react';
import { Building, Plus, Trash2, RefreshCw, X, Shield, Thermometer, Box } from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseType {
  id: string;
  code: string;
  name: string;
  description: string;
  tempControlled: boolean;
  securityLevel: string;
}

const DEFAULT_TYPES: WarehouseType[] = [
  { id: '1', code: 'WHT-GEN', name: 'General Warehouse', description: 'Standard ambient record storage warehouse facility', tempControlled: false, securityLevel: 'Standard' },
  { id: '2', code: 'WHT-COLD', name: 'Cold Storage Archive', description: 'Temperature & humidity controlled specialized storage facility', tempControlled: true, securityLevel: 'High Security' },
  { id: '3', code: 'WHT-DEEP', name: 'Deep Vault Archive', description: 'High security long-term legal & medical record vault', tempControlled: true, securityLevel: 'Maximum Security' },
  { id: '4', code: 'WHT-TEMP', name: 'Staging / Transit Hub', description: 'Temporary intake & dispatch sorting warehouse', tempControlled: false, securityLevel: 'Standard' },
  { id: '5', code: 'WHT-BOND', name: 'Bonded Warehouse', description: 'Customs & regulatory compliant bonded record facility', tempControlled: false, securityLevel: 'High Security' }
];

export default function WarehouseTypesPage() {
  const [types, setTypes] = useState<WarehouseType[]>(DEFAULT_TYPES);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', tempControlled: false, securityLevel: 'Standard' });

  const handleAdd = () => {
    if (!form.code || !form.name) return toast.error('Code and Name are required');
    const newItem: WarehouseType = {
      id: String(Date.now()),
      code: form.code.toUpperCase(),
      name: form.name,
      description: form.description || 'Configured warehouse type',
      tempControlled: form.tempControlled,
      securityLevel: form.securityLevel
    };
    setTypes([newItem, ...types]);
    toast.success('Warehouse Type created');
    setIsOpen(false);
    setForm({ code: '', name: '', description: '', tempControlled: false, securityLevel: 'Standard' });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Warehouse Types Master</h1>
            <p className="text-xs text-slate-500">Classify physical warehouses (Cold Storage, Deep Vault, Transit Staging, Bonded)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('Warehouse Types refreshed')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" /> + Add Warehouse Type
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                {t.code}
              </span>
              {t.tempControlled && (
                <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Thermometer className="h-3 w-3" /> Climate Controlled
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.description}</p>
            </div>
            <div className="pt-2 border-t text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-slate-400" /> {t.securityLevel}
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-slate-900 text-base">New Warehouse Type</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 text-xs pt-4">
                <div><label className="font-semibold text-slate-700">Code</label><input type="text" placeholder="WHT-SEC" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Type Name</label><input type="text" placeholder="High Security Vault" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div><label className="font-semibold text-slate-700">Description</label><input type="text" placeholder="Facility description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl h-9 px-3 mt-1" /></div>
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="temp" checked={form.tempControlled} onChange={(e) => setForm({ ...form, tempControlled: e.target.checked })} className="rounded" />
                  <label htmlFor="temp" className="font-semibold text-slate-700">Climate Controlled Facility</label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700">Save Type</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
