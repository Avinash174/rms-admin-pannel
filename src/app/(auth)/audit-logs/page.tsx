"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  ScrollText,
  RefreshCw,
  Search,
  X,
  Layers,
  Terminal,
  Activity,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { getAuditLogById, getAuditLogs } from "@/lib/api/audit";
import { AuditEntityType, AuditLog, AuditLogFilters } from "@/lib/types/audit";
import { getUsers } from "@/lib/api/user";

const ENTITY_TYPES: AuditEntityType[] = [
  "BOX",
  "FILE_RECORD",
  "LOCATION",
  "USER",
  "DEVICE"
];

const ACTION_OPTIONS = [
  "FRESH_BOX_MOVE",
  "INVENTORY_VERIFY",
  "REFILE_SUCCESS",
  "REFILE_REJECT_WRONG_LOCATION",
  "REFILE_REJECT_WRONG_BOX",
  "SEGREGATION",
  "BOX_CREATED",
  "LOCATION_OVERRIDE",
  "MERGE"
];

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="space-y-2">
      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</h5>
      <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap shadow-inner border border-slate-800">
        {value ? JSON.stringify(value, null, 2) : "null"}
      </pre>
    </div>
  );
}

export default function AuditLogsPage() {
  const defaultFrom = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const defaultTo = format(new Date(), "yyyy-MM-dd");

  const [page, setPage] = useState(1);
  const [entityIdSearch, setEntityIdSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filters: AuditLogFilters = useMemo(
    () => ({
      ...(actionFilter && { action: actionFilter }),
      ...(entityTypeFilter && { entityType: entityTypeFilter as AuditEntityType }),
      ...(userIdFilter && { userId: userIdFilter }),
      ...(entityIdSearch.trim() && { entityId: entityIdSearch.trim() }),
      from: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
      to: new Date(`${toDate}T23:59:59.999Z`).toISOString()
    }),
    [actionFilter, entityTypeFilter, userIdFilter, entityIdSearch, fromDate, toDate]
  );

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["audit-logs", page, filters],
    queryFn: () => getAuditLogs(filters, page, 20)
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("Audit logs refreshed");
  };

  const { data: usersData } = useQuery({
    queryKey: ["audit-users"],
    queryFn: () => getUsers(1, 100, { isActive: true })
  });

  const { data: detailLog } = useQuery({
    queryKey: ["audit-log-detail", selectedLog?.id],
    queryFn: () => getAuditLogById(selectedLog!.id),
    enabled: !!selectedLog?.id && isDetailsOpen
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  const totalLogs = meta?.total || logs.length;
  const moveLogs = logs.filter((l) => l.action.includes("MOVE")).length;
  const refileLogs = logs.filter((l) => l.action.includes("REFILE")).length;
  const overrideLogs = logs.filter((l) => l.action.includes("OVERRIDE")).length;

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Activity & Audit Logs</h1>
            <p className="text-xs text-slate-500">Immutable audit tracking for system actions, location moves & barcode scans</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl h-9 text-xs" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-violet-600' : ''}`} /> Refresh Logs
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Audit Logs</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalLogs.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><ShieldCheck className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Box Moves</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{moveLogs}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Layers className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Refile Events</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{refileLogs}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Activity className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location Overrides</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{overrideLogs}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Terminal className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search Entity Barcode / ID..."
            value={entityIdSearch}
            onChange={(e) => setEntityIdSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 border rounded-xl px-3 text-xs bg-slate-50/50"
        >
          <option value="">All Workflow Actions</option>
          {ACTION_OPTIONS.map((act) => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>

        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="h-9 border rounded-xl px-3 text-xs bg-slate-50/50"
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>{et}</option>
          ))}
        </select>

        <select
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          className="h-9 border rounded-xl px-3 text-xs bg-slate-50/50"
        >
          <option value="">All Users</option>
          {(usersData?.data || []).map((u: any) => (
            <option key={u.id} value={u.id}>{u.fullName} ({u.employeeCode})</option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={logs}
          meta={meta ? { page: meta.page, pageSize: meta.pageSize || 20, total: meta.total, totalPages: meta.totalPages } : undefined}
          onPageChange={setPage}
          onCustomAction={(log: any) => {
            setSelectedLog(log);
            setIsDetailsOpen(true);
          }}
        />
      </div>

      {/* Right Slide-Over Details Drawer */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-lg w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                    Audit Log Detail
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{selectedLog?.action}</h3>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4 text-xs pt-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-slate-700">
                  <div><strong>Log ID:</strong> <span className="font-mono text-[10px]">{selectedLog?.id}</span></div>
                  <div><strong>Timestamp:</strong> {selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "-"}</div>
                </div>

                <JsonBlock title="Previous State" value={detailLog?.previousState || selectedLog?.previousState} />
                <JsonBlock title="New State" value={detailLog?.newState || selectedLog?.newState} />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsDetailsOpen(false)}>Close Drawer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
