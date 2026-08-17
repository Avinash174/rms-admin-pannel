"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw, Search, X, FileText } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import {
  listRecordFiles,
  getRecordFile,
  updateRecordFile,
  getRecordFileTimeline,
  RecordFile,
} from '@/lib/api/records';
import { getClients } from '@/lib/api/client';
import { listRecordBoxes } from '@/lib/api/records';
import { TimelineList } from '@/components/records/timeline-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeaderCard } from '@/components/page-header-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FILE_STATUSES = ['ACTIVE', 'ARCHIVED', 'DESTROYED'] as const;

export default function FileRecordsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [boxFilter, setBoxFilter] = useState<string>('ALL');
  const [selectedFile, setSelectedFile] = useState<RecordFile | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'timeline'>('info');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editHomeBoxId, setEditHomeBoxId] = useState('');
  const [confirmHomeBox, setConfirmHomeBox] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['record-files', page, searchTerm, statusFilter, clientFilter, boxFilter],
    queryFn: () =>
      listRecordFiles(page, 20, {
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        clientId: clientFilter !== 'ALL' ? clientFilter : undefined,
        boxId: boxFilter !== 'ALL' ? boxFilter : undefined,
      }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients(1, 100),
  });

  const { data: boxesData } = useQuery({
    queryKey: ['record-boxes-filter'],
    queryFn: () => listRecordBoxes(1, 100),
  });

  const { data: fileDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['record-file-detail', selectedFile?.id],
    queryFn: () => getRecordFile(selectedFile!.id),
    enabled: !!selectedFile?.id && isDetailOpen,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['record-file-timeline', selectedFile?.id],
    queryFn: () => getRecordFileTimeline(selectedFile!.id),
    enabled: !!selectedFile?.id && isDetailOpen && detailTab === 'timeline',
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; label?: string; homeBoxId?: string }) =>
      updateRecordFile(payload.id, {
        label: payload.label,
        homeBoxId: payload.homeBoxId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-files'] });
      queryClient.invalidateQueries({ queryKey: ['record-file-detail'] });
      setIsEditOpen(false);
      setConfirmHomeBox(false);
      toast.success('File record updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update file'),
  });

  const handleSaveEdit = () => {
    if (!selectedFile) return;
    const homeBoxChanged = editHomeBoxId && editHomeBoxId !== selectedFile.homeBoxId;
    if (homeBoxChanged && !confirmHomeBox) {
      setConfirmHomeBox(true);
      return;
    }
    updateMutation.mutate({
      id: selectedFile.id,
      label: editLabel || undefined,
      homeBoxId: homeBoxChanged ? editHomeBoxId : undefined,
    });
  };

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

  const files = data?.data || [];
  const meta = data?.meta;
  const clients = clientsData?.data || [];
  const boxes = boxesData?.data || [];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      {/* Page Header Hero Banner */}
      <PageHeaderCard
        title="File Records Master"
        description="View and edit file labels. Reassigning home box changes the refile destination."
        badge="System Live · Physical Document Archive"
        icon={FileText}
      />

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
            {FILE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
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
        <Select value={boxFilter} onValueChange={(v) => { setBoxFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Box" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All boxes</SelectItem>
            {boxes.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.barcode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <DataTable
          columns={columns}
          data={files}
          meta={meta}
          onPageChange={setPage}
          onCustomAction={(file: RecordFile) => {
            setSelectedFile(file);
            setDetailTab('info');
            setIsDetailOpen(true);
          }}
          onEdit={(file: RecordFile) => {
            setSelectedFile(file);
            setEditLabel(file.label || '');
            setEditHomeBoxId(file.homeBoxId || file.box?.id || '');
            setIsEditOpen(true);
          }}
        />
      </div>

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
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold font-mono">{selectedFile?.barcode}</h2>
            </div>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsDetailOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex border-b px-5 gap-4">
            {(['info', 'timeline'] as const).map((tab) => (
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
            ) : detailTab === 'info' ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Label</span><span>{fileDetail?.label || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Box</span><span className="font-mono">{fileDetail?.box?.barcode}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Client</span><span>{fileDetail?.client?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-mono">{fileDetail?.location?.barcode || '—'}</span></div>
                {fileDetail?.location?.breadcrumb && (
                  <p className="text-xs text-slate-400 pt-2 border-t">
                    {fileDetail.location.breadcrumb.join(' → ')}
                  </p>
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
                setEditLabel(fileDetail?.label || selectedFile?.label || '');
                setEditHomeBoxId(fileDetail?.homeBoxId || selectedFile?.homeBoxId || '');
                setIsEditOpen(true);
              }}
            >
              Edit File
            </Button>
          </div>
        </div>
      </div>

      {isEditOpen && selectedFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Edit File Record</h3>
            <p className="text-xs text-slate-400 font-mono">{selectedFile.barcode}</p>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Home Box</Label>
              <Select value={editHomeBoxId} onValueChange={setEditHomeBoxId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select box" /></SelectTrigger>
                <SelectContent>
                  {boxes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.barcode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-600">Changing home box affects refile destination.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button disabled={updateMutation.isPending} onClick={handleSaveEdit}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmHomeBox}
        onClose={() => setConfirmHomeBox(false)}
        onConfirm={handleSaveEdit}
        title="Confirm Home Box Change"
        description="This will change the refile destination for this file. The change will be recorded in the audit log."
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
