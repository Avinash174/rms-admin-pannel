"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Building2,
  Layers,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ScanLine,
  Smartphone,
  Warehouse,
  XCircle,
} from "lucide-react";
import { getOccupancyReport } from "@/lib/api/reports";
import {
  getOperationsByDay,
  getRecentScans,
  getReportsSummary,
} from "@/lib/api/reports-summary";
import { getRooms } from "@/lib/api/room";
import { OperationTypeKey } from "@/lib/types/reports-summary";
import { Skeleton } from "@/components/ui/skeleton";

export const OPERATION_TYPES: OperationTypeKey[] = [
  "INTAKE",
  "FRESH_BOX",
  "INVENTORY",
  "REFILE",
  "SEGREGATION",
];

export const TYPE_LABELS: Record<OperationTypeKey, string> = {
  INTAKE: "Intake",
  FRESH_BOX: "Fresh Box",
  INVENTORY: "Inventory",
  REFILE: "Refile",
  SEGREGATION: "Segregation",
  LOOKUP: "Lookup",
};

export const TYPE_COLORS: Record<OperationTypeKey, string> = {
  INTAKE: "bg-violet-500",
  FRESH_BOX: "bg-blue-500",
  INVENTORY: "bg-emerald-500",
  REFILE: "bg-amber-500",
  SEGREGATION: "bg-rose-500",
  LOOKUP: "bg-slate-400",
};

export const QUICK_LINKS = [
  { href: "/rooms", label: "Rooms", icon: Layers },
  { href: "/boxes", label: "Boxes", icon: Package },
  { href: "/workflows/inventory-verification", label: "Inventory Audit", icon: ScanLine },
  { href: "/reports", label: "Reports", icon: Activity },
];

export function sumOperations(counts: Record<OperationTypeKey, number>): number {
  return OPERATION_TYPES.reduce((total, type) => total + (counts[type] ?? 0), 0);
}

export interface DashboardDataFilters {
  scopedWarehouseId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  operationType?: string;
  enabled?: boolean;
}

export function useDashboardData(
  scopedWarehouseIdOrFilters?: string | DashboardDataFilters,
  enabledFlag = true
) {
  const options: DashboardDataFilters = typeof scopedWarehouseIdOrFilters === 'object' && scopedWarehouseIdOrFilters !== null
    ? scopedWarehouseIdOrFilters
    : { scopedWarehouseId: scopedWarehouseIdOrFilters, enabled: enabledFlag };

  const scopedWarehouseId = options.scopedWarehouseId;
  const enabled = options.enabled !== undefined ? options.enabled : true;
  const from = options.fromDate || subDays(new Date(), 7).toISOString();
  const to = options.toDate || new Date().toISOString();

  const summaryQuery = useQuery({
    queryKey: ["reports-summary", scopedWarehouseId, options.fromDate, options.toDate, options.status, options.operationType],
    queryFn: () => getReportsSummary(scopedWarehouseId),
    enabled,
    refetchInterval: 60_000,
  });

  const operationsQuery = useQuery({
    queryKey: ["operations-by-day", from, to, scopedWarehouseId, options.operationType],
    queryFn: () => getOperationsByDay(from, to, scopedWarehouseId),
    enabled,
  });

  const scansQuery = useQuery({
    queryKey: ["recent-scans", scopedWarehouseId, options.operationType],
    queryFn: () => getRecentScans(10, scopedWarehouseId),
    enabled,
    refetchInterval: 5000,
  });

  const occupancyQuery = useQuery({
    queryKey: ["dashboard-occupancy", scopedWarehouseId],
    queryFn: () => getOccupancyReport({ warehouseId: scopedWarehouseId }),
    enabled: enabled && Boolean(scopedWarehouseId),
  });

  const roomsQuery = useQuery({
    queryKey: ["dashboard-rooms", scopedWarehouseId],
    queryFn: () => getRooms(scopedWarehouseId!),
    enabled: enabled && Boolean(scopedWarehouseId),
  });

  const operationsByType = useMemo(() => {
    const totals: Record<OperationTypeKey, number> = {
      INTAKE: 0,
      FRESH_BOX: 0,
      INVENTORY: 0,
      REFILE: 0,
      SEGREGATION: 0,
      LOOKUP: 0,
    };

    for (const entry of operationsQuery.data ?? []) {
      for (const type of OPERATION_TYPES) {
        totals[type] += entry.counts[type] ?? 0;
      }
    }

    return totals;
  }, [operationsQuery.data]);

  const occupancyStats = useMemo(() => {
    const occupancy = occupancyQuery.data ?? [];
    const total = occupancy.length;
    const occupied = occupancy.reduce((sum, row) => sum + row.occupied, 0);
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, pct };
  }, [occupancyQuery.data]);

  const maxOperationCount = Math.max(...OPERATION_TYPES.map((type) => operationsByType[type]), 1);
  const todayTotal = summaryQuery.data ? sumOperations(summaryQuery.data.todayOperationsByType) : 0;
  const roomCount = roomsQuery.data?.data?.length ?? 0;

  return {
    summaryQuery,
    operationsQuery,
    scansQuery,
    occupancyQuery,
    roomsQuery,
    operationsByType,
    occupancyStats,
    maxOperationCount,
    todayTotal,
    roomCount,
  };
}

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-96 flex-col items-center justify-center space-y-4">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <p className="text-sm text-slate-600">Failed to load dashboard data.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "emerald" | "purple" | "amber" | "danger" | "slate";
}) {
  const toneClasses = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    purple: "border-purple-100 bg-purple-50 text-purple-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    danger: "border-red-100 bg-red-50 text-red-700",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <Icon className="h-6 w-6 opacity-80" />
      </div>
    </div>
  );
}

type DashboardPanelsProps = {
  warehouseScoped?: boolean;
  warehouseName?: string;
  operationsByType: Record<OperationTypeKey, number>;
  maxOperationCount: number;
  recentScans: Array<{ id: string; barcode: string; type: string; userName: string; scannedAt: string }>;
  scansLoading: boolean;
  scansFetching: boolean;
  operationsLoading: boolean;
  hideRecentActivities?: boolean;
};

export function DashboardActivityPanels({
  warehouseScoped,
  warehouseName,
  operationsByType,
  maxOperationCount,
  recentScans,
  scansLoading,
  scansFetching,
  operationsLoading,
  hideRecentActivities = false,
}: DashboardPanelsProps) {
  return (
    <div className={`grid grid-cols-1 gap-6 ${hideRecentActivities ? "" : "lg:grid-cols-2"}`}>
      {!hideRecentActivities && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {warehouseScoped ? "Warehouse Activity" : "Recent Activities"}
              </h2>
              <p className="text-xs text-slate-400">
                {warehouseScoped
                  ? `Recent scans in ${warehouseName ?? "this warehouse"}`
                  : "Recent workflow events (refreshes every 5s)"}
              </p>
            </div>
            {scansFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>

          {scansLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No recent scans yet.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-slate-900">{scan.barcode}</p>
                    <p className="truncate text-xs text-slate-500">
                      {scan.userName} · {scan.type.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="ml-3 whitespace-nowrap text-xs text-slate-400">
                    {format(new Date(scan.scannedAt), "HH:mm:ss")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {warehouseScoped ? "Warehouse Operations (7 days)" : "Today's Operations (7 days)"}
        </h2>
        <p className="mb-5 text-xs text-slate-400">Activity breakdown by operation type</p>

        {operationsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {OPERATION_TYPES.map((type) => {
              const count = operationsByType[type];
              const width = `${Math.max((count / maxOperationCount) * 100, count > 0 ? 8 : 0)}%`;
              return (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{TYPE_LABELS[type]}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className={`h-3 rounded-full transition-all ${TYPE_COLORS[type]}`}
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function WarehouseContextHeader({
  warehouseName,
  warehouseCode,
  companyName,
  branchName,
}: {
  warehouseName?: string;
  warehouseCode?: string;
  companyName?: string;
  branchName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
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
            Warehouse Active Hub · Operational Command
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {warehouseName ?? "Warehouse Dashboard"}
            {warehouseCode && (
              <span className="ml-2 text-sm font-medium text-slate-400">({warehouseCode})</span>
            )}
          </h1>
          
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
            {companyName && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <Building2 className="h-3.5 w-3.5 text-blue-400" /> {companyName}
              </span>
            )}
            {branchName && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <MapPin className="h-3.5 w-3.5 text-purple-400" /> {branchName}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-md"
              >
                <Icon className="h-3.5 w-3.5 text-blue-300" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReportsFooterLink({ warehouseScoped }: { warehouseScoped?: boolean }) {
  return (
    <div className="flex justify-end">
      <Link
        href="/reports"
        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ScanLine className="mr-2 h-4 w-4" />
        {warehouseScoped ? "Warehouse Reports" : "Open Reports"}
      </Link>
    </div>
  );
}

export function SummaryMetricRow({
  summaryLoading,
  todayTotal,
  summary,
  warehouseScoped,
  hideTodaysOperations,
  hideFileMetrics,
}: {
  summaryLoading: boolean;
  todayTotal: number;
  summary?: { missingFilesCount: number; activeDevicesCount: number; rejectedRefilesCount: number };
  warehouseScoped?: boolean;
  hideTodaysOperations?: boolean;
  hideFileMetrics?: boolean;
}) {
  const showOperations = !warehouseScoped && !hideTodaysOperations;
  const showMissingFiles = !hideFileMetrics;
  const showActiveDevices = true;
  const showRejectedRefiles = !hideFileMetrics;

  const activeCards = [
    showOperations,
    showMissingFiles,
    showActiveDevices,
    showRejectedRefiles,
  ].filter(Boolean).length;

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-${activeCards}`}>
      {summaryLoading ? (
        Array.from({ length: activeCards }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))
      ) : (
        <>
          {showOperations && (
            <MetricCard title="Today's Operations" value={todayTotal.toString()} icon={Activity} tone="blue" />
          )}
          {showMissingFiles && (
            <MetricCard
              title="Missing Files"
              value={(summary?.missingFilesCount ?? 0).toString()}
              icon={AlertTriangle}
              tone={summary && summary.missingFilesCount > 0 ? "danger" : "emerald"}
            />
          )}
          {showActiveDevices && (
            <MetricCard
              title="Active Devices"
              value={(summary?.activeDevicesCount ?? 0).toString()}
              icon={Smartphone}
              tone="purple"
            />
          )}
          {showRejectedRefiles && (
            <MetricCard
              title="Rejected Refiles (7d)"
              value={(summary?.rejectedRefilesCount ?? 0).toString()}
              icon={XCircle}
              tone={summary && summary.rejectedRefilesCount > 0 ? "amber" : "slate"}
            />
          )}
        </>
      )}
    </div>
  );
}

export function WarehouseStructureMetrics({
  loading,
  roomCount,
  occupancyStats,
  todayTotal,
}: {
  loading: boolean;
  roomCount: number;
  occupancyStats: { total: number; pct: number };
  todayTotal: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
      ) : (
        <>
          <MetricCard title="Rooms" value={roomCount.toString()} icon={Layers} tone="blue" />
          <MetricCard title="Storage Locations" value={occupancyStats.total.toString()} icon={MapPin} tone="purple" />
          <MetricCard
            title="Occupied Slots"
            value={`${occupancyStats.pct}%`}
            icon={Boxes}
            tone={occupancyStats.pct > 80 ? "amber" : "emerald"}
          />
          <MetricCard title="Today's Operations" value={todayTotal.toString()} icon={Activity} tone="blue" />
        </>
      )}
    </div>
  );
}
