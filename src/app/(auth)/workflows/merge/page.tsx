"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle, RefreshCw, Package, CheckCircle,
  Clock, Search, Sparkles, Info, X, User, Calendar, ArrowRight
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { columns, Merge } from './columns';

const mockData: Merge[] = [
  {
    id: '1',
    mergeCode: 'MERGE-2024-001',
    sourceBoxBarcode: 'BOX-003',
    sourceBoxName: 'Q3 Documents',
    destinationBoxBarcode: 'BOX-001',
    destinationBoxName: 'Finance Records 2024',
    status: 'COMPLETED',
    reason: 'Box consolidation',
    fileCount: 15,
    assignedTo: 'John Doe',
    startedAt: '2024-01-15T09:00:00Z',
    completedAt: '2024-01-15T09:45:00Z',
    createdAt: '2024-01-15T08:55:00Z',
  },
  {
    id: '2',
    mergeCode: 'MERGE-2024-002',
    sourceBoxBarcode: 'BOX-006',
    sourceBoxName: 'Old HR Files',
    destinationBoxBarcode: 'BOX-004',
    destinationBoxName: 'HR Documents 2024',
    status: 'IN_PROGRESS',
    reason: 'Department reorganization',
    fileCount: 22,
    assignedTo: 'Jane Smith',
    startedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T09:50:00Z',
  },
  {
    id: '3',
    mergeCode: 'MERGE-2024-003',
    sourceBoxBarcode: 'BOX-008',
    sourceBoxName: 'Archive 2019',
    destinationBoxBarcode: 'BOX-009',
    destinationBoxName: 'Archive Consolidated',
    status: 'PENDING',
    reason: 'Annual archiving',
    fileCount: 8,
    createdAt: '2024-01-15T10:30:00Z',
  },
];

export default function MergePage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedItem, setSelectedItem] = useState<Merge | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['merges', page],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { data: mockData, meta: { page, pageSize: 20, total: mockData.length, totalPages: 1 } };
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
          <Package className="w-5 h-5 text-violet-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading merge workflow...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load merge operations</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const items = data?.data || [];
  const meta = data?.meta;

  const filtered = items.filter((item) => {
    const matchesSearch = item.mergeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sourceBoxName && item.sourceBoxName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.sourceBoxBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.destinationBoxName && item.destinationBoxName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.destinationBoxBarcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = items.length;
  const completed = items.filter(i => i.status === 'COMPLETED').length;
  const active = items.filter(i => i.status === 'IN_PROGRESS' || i.status === 'PENDING').length;
  const totalFiles = items.reduce((acc, i) => acc + (i.fileCount || 0), 0);

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Box Merge</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
              <Sparkles className="w-3.5 h-3.5" /> Active Workflow
            </span>
          </div>
          <p className="text-sm text-slate-500">Consolidate documents from source boxes into destination boxes with full audit trail.</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-violet-50 to-purple-50/30 rounded-bl-full opacity-80 group-hover:scale-105 transition-transform duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Merges</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{total}</h3>
            </div>
            <div className="p-3.5 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100/50 shadow-sm">
              <Package className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-violet-500" /> {totalFiles} total files consolidated
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full opacity-80 group-hover:scale-105 transition-transform duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{completed}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <CheckCircle className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Consolidation verified and closed
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-50 to-orange-50/30 rounded-bl-full opacity-80 group-hover:scale-105 transition-transform duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active / Pending</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{active}</h3>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50 shadow-sm">
              <Clock className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-amber-500" /> Awaiting physical box scan
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by merge code or box..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
          />
        </div>
        {/* Status Filter Pill Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {status === 'ALL' ? 'All' : status === 'IN_PROGRESS' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Package className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No records found</p>
              <p className="text-xs text-slate-400">Try altering your search keywords or active filters</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            meta={meta}
            onPageChange={setPage}
            onCustomAction={(item) => {
              setSelectedItem(item);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* Detail Drawer */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-violet-600" />
                <h3 className="text-lg font-bold text-slate-900">Merge Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedItem && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-violet-50/30 to-purple-50/10 rounded-2xl border border-slate-100">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3 text-white ${
                    selectedItem.status === 'COMPLETED' ? 'bg-emerald-600' :
                    selectedItem.status === 'IN_PROGRESS' ? 'bg-violet-600' :
                    selectedItem.status === 'FAILED' ? 'bg-rose-600' : 'bg-amber-500'
                  }`}>
                    {selectedItem.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedItem.mergeCode}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedItem.reason || 'No reason provided'}</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mt-3 ${
                    selectedItem.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedItem.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedItem.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {selectedItem.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Box Route</h5>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs font-bold">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] text-slate-400 uppercase">Source Box</span>
                      <span className="text-slate-800">{selectedItem.sourceBoxBarcode}</span>
                      {selectedItem.sourceBoxName && <span className="text-[10px] text-slate-500">{selectedItem.sourceBoxName}</span>}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-400 uppercase">Destination</span>
                      <span className="text-blue-600">{selectedItem.destinationBoxBarcode}</span>
                      {selectedItem.destinationBoxName && <span className="text-[10px] text-slate-500">{selectedItem.destinationBoxName}</span>}
                    </div>
                  </div>
                </div>

                {selectedItem.fileCount && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Files Consolidated</h5>
                    <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                      <Package className="w-5 h-5 text-violet-500" />
                      <span className="text-sm font-bold text-violet-700">{selectedItem.fileCount} file records</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operator</h5>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedItem.assignedTo || 'Unassigned'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Assigned workflow operator</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Timeline</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Created</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{new Date(selectedItem.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedItem.startedAt && (
                      <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500">Started</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{new Date(selectedItem.startedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedItem.completedAt && (
                      <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500">Completed</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{new Date(selectedItem.completedAt).toLocaleString()}</span>
                      </div>
                    )}
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
