"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Building2,
  GitBranch,
  MapPin,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getBranches } from "@/lib/api/branch";
import { getWarehouses } from "@/lib/api/warehouse";
import { getVisibleCompanyAdminModules } from "@/lib/company-admin-modules";
import { EntityRef } from "@/lib/types/auth";
import {
  DashboardActivityPanels,
  DashboardError,
  MetricCard,
  ReportsFooterLink,
  SummaryMetricRow,
  useDashboardData,
} from "./dashboard-shared";

export function CompanyAdminDashboard({
  company,
  branch,
}: {
  company?: EntityRef | null;
  branch?: EntityRef | null;
}) {
  const { user, availableBranches, availableWarehouses } = useAuth();
  const hubModules = getVisibleCompanyAdminModules(user);
  const data = useDashboardData(undefined, true);

  const scopeQuery = useQuery({
    queryKey: ["company-admin-scope", company?.id],
    queryFn: async () => {
      const [branches, warehouses] = await Promise.all([getBranches(1, 1), getWarehouses(1, 1)]);
      return {
        branches: branches.meta?.total ?? branches.data?.length ?? 0,
        warehouses: warehouses.meta?.total ?? warehouses.data?.length ?? 0,
      };
    },
    enabled: Boolean(company?.id),
  });

  if (data.summaryQuery.error) {
    return <DashboardError onRetry={() => data.summaryQuery.refetch()} />;
  }

  const branchCount = scopeQuery.data?.branches ?? availableBranches.length;
  const warehouseCount = scopeQuery.data?.warehouses ?? availableWarehouses.length;

  return (
    <div className="space-y-6">
      {/* Premium Hero Banner Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        {/* Decorative Background Glowing Orbs */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 border border-indigo-400/20 backdrop-blur-md text-xs font-semibold text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Company Active Context · Enterprise Management
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {company?.name ?? "Company Dashboard"}
            </h1>
            
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
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
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Level</p>
                <p className="text-sm font-bold text-white">Company Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Branches"
          value={scopeQuery.isLoading ? "—" : String(branchCount)}
          icon={GitBranch}
          tone="purple"
        />
        <MetricCard
          title="Warehouses"
          value={scopeQuery.isLoading ? "—" : String(warehouseCount)}
          icon={Warehouse}
          tone="emerald"
        />
        <MetricCard
          title="Today's Operations"
          value={data.summaryQuery.isLoading ? "—" : String(data.todayTotal)}
          icon={Activity}
          tone="blue"
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <p className="mb-4 text-sm text-slate-500">
          Modules available for your assigned company based on your permissions.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {hubModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    {module.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SummaryMetricRow
        summaryLoading={data.summaryQuery.isLoading}
        todayTotal={data.todayTotal}
        summary={data.summaryQuery.data}
      />

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
