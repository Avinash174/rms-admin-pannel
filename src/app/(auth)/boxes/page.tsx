"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw, Search, X, Archive } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import {
  listRecordBoxes,
  getRecordBox,
  updateRecordBox,
  getRecordBoxTimeline,
  RecordBox,
} from '@/lib/api/records';
import { getClients } from '@/lib/api/client';
import { getWarehouses } from '@/lib/api/warehouse';
import { TimelineList } from '@/components/records/timeline-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BOX_STATUSES = ['ACTIVE', 'IN_TRANSIT', 'MERGED', 'DESTROYED'] as const;

export default function BoxesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [selectedBox, setSelectedBox] = useState<RecordBox | null>(null);
  const [detailTab, setDetailTab] = useState<'files' | 'timeline'>('files');
  const [editLabel, setEditLabel] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['record-boxes', page, searchTerm, statusFilter, clientFilter, warehouseFilter],
    queryFn: () =>
      listRecordBoxes(page, 20, {
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        clientId: clientFilter !== 'ALL' ? clientFilter : undefined,
        warehouseId: warehouseFilter !== 'ALL' ? warehouseFilter : undefined,
      }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients(1, 100),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: () => getWarehouses(1, 100),
  });

  const { data: boxDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['record-box-detail', selectedBox?.id],
    queryFn: () => getRecordBox(selectedBox!.id),
    enabled: !!selectedBox?.id && isDetailOpen,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['record-box-timeline', selectedBox?.id],
    queryFn: () => getRecordBoxTimeline(selectedBox!.id),
    enabled: !!selectedBox?.id && isDetailOpen && detailTab === 'timeline',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      updateRecordBox(id, { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['record-box-detail'] });
      setIsEditOpen(false);
      toast.success('Box label updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update box'),
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

  const boxes = data?.data || [];
  const meta = data?.meta;
  const clients = clientsData?.data || [];
  const warehouses = warehousesData?.data || [];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Boxes</h1>
        <p className="text-sm text-slate-500 mt-1">
          View box records registered via intake workflows. Status changes only through workflows.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search barcode or label..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {BOX_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Warehouse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <DataTable
          columns={columns}
          data={boxes}
          meta={meta}
          onPageChange={setPage}
          onCustomAction={(box: RecordBox) => {
            setSelectedBox(box);
            setDetailTab('files');
            setIsDetailOpen(true);
          }}
          onEdit={(box: RecordBox) => {
            setSelectedBox(box);
            setEditLabel(box.label || '');
            setIsEditOpen(true);
          }}
        />
      </div>

      {/* Detail drawer */}
      <div className={`fixed inset-0 z-50 ${isDetailOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${isDetailOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsDetailOpen(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform ${
            isDetailOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 font-mono">{selectedBox?.barcode}</h2>
            </div>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsDetailOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex border-b px-5 gap-4">
            {(['files', 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`py-3 text-sm font-semibold capitalize border-b-2 ${
                  detailTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {detailLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto mt-8 text-blue-600" />
            ) : detailTab === 'files' ? (
              <div className="space-y-2">
                {(boxDetail?.files || []).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No files in this box</p>
                ) : (
                  boxDetail?.files?.map((file) => (
                    <div
                      key={file.id}
                      className="flex justify-between items-center p-3 border rounded-xl text-sm"
                    >
                      <span className="font-mono font-semibold">{file.barcode}</span>
                      <span className="text-slate-500">{file.label || '—'}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <TimelineList entries={timeline} />
            )}
          </div>

          <div className="p-5 border-t">
            <Button
              className="w-full rounded-xl"
              onClick={() => {
                setEditLabel(boxDetail?.label || selectedBox?.label || '');
                setIsEditOpen(true);
              }}
            >
              Edit Label
            </Button>
          </div>
        </div>
      </div>

      {/* Edit label dialog */}
      {isEditOpen && selectedBox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Edit Box Label</h3>
            <p className="text-xs text-slate-400 font-mono">{selectedBox.barcode}</p>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({ id: selectedBox.id, label: editLabel })
                }
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
