"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  GitBranch,
  MapPin,
  Package,
  Shield,
  Users,
  Warehouse,
  Smartphone,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  Zap,
  Activity,
  Layers,
  Settings,
  ShieldCheck,
  SearchX
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getSuperAdminSummary } from "@/lib/api/dashboard";
import { getCompanies } from "@/lib/api/company";
import { getWarehouses } from "@/lib/api/warehouse";
import { EntityRef } from "@/lib/types/auth";
import { DashboardError } from "./dashboard-shared";
import {
  DashboardFilterBar,
  DashboardFilterState,
  resolveDateRange
} from "@/components/dashboard/dashboard-filter-bar";

const initialFilterState: DashboardFilterState = {
  companyId: "ALL",
  warehouseId: "ALL",
  datePreset: "THIS_WEEK",
  customFromDate: "",
  customToDate: "",
  status: "ALL",
  operationType: "ALL"
};

export function SuperAdminDashboard({ company }: { company?: EntityRef | null }) {
  const { user } = useAuth();
  const [filterState, setFilterState] = useState<DashboardFilterState>(initialFilterState);

  // Fetch companies and warehouses for filter dropdowns
  const { data: companiesData } = useQuery({
    queryKey: ["companies-list-for-filter"],
    queryFn: () => getCompanies(1, 100),
    staleTime: 60_000
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-list-for-filter"],
    queryFn: () => getWarehouses(1, 100),
    staleTime: 60_000
  });

  const dateRange = useMemo(
    () => resolveDateRange(filterState.datePreset, filterState.customFromDate, filterState.customToDate),
    [filterState.datePreset, filterState.customFromDate, filterState.customToDate]
  );

  const queryFilters = useMemo(
    () => ({
      companyId: filterState.companyId,
      warehouseId: filterState.warehouseId,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
      days: dateRange.days
    }),
    [filterState.companyId, filterState.warehouseId, dateRange]
  );

  const summaryQuery = useQuery({
    queryKey: [
      "super-admin-summary",
      filterState.companyId,
      filterState.warehouseId,
      dateRange.fromDate,
      dateRange.toDate
    ],
    queryFn: () => getSuperAdminSummary(queryFilters),
    staleTime: 30_000
  });

  if (summaryQuery.error) {
    return <DashboardError onRetry={() => summaryQuery.refetch()} />;
  }

  const summary = summaryQuery.data;
  const isLoading = summaryQuery.isLoading || summaryQuery.isFetching;

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Super Admin';

  const handleFilterChange = (partial: Partial<DashboardFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilterState(initialFilterState);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Hero Banner Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-400/20 backdrop-blur-md text-xs font-semibold text-blue-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Live · Global Super Admin Platform
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-white bg-clip-text text-transparent">{displayName}</span>
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {filterState.companyId !== "ALL"
                ? `Filtered Scope: Viewing metrics for selected company & warehouse entities.`
                : "Real-time global command center across all companies, branches, sites, and warehouses."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</p>
                <p className="text-sm font-bold text-white">
                  {filterState.companyId !== "ALL" ? "Scoped Entity" : "Unrestricted (Global)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Filter Bar */}
      <DashboardFilterBar
        role="SUPER_ADMIN"
        state={filterState}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        companies={companiesData?.data || []}
        warehouses={warehousesData?.data || []}
        isFetching={summaryQuery.isFetching}
      />

      {/* Main Core Infrastructure Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Core Platform Metrics</h2>
            <p className="text-xs text-slate-500">
              {filterState.companyId !== "ALL" ? "Scoped totals for selected filter" : "High-level enterprise totals across all connected hubs"}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Live Overview</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Companies Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="h-5.5 w-5.5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Enterprise
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Companies</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalCompanies ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Active tenant organizations
            </p>
          </div>

          {/* Warehouses Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Warehouse className="h-5.5 w-5.5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Storage
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouses</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalWarehouses ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-indigo-500" /> Active fulfillment hubs
            </p>
          </div>

          {/* Users Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="h-5.5 w-5.5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Personnel
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalUsers ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-purple-500" /> Authorized platform operators
            </p>
          </div>

          {/* Total Boxes Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="h-5.5 w-5.5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Inventory
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stored Boxes</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalBoxes ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified archival cartons
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Records & Hierarchy Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branches</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalBranches ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sites</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalSites ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clients</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalClients ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendors</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalVendors ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">File Records</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalFiles ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scans in Period</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{isLoading ? "—" : summary?.scansToday ?? 0}</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Enterprise Masters & Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/companies"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Company Master</p>
                <p className="text-xs text-slate-400">Manage tenant companies</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          <Link
            href="/warehouses"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-500 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Warehouse Master</p>
                <p className="text-xs text-slate-400">Hubs & storage facilities</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          <Link
            href="/vendors"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Vendor Master</p>
                <p className="text-xs text-slate-400">Suppliers & contractors</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          <Link
            href="/users"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-500 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">User Management</p>
                <p className="text-xs text-slate-400">RBAC & assignments</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
