"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Search, X, ArrowRight } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { columns } from './columns';
import { getOperation, listOperations, OperationSummary } from '@/lib/api/operations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeaderCard } from '@/components/page-header-card';
import { FileCheck } from 'lucide-react';

export default function RefilePage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<OperationSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['operations-refile', page, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      listOperations({
        page,
        limit: 20,
        type: 'REFILE',
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        to: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['operation-detail', selected?.id],
    queryFn: () => getOperation(selected!.id),
    enabled: !!selected?.id && isDetailOpen,
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
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const items = (data?.data || []).filter(
    (item) =>
      !searchTerm ||
      item.fileBarcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <PageHeaderCard
        title="Refile Review"
        description="Review refile operations. Rejected entries indicate the operator scanned the wrong location or box."
        badge="Workflow Live · Refile"
        icon={FileCheck}
      />

      <div className="flex flex-col lg:flex-row gap-3 bg-white p-4 rounded-2xl border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search file or user..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v: 'ALL' | 'COMPLETED' | 'REJECTED') => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-40 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl w-full lg:w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl w-full lg:w-40" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm">
        <DataTable
          columns={columns}
          data={items}
          meta={data?.meta}
          onPageChange={setPage}
          onCustomAction={(item: OperationSummary) => {
            setSelected(item);
            setIsDetailOpen(true);
          }}
        />
      </div>

      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDetailOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsDetailOpen(false)} />

        <div
          className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform ${
            isDetailOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <h2 className="font-bold font-mono">{selected?.fileBarcode}</h2>
              <span
                className={`text-xs font-bold uppercase ${
                  selected?.status === 'REJECTED' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {selected?.status}
                {selected?.reasonCode ? ` — ${selected.reasonCode}` : ''}
              </span>
            </div>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsDetailOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {detailLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mt-8" />
            ) : (
              <div className="space-y-4 text-sm">
                <div className="p-4 border rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Expected</p>
                  <p>
                    Location:{' '}
                    <span className="font-mono">{detail?.expected?.location?.barcode || '—'}</span>
                  </p>
                  <p>
                    Box: <span className="font-mono">{detail?.expected?.box?.barcode || '—'}</span>
                  </p>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
                <div
                  className={`p-4 border rounded-xl ${
                    selected?.status === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Actually Scanned</p>
                  <p>
                    Location:{' '}
                    <span className="font-mono">{detail?.scanned?.location?.barcode || '—'}</span>
                  </p>
                  <p>
                    Box: <span className="font-mono">{detail?.scanned?.box?.barcode || '—'}</span>
                  </p>
                </div>
                {selected?.status === 'REJECTED' && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    Operator went to the wrong place. Reason: {selected.reasonCode}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
