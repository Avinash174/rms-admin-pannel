"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { columns } from './columns';
import { getOperation, listOperations, OperationSummary } from '@/lib/api/operations';

function scanStatus(scan: {
  isExpected?: boolean;
  isMissingFlag?: boolean;
}): string {
  if (scan.isMissingFlag) return 'missing';
  if (scan.isExpected === false) return 'foreign';
  return 'verified';
}

export default function InventoryVerificationPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMissingOnly, setHasMissingOnly] = useState(false);
  const [selected, setSelected] = useState<OperationSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['operations-inventory', page, hasMissingOnly],
    queryFn: () =>
      listOperations({
        page,
        limit: 20,
        type: 'INVENTORY',
        hasMissing: hasMissingOnly || undefined,
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
      item.boxBarcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Review</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review inventory verification sessions — missing files and foreign scans.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search box barcode..."
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="has-missing"
            checked={hasMissingOnly}
            onCheckedChange={(checked) => {
              setHasMissingOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="has-missing" className="text-sm">
            Has missing files only
          </Label>
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

      <div className={`fixed inset-0 z-50 ${isDetailOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 ${isDetailOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsDetailOpen(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform ${
            isDetailOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-bold font-mono">{selected?.boxBarcode}</h2>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsDetailOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {detailLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mt-8" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <p className="font-bold text-emerald-700">{selected?.verifiedCount ?? 0}</p>
                    <p className="text-xs text-slate-500">Verified</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <p className="font-bold text-rose-700">{selected?.missingCount ?? 0}</p>
                    <p className="text-xs text-slate-500">Missing</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="font-bold text-amber-700">{selected?.warningsCount ?? 0}</p>
                    <p className="text-xs text-slate-500">Warnings</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Per-file scans</h3>
                  <div className="space-y-2">
                    {(detail?.scanEvents || []).map((scan, idx) => {
                      const status = scanStatus(scan);
                      const style =
                        status === 'missing'
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : status === 'foreign'
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200';
                      return (
                        <div
                          key={`${scan.barcode}-${idx}`}
                          className={`flex justify-between items-center p-2 border rounded-lg text-sm ${style}`}
                        >
                          <span className="font-mono font-semibold">{scan.barcode}</span>
                          <span className="text-xs font-bold uppercase">{status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(selected?.warningsCount ?? 0) > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    {selected?.warningsCount} unexpected scan(s) detected during this session.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
