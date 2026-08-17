"use client";

import { useState } from 'react';
import { Building2, ChevronDown, Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  canSwitchBranch,
  canSwitchCompany,
  canSwitchWarehouse,
  isSuperAdmin,
  isWarehouseAdmin,
} from '@/lib/permissions';

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

  if (!user) return null;

  if (isSuperAdmin(user)) {
    return (
      <div className="hidden lg:flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100/80">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Access Scope:</span>
          <span className="text-xs font-semibold text-indigo-900">Unrestricted (Global Master)</span>
        </div>
      </div>
    );
  }

  const isWarehouseUser = isWarehouseAdmin(user);

  if (isWarehouseUser && warehouse) {
    return (
      <div className="hidden lg:flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Access Scope:</span>
          <span className="text-xs font-bold text-emerald-950">
            {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
          </span>
        </div>
        {company && (
          <span className="text-xs text-slate-500 font-medium">
            {company.name} {branch ? `• ${branch.name}` : ''}
          </span>
        )}
      </div>
    );
  }

  if (!company || !warehouse) return null;

  const showCompanySwitch = canSwitchCompany(user, availableCompanies.length);
  const showBranchSwitch = canSwitchBranch(user, availableBranches.length);
  const showWarehouseSwitch = canSwitchWarehouse(user, availableWarehouses.length);

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

  const roleLabel = user.roleName?.replaceAll('_', ' ') || 'User';
  const displayName =
    user.fullName ||
    `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`.trim();

  return (
    <div className="hidden lg:flex flex-col min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <ScopeRow label="Company">
          {showCompanySwitch ? (
            <ScopeSelect
              value={company.id}
              disabled={switching === 'company'}
              onChange={(id) => handleSwitch('company', id)}
              options={availableCompanies}
            />
          ) : (
            <span className="font-semibold text-slate-900 truncate max-w-[160px]">{company.name}</span>
          )}
          {switching === 'company' && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </ScopeRow>

        <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg] shrink-0" />

        <ScopeRow label="Branch">
          {showBranchSwitch && branch ? (
            <ScopeSelect
              value={branch.id}
              disabled={switching === 'branch'}
              onChange={(id) => handleSwitch('branch', id)}
              options={availableBranches}
            />
          ) : (
            <span className="text-slate-600 truncate max-w-[140px]">{branch?.name ?? '—'}</span>
          )}
          {switching === 'branch' && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </ScopeRow>

        <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg] shrink-0" />

        <ScopeRow label="Warehouse">
          {showWarehouseSwitch ? (
            <ScopeSelect
              value={warehouse.id}
              disabled={switching === 'warehouse'}
              onChange={(id) => handleSwitch('warehouse', id)}
              options={availableWarehouses}
            />
          ) : (
            <span className="text-slate-600 truncate max-w-[140px]">{warehouse.name}</span>
          )}
          {switching === 'warehouse' && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </ScopeRow>

        <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg] shrink-0" />

        <ScopeRow label="User">
          <span className="inline-flex items-center gap-1 text-slate-700 truncate max-w-[140px]">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {displayName}
          </span>
        </ScopeRow>

        <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg] shrink-0" />

        <ScopeRow label="Role">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{roleLabel}</span>
        </ScopeRow>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ScopeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0 hidden xl:block" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ScopeSelect({
  value,
  disabled,
  onChange,
  options,
}: {
  value: string;
  disabled?: boolean;
  onChange: (id: string) => void;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none text-sm font-medium text-slate-800 focus:outline-none focus:ring-0 cursor-pointer truncate max-w-[140px]"
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
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

  if (!company || !warehouse || !user || isSuperAdmin(user)) return null;

  const showCompanySwitch = canSwitchCompany(user, availableCompanies.length);
  const showBranchSwitch = canSwitchBranch(user, availableBranches.length);
  const showWarehouseSwitch = canSwitchWarehouse(user, availableWarehouses.length);

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
      <p className="text-xs font-semibold text-slate-700 truncate">
        {company.name} · {branch?.name ?? '—'} · {warehouse.name}
      </p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
        {user.fullName || user.email} · {user.roleName?.replaceAll('_', ' ')}
      </p>
      {showCompanySwitch && (
        <select
          name="company"
          value={company.id}
          disabled={switching}
          onChange={handleChange}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        >
          {availableCompanies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {showBranchSwitch && branch && (
        <select
          name="branch"
          value={branch.id}
          disabled={switching}
          onChange={handleChange}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        >
          {availableBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}
      {showWarehouseSwitch && (
        <select
          name="warehouse"
          value={warehouse.id}
          disabled={switching}
          onChange={handleChange}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        >
          {availableWarehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
