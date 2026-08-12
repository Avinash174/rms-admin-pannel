"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Search, X, CheckCircle2, AlertTriangle, FileQuestion, Layers } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['operations-inventory', page, hasMissingOnly],
    queryFn: () =>
      listOperations({
        page,
        limit: 20,
        type: 'INVENTORY',
        hasMissing: hasMissingOnly || undefined,
      }),
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("Inventory sessions refreshed");
  };

  const { data: detail } = useQuery({
    queryKey: ['operation-detail', selected?.id],
    queryFn: () => getOperation(selected!.id),
    enabled: !!selected?.id && isDetailOpen,
  });

  const items = (data?.data || []).filter(
    (item) =>
      !searchTerm ||
      item.boxBarcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSessions = data?.meta?.total || items.length;
  const missingCount = items.filter(i => i.missingCount && i.missingCount > 0).length;

  return (
    <div className="w-full space-y-6 p-6 pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inventory Verification & Audit Review</h1>
            <p className="text-xs text-slate-500">Review physical warehouse inventory audits, missing file flags & foreign box scans</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl h-9 text-xs" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} /> Refresh Verification Sessions
        </Button>
      </div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Audits</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSessions}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Layers className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Clean</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSessions - missingCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Missing Exceptions</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{missingCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><FileQuestion className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliance Rate</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">98.4%</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search Box Barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="has-missing"
            checked={hasMissingOnly}
            onCheckedChange={(checked) => {
              setHasMissingOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="has-missing" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Show Missing Exception Sessions Only
          </Label>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={items}
          meta={data?.meta ? { page: data.meta.page, pageSize: data.meta.pageSize || 20, total: data.meta.total, totalPages: data.meta.totalPages } : undefined}
          onPageChange={setPage}
          onCustomAction={(op: any) => {
            setSelected(op);
            setIsDetailOpen(true);
          }}
        />
      </div>

      {/* Right Slide-Over Details Drawer */}
      {isDetailOpen && selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-lg w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Audit Verification Inspection
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">Box {selected.boxBarcode}</h3>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4 text-xs pt-4 overflow-y-auto max-h-[70vh]">
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-slate-700">
                  <div><strong>Operator:</strong> {selected.user?.fullName || selected.user?.email || 'System'}</div>
                  <div><strong>Scanned At:</strong> {selected.performedAt ? new Date(selected.performedAt).toLocaleString() : '-'}</div>
                  <div><strong>Missing Count:</strong> <span className="font-bold text-rose-600">{selected.missingCount || 0}</span></div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Scanned Items Breakdown</h4>
                  {(detail?.scanEvents || []).map((scan: any, i: number) => {
                    const st = scanStatus(scan);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-slate-800">{scan.barcode}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          st === 'missing' ? 'bg-rose-50 text-rose-600' :
                          st === 'foreign' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {st.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsDetailOpen(false)}>Close Drawer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
