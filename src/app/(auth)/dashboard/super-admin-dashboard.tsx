"use client";

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
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getSuperAdminSummary } from "@/lib/api/dashboard";
import { EntityRef } from "@/lib/types/auth";
import { DashboardError, useDashboardData } from "./dashboard-shared";

export function SuperAdminDashboard({ company }: { company?: EntityRef | null }) {
  const { user } = useAuth();
  const data = useDashboardData(undefined, true);

  const summaryQuery = useQuery({
    queryKey: ["super-admin-summary"],
    queryFn: getSuperAdminSummary,
    staleTime: 60_000,
  });

  if (data.summaryQuery.error) {
    return <DashboardError onRetry={() => data.summaryQuery.refetch()} />;
  }

  const summary = summaryQuery.data;
  const isLoading = summaryQuery.isLoading;

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Super Admin';

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Hero Banner Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        {/* Decorative Background Glowing Orbs */}
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
              {company?.name
                ? `Active Context: ${company.name} — Full system oversight across all enterprise entities.`
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
                <p className="text-sm font-bold text-white">Unrestricted (Global)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Infrastructure Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Core Platform Metrics</h2>
            <p className="text-xs text-slate-500">High-level enterprise totals across all connected hubs</p>
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
                Accounts
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalUsers ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" /> Verified system users
            </p>
          </div>

          {/* Boxes Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="h-5.5 w-5.5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Inventory
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Boxes</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{isLoading ? "—" : summary?.totalBoxes ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-amber-500" /> Tracked inventory boxes
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Structure Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sub-Entity Network Breakdown */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Entity Network Structure</h3>
              <p className="text-xs text-slate-500">Sub-organization and client relationships overview</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <GitBranch className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold">Branches</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? "—" : summary?.totalBranches ?? 0}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold">Sites</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? "—" : summary?.totalSites ?? 0}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold">Clients</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? "—" : summary?.totalClients ?? 0}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Building2 className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold">Vendors</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? "—" : summary?.totalVendors ?? 0}</p>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick System Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/companies"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-xs font-bold text-slate-700 hover:text-blue-700 transition-all group"
              >
                <span>Companies</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/warehouses"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all group"
              >
                <span>Warehouses</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/users"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40 text-xs font-bold text-slate-700 hover:text-purple-700 transition-all group"
              >
                <span>Users & Roles</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/audit"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all group"
              >
                <span>Audit Logs</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* System Telemetry & Devices */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">System Telemetry</h3>
                  <p className="text-xs text-slate-500">Connected hardware devices</p>
                </div>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Active Mobile Scanners</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {data.summaryQuery.data?.activeDevicesCount ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full w-3/4 transition-all duration-500" />
              </div>
              <p className="text-[11px] text-slate-400">Handheld RFID/Barcode mobile scanners online</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/reports"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <FileCheck className="h-4 w-4 text-blue-400" />
              Open System Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
