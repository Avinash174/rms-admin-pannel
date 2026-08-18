"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  FileCheck,
  FileText,
  GitBranch,
  Layers,
  MapPin,
  Package,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getWarehouses } from "@/lib/api/warehouse";
import { getClients } from "@/lib/api/client";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { getVisibleCompanyAdminModules } from "@/lib/company-admin-modules";
import { EntityRef } from "@/lib/types/auth";
import {
  DashboardActivityPanels,
  DashboardError,
  ReportsFooterLink,
  useDashboardData,
} from "./dashboard-shared";
import {
  DashboardFilterBar,
  DashboardFilterState,
  resolveDateRange,
} from "@/components/dashboard/dashboard-filter-bar";

const initialFilterState: DashboardFilterState = {
  companyId: "",
  warehouseId: "ALL",
  datePreset: "THIS_WEEK",
  customFromDate: "",
  customToDate: "",
  status: "ALL",
  operationType: "ALL",
};

export function CompanyAdminDashboard({
  company,
  branch,
}: {
  company?: EntityRef | null;
  branch?: EntityRef | null;
}) {
  const { user, availableBranches, availableWarehouses } = useAuth();
  const hubModules = getVisibleCompanyAdminModules(user);
  const [filterState, setFilterState] = useState<DashboardFilterState>(initialFilterState);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const dateRange = resolveDateRange(
    filterState.datePreset,
    filterState.customFromDate,
    filterState.customToDate
  );

  const data = useDashboardData({
    scopedWarehouseId: filterState.warehouseId !== "ALL" ? filterState.warehouseId : undefined,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    enabled: true,
  });

  // Fetch real database aggregated metrics (Branches, Sites, Warehouses, Boxes, Files)
  const metricsQuery = useQuery({
    queryKey: [
      "company-admin-metrics",
      company?.id,
      filterState.warehouseId,
      dateRange.fromDate,
      dateRange.toDate,
    ],
    queryFn: () =>
      getDashboardMetrics({
        companyId: company?.id,
        warehouseId: filterState.warehouseId !== "ALL" ? filterState.warehouseId : undefined,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      }),
    staleTime: 30_000,
  });

  const warehousesQuery = useQuery({
    queryKey: ["company-admin-warehouses-list", company?.id],
    queryFn: () => getWarehouses(1, 100),
    staleTime: 60_000,
  });

  const clientsQuery = useQuery({
    queryKey: ["company-admin-clients-count", company?.id],
    queryFn: () => getClients(1, 1),
    staleTime: 60_000,
  });

  const handleRefreshAll = async () => {
    setIsManualRefreshing(true);
    await Promise.allSettled([
      data.summaryQuery.refetch(),
      data.operationsQuery.refetch(),
      data.scansQuery.refetch(),
      metricsQuery.refetch(),
      warehousesQuery.refetch(),
      clientsQuery.refetch(),
    ]);
    setTimeout(() => setIsManualRefreshing(false), 600);
  };

  const handleFilterChange = (partial: Partial<DashboardFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilterState(initialFilterState);
  };

  if (data.summaryQuery.error || metricsQuery.error) {
    return <DashboardError onRetry={() => { data.summaryQuery.refetch(); metricsQuery.refetch(); }} />;
  }

  const branchCount = metricsQuery.data?.totalBranches ?? availableBranches.length;
  const siteCount = metricsQuery.data?.totalSites ?? 0;
  const warehouseCount = metricsQuery.data?.totalWarehouses ?? availableWarehouses.length;
  const clientCount = clientsQuery.data?.meta?.total ?? clientsQuery.data?.data?.length ?? 0;
  const boxCount = metricsQuery.data?.totalBoxes ?? 0;
  const fileCount = metricsQuery.data?.totalFiles ?? 0;
  const warehouses = warehousesQuery.data?.data ?? availableWarehouses ?? [];

  const displayName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Company Admin";

  const summary = data.summaryQuery.data;

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Hero Banner Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        {/* Decorative Background Glowing Orbs */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 border border-indigo-400/20 backdrop-blur-md text-xs font-semibold text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Company Active Context · Enterprise Operations
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-white bg-clip-text text-transparent">{displayName}</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Managing <span className="font-semibold text-white">{company?.name ?? "Company"}</span> across all branch sites, storage facilities, clients, and active record archives.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
              {branch?.name && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400" /> Active branch: {branch.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <GitBranch className="h-3.5 w-3.5 text-purple-400" /> {branchCount} branches
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <Warehouse className="h-3.5 w-3.5 text-emerald-400" /> {warehouseCount} warehouses
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRefreshAll}
              disabled={isManualRefreshing}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/15 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-300 ${isManualRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</p>
                <p className="text-sm font-bold text-white">Company Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Scoped Filter Bar */}
      <DashboardFilterBar
        role="COMPANY_ADMIN"
        state={filterState}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        fixedCompanyName={company?.name || "Company"}
        warehouses={warehouses}
        isFetching={metricsQuery.isFetching || data.summaryQuery.isFetching}
      />

      {/* Core Enterprise KPI Metrics Grid (6 Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Company Operational Metrics</h2>
            <p className="text-xs text-slate-500">Live operational overview across your organization</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Real-Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Warehouses */}
          <Link
            href="/warehouses"
            className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Warehouse className="h-4.5 w-4.5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Warehouses</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{metricsQuery.isLoading ? "—" : warehouseCount}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Zap className="h-3 w-3 text-indigo-500" /> Active storage hubs
            </p>
          </Link>

          {/* Branches */}
          <Link
            href="/branches"
            className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitBranch className="h-4.5 w-4.5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Branches</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{metricsQuery.isLoading ? "—" : branchCount}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-purple-500" /> Regional locations
            </p>
          </Link>

          {/* Boxes */}
          <Link
            href="/boxes"
            className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="h-4.5 w-4.5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Boxes</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{metricsQuery.isLoading ? "—" : boxCount}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Boxes className="h-3 w-3 text-blue-500" /> In physical storage
            </p>
          </Link>

          {/* File Records */}
          <Link
            href="/file-records"
            className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">File Records</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{metricsQuery.isLoading ? "—" : fileCount}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <FileCheck className="h-3 w-3 text-amber-500" /> Cataloged files
            </p>
          </Link>

          {/* Clients */}
          <Link
            href="/clients"
            className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="h-4.5 w-4.5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Clients</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{metricsQuery.isLoading ? "—" : clientCount}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-emerald-500" /> Active organizations
            </p>
          </Link>

          {/* Today's Operations */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                Today
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today's Scans</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {data.summaryQuery.isLoading ? "—" : data.todayTotal}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-rose-500" /> Live scan events
            </p>
          </div>
        </div>
      </div>

      {/* Facilities & Storage Capacity Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Warehouses Hubs Cards */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-indigo-600" />
                Active Storage Warehouses
              </h2>
              <p className="text-xs text-slate-500">Connected physical fulfillment facilities and locations</p>
            </div>
            <Link
              href="/warehouses"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              View All <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {metricsQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : warehouses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Warehouse className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No warehouses configured yet.</p>
              <Link
                href="/warehouses"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Create your first warehouse <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {warehouses.map((wh) => (
                <div
                  key={wh.id}
                  className="group relative rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-slate-900 truncate group-hover:text-indigo-700">
                          {wh.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {wh.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {(wh as any).address || (wh as any).city || "Standard Storage Facility"}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Site: <span className="font-medium text-slate-700">{(wh as any).site?.name || (wh as any).siteName || "General"}</span>
                    </span>
                    <Link
                      href={`/rooms?warehouseId=${wh.id}`}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      Structure <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Storage & Operational Status Card */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Operational Integrity
            </h2>
            <p className="text-xs text-slate-500">Live storage and workflow audit health</p>
          </div>

          <div className="space-y-3">
            {/* Missing Files Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Missing Files</p>
                  <p className="text-[10px] text-slate-400">Flagged during audit scans</p>
                </div>
              </div>
              <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                (summary?.missingFilesCount ?? 0) > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {summary?.missingFilesCount ?? 0}
              </span>
            </div>

            {/* Rejected Refiles */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <ScanLine className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Rejected Refiles</p>
                  <p className="text-[10px] text-slate-400">Items requiring verification</p>
                </div>
              </div>
              <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                (summary?.rejectedRefilesCount ?? 0) > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-700"
              }`}>
                {summary?.rejectedRefilesCount ?? 0}
              </span>
            </div>

            {/* Active Mobile Devices */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Active Mobile Scanners</p>
                  <p className="text-[10px] text-slate-400">Connected Android devices</p>
                </div>
              </div>
              <span className="text-sm font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                {summary?.activeDevicesCount ?? 1}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/workflows/inventory-verification"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 transition-colors shadow-sm"
            >
              <ScanLine className="h-4 w-4" /> Run Inventory Verification
            </Link>
          </div>
        </div>
      </div>

      {/* Enterprise Management Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Hub Modules</h2>
            <p className="text-xs text-slate-500">Quickly navigate to company administration modules</p>
          </div>
          <span className="text-xs font-medium text-slate-400">Scoped to {company?.name ?? "Company"}</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {hubModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {module.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{module.description}</p>
                </div>
                <div className="h-7 w-7 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Real-Time Scan Activity & Daily Operations Distribution */}
      <DashboardActivityPanels
        operationsByType={data.operationsByType}
        maxOperationCount={data.maxOperationCount}
        recentScans={data.scansQuery.data ?? []}
        scansLoading={data.scansQuery.isLoading}
        scansFetching={data.scansQuery.isFetching}
        operationsLoading={data.operationsQuery.isLoading}
      />

      <ReportsFooterLink />
    </div>
  );
}
