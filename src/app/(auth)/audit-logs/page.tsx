"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Terminal,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h5>
      <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap">
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["audit-logs", page, filters],
    queryFn: () => getAuditLogs(filters, page, 20)
  });

  const { data: usersData } = useQuery({
    queryKey: ["audit-users"],
    queryFn: () => getUsers(1, 100, { isActive: true })
  });

  const { data: detailLog, isLoading: detailLoading } = useQuery({
    queryKey: ["audit-log-detail", selectedLog?.id],
    queryFn: () => getAuditLogById(selectedLog!.id),
    enabled: !!selectedLog?.id && isDetailsOpen
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const logs = data?.data || [];
  const tableMeta = data?.meta
    ? {
        page: data.meta.page,
        pageSize: data.meta.pageSize || data.meta.limit || 20,
        total: data.meta.total,
        totalPages: data.meta.totalPages
      }
    : undefined;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Filter workflow and master-data changes with before/after state details.
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <Label className="text-xs uppercase text-slate-500">Action</Label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase text-slate-500">Entity type</Label>
          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase text-slate-500">User</Label>
          <select
            value={userIdFilter}
            onChange={(e) => {
              setUserIdFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
          >
            <option value="">All users</option>
            {(usersData?.data || []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName || user.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase text-slate-500">From</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs uppercase text-slate-500">To</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs uppercase text-slate-500">Entity ID / barcode</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={entityIdSearch}
              onChange={(e) => {
                setEntityIdSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search barcode..."
              className="pl-10 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm">
        <DataTable
          columns={columns}
          data={logs}
          meta={tableMeta}
          onPageChange={setPage}
          onCustomAction={(log: AuditLog) => {
            setSelectedLog(log);
            setIsDetailsOpen(true);
          }}
        />
      </div>

      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setIsDetailsOpen(false)}
        />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div
            className={`w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Audit Detail</h3>
              </div>
              <Button
                onClick={() => setIsDetailsOpen(false)}
                variant="ghost"
                className="h-9 w-9 p-0 rounded-full"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}

              {!detailLoading && (detailLog || selectedLog) && (
                <>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-slate-500">Action:</span>{" "}
                      {(detailLog || selectedLog)!.action}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Entity:</span>{" "}
                      {(detailLog || selectedLog)!.entityType}{" "}
                      {(detailLog || selectedLog)!.entityId || "—"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">User:</span>{" "}
                      {(detailLog || selectedLog)!.userName}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Device:</span>{" "}
                      {(detailLog || selectedLog)!.device?.serialNumber || "—"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Timestamp:</span>{" "}
                      {new Date((detailLog || selectedLog)!.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <JsonBlock title="Before" value={(detailLog || selectedLog)!.previousState} />
                  <JsonBlock title="After" value={(detailLog || selectedLog)!.newState} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
