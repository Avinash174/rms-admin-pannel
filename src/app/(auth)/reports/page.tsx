"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  Download,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  REPORT_CHART_TYPES,
  REPORT_TYPE_COLORS,
  REPORT_TYPE_LABELS,
  ReportExportType,
  ReportFilters
} from "@/lib/types/reports";
import { OperationTypeKey } from "@/lib/types/reports-summary";

const TYPE_LABELS: Record<OperationTypeKey, string> = {
  INTAKE: "Intake",
  FRESH_BOX: "Fresh Box",
  INVENTORY: "Inventory",
  REFILE: "Refile",
  SEGREGATION: "Segregation",
  LOOKUP: "Lookup"
};

function toIsoStart(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function toIsoEnd(date: string) {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}

function ReportCard({
  title,
  exportType,
  filters,
  children,
  onExport,
  exporting
}: {
  title: string;
  exportType: ReportExportType;
  filters: ReportFilters;
  children: React.ReactNode;
  onExport: (type: ReportExportType, filters: ReportFilters) => void;
  exporting: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <Button
          variant="outline"
          className="rounded-xl h-9 px-3 text-sm"
          disabled={exporting}
          onClick={() => onExport(exportType, filters)}
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
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

  const productivityRows = useMemo(
    () => [...(productivityQuery.data || [])].sort((a, b) => b.scanCount - a.scanCount),
    [productivityQuery.data]
  );

  const maxDailyTotal = useMemo(() => {
    const rows = operationsQuery.data || [];
    return Math.max(
      1,
      ...rows.map((row) =>
        REPORT_CHART_TYPES.reduce((sum, type) => sum + (row.counts[type] ?? 0), 0)
      )
    );
  }, [operationsQuery.data]);

  const handleExport = async (type: ReportExportType, exportFilters: ReportFilters) => {
    try {
      setExportingType(type);
      await downloadReportExport(type, exportFilters);
      toast.success(`${REPORT_TYPE_LABELS[type]} exported`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExportingType(null);
    }
  };

  const refetchAll = () => {
    operationsQuery.refetch();
    productivityQuery.refetch();
    occupancyQuery.refetch();
    missingQuery.refetch();
    holdingsQuery.refetch();
  };

  const isLoading =
    operationsQuery.isLoading ||
    productivityQuery.isLoading ||
    occupancyQuery.isLoading ||
    missingQuery.isLoading ||
    holdingsQuery.isLoading;

  const hasError =
    operationsQuery.error ||
    productivityQuery.error ||
    occupancyQuery.error ||
    missingQuery.error ||
    holdingsQuery.error;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Operational analytics with date range and warehouse filters.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={refetchAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="from-date" className="text-xs uppercase text-slate-500">
            From
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="to-date" className="text-xs uppercase text-slate-500">
            To
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 rounded-xl"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="warehouse" className="text-xs uppercase text-slate-500">
            Warehouse
          </Label>
          <select
            id="warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">All warehouses</option>
            {(warehousesData?.data || []).map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} — {warehouse.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {hasError && !isLoading && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <Button onClick={refetchAll} variant="outline" className="rounded-xl">
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !hasError && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportCard
            title="Operations by Day"
            exportType="OPERATIONS_BY_DAY"
            filters={filters}
            onExport={handleExport}
            exporting={exportingType === "OPERATIONS_BY_DAY"}
          >
            {(operationsQuery.data || []).length === 0 ? (
              <p className="text-sm text-slate-500">No operations in selected range.</p>
            ) : (
              <div className="space-y-4">
                {(operationsQuery.data || []).map((entry) => {
                  const total = REPORT_CHART_TYPES.reduce(
                    (sum, type) => sum + (entry.counts[type] ?? 0),
                    0
                  );
                  return (
                    <div key={entry.date} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{entry.date}</span>
                        <span className="text-slate-500">{total} ops</span>
                      </div>
                      <div className="flex h-6 rounded-lg overflow-hidden bg-slate-100">
                        {REPORT_CHART_TYPES.map((type) => {
                          const count = entry.counts[type] ?? 0;
                          if (count === 0) return null;
                          const width = `${Math.max((count / maxDailyTotal) * 100, 4)}%`;
                          return (
                            <div
                              key={`${entry.date}-${type}`}
                              className={`${REPORT_TYPE_COLORS[type]} h-full`}
                              style={{ width }}
                              title={`${TYPE_LABELS[type]}: ${count}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-3 pt-2">
                  {REPORT_CHART_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`w-2.5 h-2.5 rounded-full ${REPORT_TYPE_COLORS[type]}`} />
                      {TYPE_LABELS[type]}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportCard>

          <ReportCard
            title="Operator Productivity"
            exportType="PRODUCTIVITY"
            filters={filters}
            onExport={handleExport}
            exporting={exportingType === "PRODUCTIVITY"}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b">
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2">Scans</th>
                  </tr>
                </thead>
                <tbody>
                  {productivityRows.slice(0, 12).map((row) => (
                    <tr key={`${row.userId}-${row.date}`} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-medium">{row.fullName}</td>
                      <td className="py-2 pr-3">{row.date}</td>
                      <td className="py-2 font-semibold">{row.scanCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard>

          <ReportCard
            title="Location Occupancy"
            exportType="OCCUPANCY"
            filters={filters}
            onExport={handleExport}
            exporting={exportingType === "OCCUPANCY"}
          >
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b">
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">Capacity</th>
                    <th className="py-2 pr-3">Occupied</th>
                    <th className="py-2">% Full</th>
                  </tr>
                </thead>
                <tbody>
                  {(occupancyQuery.data || []).slice(0, 50).map((row) => {
                    const percent = row.capacity > 0 ? (row.occupied / row.capacity) * 100 : 0;
                    const tone =
                      percent > 100
                        ? "text-rose-700 bg-rose-50"
                        : percent > 80
                          ? "text-amber-700 bg-amber-50"
                          : "text-slate-700";
                    return (
                      <tr key={row.locationBarcode} className="border-b border-slate-50">
                        <td className="py-2 pr-3 font-mono text-xs">{row.locationBarcode}</td>
                        <td className="py-2 pr-3">{row.warehouseCode}</td>
                        <td className="py-2 pr-3">{row.capacity}</td>
                        <td className="py-2 pr-3">{row.occupied}</td>
                        <td className={`py-2 px-2 rounded-lg text-xs font-semibold ${tone}`}>
                          {Math.round(percent)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ReportCard>

          <ReportCard
            title="Missing Files"
            exportType="MISSING_FILES"
            filters={filters}
            onExport={handleExport}
            exporting={exportingType === "MISSING_FILES"}
          >
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b">
                    <th className="py-2 pr-3">File</th>
                    <th className="py-2 pr-3">Box</th>
                    <th className="py-2 pr-3">Last Location</th>
                    <th className="py-2">Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {(missingQuery.data || []).slice(0, 50).map((row) => (
                    <tr key={row.fileId} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-mono text-xs">{row.fileBarcode}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{row.boxBarcode}</td>
                      <td className="py-2 pr-3">
                        {row.lastSeenLocationBarcode || row.lastSeenLocationName || "—"}
                      </td>
                      <td className="py-2">
                        {new Date(row.flaggedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard>

          <ReportCard
            title="Client Holdings"
            exportType="CLIENT_HOLDINGS"
            filters={filters}
            onExport={handleExport}
            exporting={exportingType === "CLIENT_HOLDINGS"}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b">
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Boxes</th>
                    <th className="py-2">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {(holdingsQuery.data || []).map((row) => (
                    <tr key={row.clientCode} className="border-b border-slate-50">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{row.clientName}</div>
                        <div className="text-xs text-slate-500">{row.clientCode}</div>
                      </td>
                      <td className="py-2 pr-3 font-semibold">{row.boxCount}</td>
                      <td className="py-2 font-semibold">{row.fileCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard>
        </div>
      )}
    </div>
  );
}
