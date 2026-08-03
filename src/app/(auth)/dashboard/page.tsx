"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ScanLine,
  Smartphone,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { can } from "@/lib/permissions";
import {
  getOperationsByDay,
  getRecentScans,
  getReportsSummary
} from "@/lib/api/reports-summary";
import { OperationTypeKey } from "@/lib/types/reports-summary";
import { Skeleton } from "@/components/ui/skeleton";

const OPERATION_TYPES: OperationTypeKey[] = [
  "INTAKE",
  "FRESH_BOX",
  "INVENTORY",
  "REFILE",
  "SEGREGATION"
];

const TYPE_LABELS: Record<OperationTypeKey, string> = {
  INTAKE: "Intake",
  FRESH_BOX: "Fresh Box",
  INVENTORY: "Inventory",
  REFILE: "Refile",
  SEGREGATION: "Segregation",
  LOOKUP: "Lookup"
};

const TYPE_COLORS: Record<OperationTypeKey, string> = {
  INTAKE: "bg-violet-500",
  FRESH_BOX: "bg-blue-500",
  INVENTORY: "bg-emerald-500",
  REFILE: "bg-amber-500",
  SEGREGATION: "bg-rose-500",
  LOOKUP: "bg-slate-400"
};

function sumOperations(counts: Record<OperationTypeKey, number>): number {
  return OPERATION_TYPES.reduce((total, type) => total + (counts[type] ?? 0), 0);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canView = can("report:view", user) || can("dashboard:view", user);

  const from = useMemo(
    () => subDays(new Date(), 7).toISOString(),
    []
  );
  const to = useMemo(() => new Date().toISOString(), []);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => getReportsSummary(),
    enabled: canView,
    refetchInterval: 60_000
  });

  const {
    data: operationsByDay = [],
    isLoading: operationsLoading
  } = useQuery({
    queryKey: ["operations-by-day", from, to],
    queryFn: () => getOperationsByDay(from, to),
    enabled: canView
  });

  const {
    data: recentScans = [],
    isLoading: scansLoading,
    isFetching: scansFetching
  } = useQuery({
    queryKey: ["recent-scans"],
    queryFn: () => getRecentScans(10),
    enabled: canView,
    refetchInterval: 5000
  });

  const operationsByType = useMemo(() => {
    const totals: Record<OperationTypeKey, number> = {
      INTAKE: 0,
      FRESH_BOX: 0,
      INVENTORY: 0,
      REFILE: 0,
      SEGREGATION: 0,
      LOOKUP: 0
    };

    for (const entry of operationsByDay) {
      for (const type of OPERATION_TYPES) {
        totals[type] += entry.counts[type] ?? 0;
      }
    }

    return totals;
  }, [operationsByDay]);

  const maxOperationCount = Math.max(...OPERATION_TYPES.map((type) => operationsByType[type]), 1);
  const todayTotal = summary ? sumOperations(summary.todayOperationsByType) : 0;

  if (!canView) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <XCircle className="mb-3 h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">Access denied</h2>
        <p className="mt-1 text-sm text-slate-500">You do not have permission to view the dashboard.</p>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-slate-600">Failed to load dashboard data.</p>
        <button
          onClick={() => refetchSummary()}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Live operational overview for your company.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))
        ) : (
          <>
            <MetricCard
              title="Today's Operations"
              value={todayTotal.toString()}
              icon={Activity}
              tone="blue"
            />
            <MetricCard
              title="Missing Files"
              value={(summary?.missingFilesCount ?? 0).toString()}
              icon={AlertTriangle}
              tone={summary && summary.missingFilesCount > 0 ? "danger" : "emerald"}
            />
            <MetricCard
              title="Active Devices"
              value={(summary?.activeDevicesCount ?? 0).toString()}
              icon={Smartphone}
              tone="purple"
            />
            <MetricCard
              title="Rejected Refiles (7d)"
              value={(summary?.rejectedRefilesCount ?? 0).toString()}
              icon={XCircle}
              tone={summary && summary.rejectedRefilesCount > 0 ? "amber" : "slate"}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Live Scan Ticker</h2>
              <p className="text-xs text-slate-400">Recent workflow events (refreshes every 5s)</p>
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Operations by Type (7 days)</h2>
          <p className="mb-5 text-xs text-slate-400">Aggregated from /reports/operations-by-day</p>

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

      <div className="flex justify-end">
        <Link
          href="/reports"
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ScanLine className="mr-2 h-4 w-4" />
          Open Reports
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone
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
    slate: "border-slate-100 bg-slate-50 text-slate-700"
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
