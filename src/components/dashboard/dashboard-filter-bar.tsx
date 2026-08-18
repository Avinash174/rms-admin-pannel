"use client";

import { useMemo } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Building2, Calendar, Filter, RefreshCw, Warehouse as WarehouseIcon, Activity, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export type DatePreset = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export interface DashboardFilterState {
  companyId: string;
  warehouseId: string;
  datePreset: DatePreset;
  customFromDate: string;
  customToDate: string;
  status: string;
  operationType: string;
}

export function resolveDateRange(preset: DatePreset, customFrom?: string, customTo?: string) {
  const now = new Date();
  switch (preset) {
    case 'TODAY':
      return {
        fromDate: startOfDay(now).toISOString(),
        toDate: endOfDay(now).toISOString(),
        days: 1
      };
    case 'YESTERDAY': {
      const y = subDays(now, 1);
      return {
        fromDate: startOfDay(y).toISOString(),
        toDate: endOfDay(y).toISOString(),
        days: 1
      };
    }
    case 'THIS_WEEK':
      return {
        fromDate: startOfDay(subDays(now, 7)).toISOString(),
        toDate: endOfDay(now).toISOString(),
        days: 7
      };
    case 'THIS_MONTH':
      return {
        fromDate: startOfMonth(now).toISOString(),
        toDate: endOfDay(now).toISOString(),
        days: 30
      };
    case 'LAST_MONTH': {
      const lm = subMonths(now, 1);
      return {
        fromDate: startOfMonth(lm).toISOString(),
        toDate: endOfMonth(lm).toISOString(),
        days: 30
      };
    }
    case 'CUSTOM':
      return {
        fromDate: customFrom ? startOfDay(new Date(customFrom)).toISOString() : startOfDay(subDays(now, 7)).toISOString(),
        toDate: customTo ? endOfDay(new Date(customTo)).toISOString() : endOfDay(now).toISOString(),
        days: 7
      };
  }
}

interface CompanyOption {
  id: string;
  name: string;
  code?: string;
}

interface WarehouseOption {
  id: string;
  name: string;
  code?: string;
  companyId?: string;
}

interface DashboardFilterBarProps {
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'WAREHOUSE_ADMIN';
  state: DashboardFilterState;
  onChange: (newState: Partial<DashboardFilterState>) => void;
  onReset: () => void;
  companies?: CompanyOption[];
  warehouses?: WarehouseOption[];
  fixedCompanyName?: string;
  fixedWarehouseName?: string;
  isFetching?: boolean;
}

export const OPERATION_OPTIONS = [
  { value: 'ALL', label: 'All Operations' },
  { value: 'FRESH_BOX_MOVE', label: 'Fresh Box Move' },
  { value: 'REFILE', label: 'Refile' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'SEGREGATION', label: 'Segregation' },
  { value: 'MERGE', label: 'Merge / Split' },
  { value: 'INVENTORY_VERIFY', label: 'Inventory Verification' },
  { value: 'WORK_ORDER', label: 'Work Order' }
];

export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'INACTIVE', label: 'Inactive' }
];

export function DashboardFilterBar({
  role,
  state,
  onChange,
  onReset,
  companies = [],
  warehouses = [],
  fixedCompanyName,
  fixedWarehouseName,
  isFetching
}: DashboardFilterBarProps) {
  // Super Admin: Dependent warehouses based on companyId
  const availableWarehouses = useMemo(() => {
    if (role === 'SUPER_ADMIN') {
      if (state.companyId && state.companyId !== 'ALL') {
        return warehouses.filter((w) => w.companyId === state.companyId);
      }
      return warehouses;
    }
    return warehouses;
  }, [role, state.companyId, warehouses]);

  const handleCompanyChange = (newCompanyId: string) => {
    // When company changes, verify if currently selected warehouse belongs to new company
    let newWarehouseId = state.warehouseId;
    if (newCompanyId !== 'ALL') {
      const companyWarehouses = warehouses.filter((w) => w.companyId === newCompanyId);
      const isStillValid = companyWarehouses.some((w) => w.id === state.warehouseId);
      if (!isStillValid) {
        newWarehouseId = 'ALL';
      }
    }
    onChange({ companyId: newCompanyId, warehouseId: newWarehouseId });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dashboard Filters</h3>
            <p className="text-[11px] text-slate-400 font-medium">Real-time scoped metrics and analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isFetching}
            className="h-8 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-1">
        {/* 1. SUPER ADMIN: Company Dropdown */}
        {role === 'SUPER_ADMIN' && (
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-500" />
              Company
            </Label>
            <select
              value={state.companyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* COMPANY ADMIN & WAREHOUSE ADMIN: Fixed Company Badge */}
        {(role === 'COMPANY_ADMIN' || role === 'WAREHOUSE_ADMIN') && fixedCompanyName && (
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              Company Scope
            </Label>
            <div className="flex h-10 items-center px-3 rounded-xl border border-slate-150 bg-slate-50 text-xs font-bold text-slate-800 truncate">
              {fixedCompanyName}
            </div>
          </div>
        )}

        {/* 2. SUPER ADMIN & COMPANY ADMIN: Warehouse Dropdown */}
        {(role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN') && (
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <WarehouseIcon className="w-3 h-3 text-indigo-500" />
              Warehouse
            </Label>
            <select
              value={state.warehouseId}
              onChange={(e) => onChange({ warehouseId: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">All Warehouses</option>
              {availableWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* WAREHOUSE ADMIN: Fixed Warehouse Badge */}
        {role === 'WAREHOUSE_ADMIN' && fixedWarehouseName && (
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <WarehouseIcon className="w-3 h-3 text-slate-400" />
              Assigned Warehouse
            </Label>
            <div className="flex h-10 items-center px-3 rounded-xl border border-slate-150 bg-slate-50 text-xs font-bold text-slate-800 truncate">
              {fixedWarehouseName}
            </div>
          </div>
        )}

        {/* 3. ALL: Date Range Preset */}
        <div className="space-y-1">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-500" />
            Date Range
          </Label>
          <select
            value={state.datePreset}
            onChange={(e) => onChange({ datePreset: e.target.value as DatePreset })}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          >
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_WEEK">This Week (Last 7 Days)</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>
        </div>

        {/* 4. WAREHOUSE ADMIN: Status Filter */}
        {role === 'WAREHOUSE_ADMIN' && (
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-amber-500" />
              Status
            </Label>
            <select
              value={state.status}
              onChange={(e) => onChange({ status: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 5. WAREHOUSE ADMIN: Operation Type Filter */}
        {role === 'WAREHOUSE_ADMIN' && (
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-500" />
              Operation Type
            </Label>
            <select
              value={state.operationType}
              onChange={(e) => onChange({ operationType: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {OPERATION_OPTIONS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 6. CUSTOM RANGE: From Date & To Date Inputs */}
        {state.datePreset === 'CUSTOM' && (
          <>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">From Date</Label>
              <Input
                type="date"
                value={state.customFromDate}
                onChange={(e) => onChange({ customFromDate: e.target.value })}
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">To Date</Label>
              <Input
                type="date"
                value={state.customToDate}
                onChange={(e) => onChange({ customToDate: e.target.value })}
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
