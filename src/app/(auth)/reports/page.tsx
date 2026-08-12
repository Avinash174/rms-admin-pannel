"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import {
  BarChart3,
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  FileQuestion,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWarehouses } from "@/lib/api/warehouse";
import {
  downloadReportExport,
  getClientHoldingsReport,
  getMissingFilesReport,
  getOccupancyReport,
  getOperationsByDayReport,
  getProductivityReport
} from "@/lib/api/reports";
import {
  REPORT_TYPE_LABELS,
  ReportExportType,
  ReportFilters
} from "@/lib/types/reports";
import { OperationTypeKey } from "@/lib/types/reports-summary";

function toIsoStart(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function toIsoEnd(date: string) {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}

export default function ReportsPage() {
  const defaultFrom = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const defaultTo = format(new Date(), "yyyy-MM-dd");

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [warehouseId, setWarehouseId] = useState("");
  const [exportingType, setExportingType] = useState<ReportExportType | null>(null);

  const filters: ReportFilters = useMemo(
    () => ({
      from: toIsoStart(fromDate),
      to: toIsoEnd(toDate),
      ...(warehouseId && { warehouseId })
    }),
    [fromDate, toDate, warehouseId]
  );

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-for-reports"],
    queryFn: () => getWarehouses(1, 100)
  });

  const operationsQuery = useQuery({
    queryKey: ["report-operations-by-day", filters],
    queryFn: () => getOperationsByDayReport(filters)
  });

  const productivityQuery = useQuery({
    queryKey: ["report-productivity", filters],
    queryFn: () => getProductivityReport(filters)
  });

  const occupancyQuery = useQuery({
    queryKey: ["report-occupancy", filters],
    queryFn: () => getOccupancyReport(filters)
  });

  const missingQuery = useQuery({
    queryKey: ["report-missing-files", filters],
    queryFn: () => getMissingFilesReport(filters)
  });

  const holdingsQuery = useQuery({
    queryKey: ["report-client-holdings", filters],
    queryFn: () => getClientHoldingsReport(filters)
  });

  const handleExport = async (type: ReportExportType, exportFilters: ReportFilters) => {
    try {
      setExportingType(type);
      await downloadReportExport(type, exportFilters);
      toast.success(`${REPORT_TYPE_LABELS[type]} exported successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExportingType(null);
    }
  };

  const isFetchingAll =
    operationsQuery.isFetching ||
    productivityQuery.isFetching ||
    occupancyQuery.isFetching ||
    missingQuery.isFetching ||
    holdingsQuery.isFetching;

  const refetchAll = async () => {
    await Promise.all([
      operationsQuery.refetch(),
      productivityQuery.refetch(),
      occupancyQuery.refetch(),
      missingQuery.refetch(),
      holdingsQuery.refetch()
    ]);
    toast.success("Analytics reports refreshed");
  };

  const totalScans = useMemo(() => {
    return (productivityQuery.data || []).reduce((acc, p) => acc + p.scanCount, 0);
  }, [productivityQuery.data]);

  const totalOccupied = useMemo(() => {
    return (occupancyQuery.data || []).reduce((acc, o) => acc + o.occupied, 0);
  }, [occupancyQuery.data]);

  const totalCapacity = useMemo(() => {
    return (occupancyQuery.data || []).reduce((acc, o) => acc + o.capacity, 0);
  }, [occupancyQuery.data]);

  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Operational Analytics & Reports</h1>
            <p className="text-xs text-slate-500">Warehouse occupancy, operator productivity & daily movement breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl text-xs h-9" onClick={refetchAll} disabled={isFetchingAll}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetchingAll ? 'animate-spin text-blue-600' : ''}`} /> Refresh Analytics
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Scans</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalScans.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> Active Period Total
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{occupancyPct}%</h3>
            <span className="text-[10px] text-slate-500 font-medium mt-1">
              {totalOccupied} / {totalCapacity} slots occupied
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Layers className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Missing Files</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{(missingQuery.data || []).length}</h3>
            <span className="text-[10px] text-rose-500 font-bold mt-1">Audit Exceptions</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><FileQuestion className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Clients</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{(holdingsQuery.data || []).length}</h3>
            <span className="text-[10px] text-emerald-600 font-bold mt-1">Holdings Tracked</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Building2 className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From Date</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To Date</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Warehouse Filter</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
          >
            <option value="">All Warehouses</option>
            {(warehousesData?.data || []).map((w: any) => (
              <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operations by Day Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Operations Daily Breakdown</h3>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-8 text-xs"
              disabled={exportingType === "OPERATIONS_BY_DAY"}
              onClick={() => handleExport("OPERATIONS_BY_DAY", filters)}
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <div className="space-y-3">
            {(operationsQuery.data || []).slice(0, 7).map((op: any, i: number) => (
              <div key={i} className="bg-slate-50/70 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{op.date}</span>
                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-blue-600">Fresh: {op.counts?.FRESH_BOX || 0}</span>
                  <span className="text-emerald-600">Refile: {op.counts?.REFILE || 0}</span>
                  <span className="text-violet-600">Intake: {op.counts?.INTAKE || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operator Productivity Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Operator Productivity Leaderboard</h3>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-8 text-xs"
              disabled={exportingType === "PRODUCTIVITY"}
              onClick={() => handleExport("PRODUCTIVITY", filters)}
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <div className="space-y-3">
            {(productivityQuery.data || []).slice(0, 7).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </div>
                  <span className="font-bold text-slate-800">{p.fullName || p.userId}</span>
                </div>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {p.scanCount} Scans
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
