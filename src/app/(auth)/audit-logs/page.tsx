"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, AlertCircle, RefreshCw, FileText, CheckCircle2,
  XCircle, Info, Sparkles, X, Terminal, Monitor, Globe, KeyRound, Search, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { getAuditLogs } from '@/lib/api/audit';
import { AuditLogFilters } from '@/lib/types/audit';
import { exportToPDF } from '@/lib/utils/pdf';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Drawer state
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filters: AuditLogFilters = {
    action: actionFilter !== 'ALL' ? actionFilter : undefined,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => getAuditLogs(filters, page, 20),
  });

  const handleExportPDF = () => {
    exportToPDF({
      title: 'Audit Logs',
      subtitle: `Total Logs: ${logs.length}`,
      columns: [
        { header: 'Action', dataKey: 'action' },
        { header: 'User', dataKey: 'userName' },
        { header: 'Outcome', dataKey: 'outcome' },
        { header: 'Timestamp', dataKey: 'createdAt' },
      ],
      data: logs.map(log => ({
        action: log.action,
        userName: log.userName || 'N/A',
        outcome: log.outcome,
        createdAt: new Date(log.createdAt).toLocaleString(),
      })),
      fileName: `audit-logs-${Date.now()}.pdf`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Terminal className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading system audit trails...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load audit logs</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const logs = data?.data || [];
  const meta = data?.meta;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !searchTerm ||
      (log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    let matchesAction = actionFilter === 'ALL';
    if (!matchesAction) {
      if (actionFilter === 'CREATE') {
        matchesAction = log.action.endsWith('_CREATED') || log.action.includes('CREATE') || log.action === 'FRESH_BOX_MOVE';
      } else if (actionFilter === 'UPDATE') {
        matchesAction = log.action.endsWith('_UPDATED') || log.action.includes('UPDATE') || log.action === 'LOCATION_OVERRIDE' || log.action === 'MERGE' || log.action === 'TRANSFER_INITIATE' || log.action === 'TRANSFER_ACCEPT';
      } else if (actionFilter === 'DELETE') {
        matchesAction = log.action.endsWith('_DELETED') || log.action.includes('DELETE') || log.action === 'DESTROYED';
      } else {
        matchesAction = log.action === actionFilter;
      }
    }
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const totalCount = logs.length;
  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Logs</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> System Integrity
            </span>
          </div>
          <p className="text-sm text-slate-500">Inspect system operation trails, write success states, login attempts, and record changes.</p>
        </div>
        <Button
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export Audit Logs
        </Button>
      </div>

      {/* Metrics Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Operations */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Operations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Terminal className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Full transactional write history
          </div>
        </div>

        {/* Success Rate */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Success Rate</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{successRate}%</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Operational flow validation active
          </div>
        </div>

        {/* Failed Alerts */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Operations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{failedCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <XCircle className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Unauthorized actions flagged
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search user, entity, or ID..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          {/* Action Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Action</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white text-xs font-bold text-slate-800 shadow-sm w-36"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="READ">Read</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white text-xs font-bold text-slate-800 shadow-sm w-32"
            >
              <option value="ALL">All</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Terminal className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No logs found</p>
              <p className="text-xs text-slate-400">Try altering your search keywords or active filters</p>
            </div>
            <Button
              onClick={() => { setSearchTerm(''); setActionFilter('ALL'); setStatusFilter('ALL'); }}
              variant="outline"
              className="text-xs font-bold text-blue-600 hover:bg-slate-50 border-slate-200 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredLogs}
            meta={meta}
            onPageChange={setPage}
            onCustomAction={(log) => {
              setSelectedLog(log);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Audit Log Details Panel */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Operation Details</h3>
              </div>
              <Button 
                onClick={() => setIsDetailsOpen(false)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Content */}
            {selectedLog && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Event Summary Card */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3 text-white ${
                    selectedLog.status === 'SUCCESS' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {selectedLog.status === 'SUCCESS' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">Operation {selectedLog.action}</h4>
                  <p className="text-xs text-slate-500 mt-1">Status Code: {selectedLog.status}</p>
                  
                  <div className="flex items-center gap-1.5 mt-3.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-650 text-xs font-bold uppercase tracking-wider font-mono border border-slate-200">
                      {selectedLog.entity}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-150 text-slate-700 text-xs font-mono font-bold">
                      {selectedLog.entityId}
                    </span>
                  </div>
                </div>

                {/* Metadata Properties */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operation Metadata</h5>
                  
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    
                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Operation ID</span>
                      </div>
                      <span className="text-xs font-mono text-slate-700 select-all font-bold">{selectedLog.id}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">IP Address</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono">{selectedLog.ipAddress || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Timestamp</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-750 text-slate-700">
                        {new Date(selectedLog.createdAt).toLocaleString()}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Trace Info */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Changelog</h5>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <p className="text-xs text-slate-650 leading-relaxed font-semibold text-slate-800">{selectedLog.changes || 'No detailed changelog provided'}</p>
                  </div>
                </div>

                {/* User Agent HUD */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client Environment</h5>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                    <Monitor className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed font-mono">{selectedLog.userAgent || 'Unknown user agent'}</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
