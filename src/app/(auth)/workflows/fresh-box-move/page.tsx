"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, AlertCircle, RefreshCw, Package, MapPin, CheckCircle, 
  Clock, XCircle, Search, Sparkles, ArrowRight, User, Calendar, Info, X
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { columns } from './columns';

interface FreshBoxMove {
  id: string;
  boxBarcode: string;
  boxName?: string;
  sourceLocation: string;
  destinationLocation: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const mockData: FreshBoxMove[] = [
  {
    id: '1',
    boxBarcode: 'BOX-001',
    boxName: 'Finance Records 2024',
    sourceLocation: 'LOC-001',
    destinationLocation: 'LOC-002',
    status: 'COMPLETED',
    assignedTo: 'John Doe',
    startedAt: '2026-07-03T09:00:00Z',
    completedAt: '2026-07-03T09:15:00Z',
    createdAt: '2026-07-03T08:55:00Z',
  },
  {
    id: '2',
    boxBarcode: 'BOX-002',
    boxName: 'HR Documents Pack A',
    sourceLocation: 'LOC-003',
    destinationLocation: 'LOC-005',
    status: 'IN_PROGRESS',
    assignedTo: 'Jane Smith',
    startedAt: '2026-07-03T10:00:00Z',
    createdAt: '2026-07-03T09:50:00Z',
  },
];

export default function FreshBoxMovePage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Drawer state
  const [selectedMove, setSelectedMove] = useState<FreshBoxMove | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fresh-box-moves', page],
    queryFn: async () => {
      // Simulate API fetch delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return { data: mockData, meta: { page, pageSize: 20, total: 2, totalPages: 1 } };
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Package className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading moves workflow...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load fresh box moves</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const moves = data?.data || [];
  const meta = data?.meta;

  const filteredMoves = moves.filter((move) => {
    const matchesSearch = move.boxBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (move.boxName && move.boxName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || move.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMoves = moves.length;
  const completedMoves = moves.filter(m => m.status === 'COMPLETED').length;
  const activeMoves = moves.filter(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING').length;

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fresh Box Moving</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Active Workflow
            </span>
          </div>
          <p className="text-sm text-slate-500">Monitor and track barcodes, check source shelves, audit assigned operators, and authorize box relocations.</p>
        </div>
      </div>

      {/* Metrics Board (Standardized Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total moves */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Operations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalMoves}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Package className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Managed relocations history
          </div>
        </div>

        {/* Completed */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Moves</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{completedMoves}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <CheckCircle className="w-6 h-6 stroke-[2]" />
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

        {/* Active moves */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-50 to-orange-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active In-Progress</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeMoves}</h3>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50 shadow-sm">
              <Clock className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-amber-500" /> Pending physical scanning validation
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
            placeholder="Search box barcode or name..."
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredMoves.length === 0 ? (
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
            data={filteredMoves}
            meta={meta}
            onPageChange={setPage}
            onCustomAction={(move) => {
              setSelectedMove(move);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Fresh Box Move Details */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Move Details</h3>
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
            {selectedMove && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Event Summary Card */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3 text-white ${
                    selectedMove.status === 'COMPLETED' ? 'bg-emerald-600' :
                    selectedMove.status === 'IN_PROGRESS' ? 'bg-blue-600' :
                    selectedMove.status === 'FAILED' ? 'bg-rose-600' : 'bg-yellow-600'
                  }`}>
                    {selectedMove.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">{selectedMove.boxBarcode}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedMove.boxName || 'No Box Name'}</p>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mt-3.5 ${
                    selectedMove.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedMove.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {selectedMove.status}
                  </span>
                </div>

                {/* Route Section */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Routing Path</h5>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs font-bold">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Source Location</span>
                      <span className="text-slate-800">{selectedMove.sourceLocation}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Destination</span>
                      <span className="text-blue-600">{selectedMove.destinationLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Operator Assigned */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operator details</h5>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-205 border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800">{selectedMove.assignedTo || 'Unassigned'}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Assigned workflow operator</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Timeline Registry</h5>
                  
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    
                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Created At</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(selectedMove.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {selectedMove.startedAt && (
                      <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500">Started At</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {new Date(selectedMove.startedAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {selectedMove.completedAt && (
                      <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500">Completed At</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {new Date(selectedMove.completedAt).toLocaleString()}
                        </span>
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
