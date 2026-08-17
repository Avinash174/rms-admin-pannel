"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Search, X, ArrowRightLeft } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { columns } from './columns';
import { getOperation, listOperations, OperationSummary } from '@/lib/api/operations';
import { PageHeaderCard } from '@/components/page-header-card';

export default function TransferPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<OperationSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['operations-segregation', page],
    queryFn: () =>
      listOperations({
        page,
        limit: 20,
        type: 'SEGREGATION',
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
      item.oldBoxBarcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.newBoxBarcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <PageHeaderCard
        title="Transfer / Segregation Review"
        description="Review segregation sessions — files moved out of old boxes into new boxes."
        badge="Workflow Live · Transfer & Segregation"
        icon={ArrowRightLeft}
      />

      <div className="bg-white p-4 rounded-2xl border max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search box barcode..."
            className="pl-10 rounded-xl"
          />
        </div>
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
              <h2 className="font-bold text-sm">
                {selected?.oldBoxBarcode} → {selected?.newBoxBarcode}
              </h2>
              <p className="text-xs text-slate-500">
                Out: {selected?.outCount ?? 0} · In: {selected?.inCount ?? 0}
              </p>
            </div>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsDetailOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {detailLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mt-8" />
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-slate-500">Barcode</th>
                    <th className="px-3 py-2 text-left font-bold text-slate-500">Remark</th>
                    <th className="px-3 py-2 text-left font-bold text-slate-500">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail?.scanEvents || []).map((scan, idx) => (
                    <tr key={`${scan.barcode}-${scan.remark}-${idx}`} className="border-t">
                      <td className="px-3 py-2 font-mono font-semibold">{scan.barcode}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            scan.remark === 'OUT'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {scan.remark}
                        </span>
                      </td>
                      <td className="px-3 py-2">{scan.client || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
