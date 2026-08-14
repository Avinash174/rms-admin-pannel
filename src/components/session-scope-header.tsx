"use client";

import { useState } from 'react';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isSuperAdmin } from '@/lib/permissions';

export function SessionScopeHeader() {
  const {
    user,
    company,
    branch,
    warehouse,
    availableCompanies,
    availableBranches,
    availableWarehouses,
    switchCompany,
    switchBranch,
    switchWarehouse,
  } = useAuth();

  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState('');

  const canSwitchCompany = isSuperAdmin(user) && availableCompanies.length > 1;
  const canSwitchBranch = availableBranches.length > 1;
  const canSwitchWarehouse = availableWarehouses.length > 1;

  const handleSwitch = async (type: 'company' | 'branch' | 'warehouse', id: string) => {
    setError('');
    setSwitching(type);
    try {
      if (type === 'company') await switchCompany(id);
      if (type === 'branch') await switchBranch(id);
      if (type === 'warehouse') await switchWarehouse(id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Switch failed');
    } finally {
      setSwitching(null);
    }
  };

  if (!user || !company || !warehouse) return null;

  return (
    <div className="hidden lg:flex flex-col min-w-0 max-w-md">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 truncate">
        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
        {canSwitchCompany ? (
          <select
            value={company.id}
            disabled={switching === 'company'}
            onChange={(e) => handleSwitch('company', e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-slate-900 focus:outline-none focus:ring-0 cursor-pointer truncate max-w-[180px]"
          >
            {availableCompanies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <span className="truncate">{company.name}</span>
        )}
        {switching === 'company' && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
        {canSwitchBranch && branch ? (
          <select
            value={branch.id}
            disabled={switching === 'branch'}
            onChange={(e) => handleSwitch('branch', e.target.value)}
            className="bg-transparent border-none text-xs text-slate-500 focus:outline-none cursor-pointer truncate max-w-[140px]"
          >
            {availableBranches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : (
          <span className="truncate">{branch?.name ?? '—'}</span>
        )}

        <span className="text-slate-300">·</span>

        {canSwitchWarehouse ? (
          <select
            value={warehouse.id}
            disabled={switching === 'warehouse'}
            onChange={(e) => handleSwitch('warehouse', e.target.value)}
            className="bg-transparent border-none text-xs text-slate-500 focus:outline-none cursor-pointer truncate max-w-[140px]"
          >
            {availableWarehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        ) : (
          <span className="truncate">{warehouse.name}</span>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function SessionScopeMobile() {
  const {
    company,
    branch,
    warehouse,
    availableCompanies,
    availableBranches,
    availableWarehouses,
    switchCompany,
    switchBranch,
    switchWarehouse,
    user,
  } = useAuth();

  const [switching, setSwitching] = useState(false);

  if (!company || !warehouse) return null;

  const canSwitchCompany = isSuperAdmin(user) && availableCompanies.length > 1;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSwitching(true);
    try {
      if (name === 'company') await switchCompany(value);
      if (name === 'branch') await switchBranch(value);
      if (name === 'warehouse') await switchWarehouse(value);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="lg:hidden px-4 py-3 bg-slate-50 border-b border-slate-200 space-y-2">
      <p className="text-xs font-semibold text-slate-700 truncate">{company.name}</p>
      {canSwitchCompany && (
        <select
          name="company"
          value={company.id}
          disabled={switching}
          onChange={handleChange}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        >
          {availableCompanies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {availableBranches.length > 1 && branch && (
        <select
          name="branch"
          value={branch.id}
          disabled={switching}
          onChange={handleChange}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        >
          {availableBranches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}
      {availableWarehouses.length > 1 && (
        <select
          name="warehouse"
          value={warehouse.id}
          disabled={switching}
          onChange={handleChange}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        >
          {availableWarehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      )}
      {!canSwitchCompany && availableBranches.length <= 1 && availableWarehouses.length <= 1 && (
        <p className="text-xs text-slate-500">
          {branch?.name ?? '—'} · {warehouse.name}
        </p>
      )}
    </div>
  );
}
