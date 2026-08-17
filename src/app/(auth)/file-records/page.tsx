"use client";

import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  FileText,
  Sparkles,
  Upload,
  Download,
  Trash2,
  Check,
  FileSpreadsheet,
  Box as BoxIcon,
  Building2,
  CheckCircle2,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import {
  listRecordFiles,
  getRecordFile,
  updateRecordFile,
  getRecordFileTimeline,
  createRecordFile,
  deleteRecordFile,
  bulkGenerateRecordFiles,
  bulkActionRecordFiles,
  bulkImportRecordFiles,
  RecordFile,
  BulkGenerateFilesRequest
} from '@/lib/api/records';
import { getClients } from '@/lib/api/client';
import { listRecordBoxes } from '@/lib/api/records';
import { TimelineList } from '@/components/records/timeline-list';
import { VisualBarcode } from '@/components/records/visual-barcode';
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

interface ImportFileRow {
  barcode: string;
  label?: string;
  boxBarcode?: string;
}

export default function FileRecordsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [boxFilter, setBoxFilter] = useState<string>('ALL');

  // Single File Create/Edit State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    boxId: '',
    barcode: '',
    title: '',
  });

  // Bulk Generator State
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    boxId: '',
    prefix: 'FILE',
    startingNumber: 1,
    quantity: 20,
    padding: 4,
    titlePrefix: 'Document',
  });

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importBoxId, setImportBoxId] = useState('');
  const [importRows, setImportRows] = useState<ImportFileRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Row Selection State for Bulk Actions
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Details & Edit Drawer
  const [selectedFile, setSelectedFile] = useState<RecordFile | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'timeline'>('info');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editHomeBoxId, setEditHomeBoxId] = useState('');
  const [confirmHomeBox, setConfirmHomeBox] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
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

  // Single Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: { boxId: string; barcode: string; title?: string }) =>
      createRecordFile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-files'] });
      setIsCreateOpen(false);
      setCreateForm({ boxId: '', barcode: '', title: '' });
      toast.success('File record created successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create file record'),
  });

  // Edit Mutation
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

  // Bulk Generate Mutation
  const bulkGenerateMutation = useMutation({
    mutationFn: (req: BulkGenerateFilesRequest) => bulkGenerateRecordFiles(req),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['record-files'] });
      setIsBulkDrawerOpen(false);
      toast.success(res.message || 'File records generated in bulk successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to bulk generate file records'),
  });

  // Bulk Action Mutation (Activate / Archive / Delete)
  const bulkActionMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'ACTIVATE' | 'ARCHIVE' | 'DELETE' }) =>
      bulkActionRecordFiles(ids, action),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['record-files'] });
      setRowSelection({});
      toast.success(res.message || 'Bulk action executed successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Bulk action failed'),
  });

  // Bulk Import Mutation
  const bulkImportMutation = useMutation({
    mutationFn: ({ boxId, rows }: { boxId: string; rows: ImportFileRow[] }) =>
      bulkImportRecordFiles(boxId, rows),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['record-files'] });
      setIsImportModalOpen(false);
      setImportRows([]);
      toast.success(res.message || 'File records imported successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to import file records'),
  });

  const files = data?.data || [];
  const meta = data?.meta;
  const clients = clientsData?.data || [];
  const boxes = boxesData?.data || [];

  const totalCount = meta?.total ?? files.length;
  const activeCount = files.filter((f) => f.status === 'ACTIVE').length;
  const archivedCount = files.filter((f) => f.status === 'ARCHIVED' || f.status === 'DESTROYED').length;

  // Selected File IDs
  const selectedFileIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((indexStr) => rowSelection[indexStr])
      .map((indexStr) => files[Number(indexStr)]?.id)
      .filter(Boolean);
  }, [rowSelection, files]);

  // Bulk Generator Preview
  const previewBarcodes = useMemo(() => {
    const qty = Math.min(Math.max(1, bulkForm.quantity), 500);
    const start = Math.max(1, bulkForm.startingNumber);
    const pad = Math.min(Math.max(1, bulkForm.padding), 6);
    const prefix = (bulkForm.prefix || 'FILE').trim().toUpperCase();

    const sample = [];
    const countToShow = Math.min(qty, 4);
    for (let i = 0; i < countToShow; i++) {
      const numStr = String(start + i).padStart(pad, '0');
      sample.push(`${prefix}${numStr}`);
    }
    if (qty > countToShow) {
      sample.push(`... and ${qty - countToShow} more`);
    }
    return sample;
  }, [bulkForm]);

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson.length) {
          toast.error('Uploaded file is empty.');
          return;
        }

        const parsed: ImportFileRow[] = rawJson
          .map((row) => {
            const barcode = String(row['File Barcode'] || row['Barcode'] || row['barcode'] || row['File'] || '').trim();
            const label = String(row['Label'] || row['Title'] || row['label'] || row['Name'] || '').trim();
            const boxBarcode = String(row['Box Barcode'] || row['Box'] || row['boxBarcode'] || '').trim();
            return { barcode, label: label || undefined, boxBarcode: boxBarcode || undefined };
          })
          .filter((r) => r.barcode.length > 0);

        if (!parsed.length) {
          toast.error('No valid rows found. Ensure the file has a "File Barcode" column.');
          return;
        }

        setImportRows(parsed);
        toast.success(`Parsed ${parsed.length} files ready for import`);
      } catch (err: any) {
        toast.error('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'File Barcode': 'FILE0001', 'Label': 'Financial Report 2024', 'Box Barcode': boxes[0]?.barcode || 'BOX0001' },
      { 'File Barcode': 'FILE0002', 'Label': 'Audit Documentation', 'Box Barcode': boxes[0]?.barcode || 'BOX0001' },
      { 'File Barcode': 'FILE0003', 'Label': 'Client Contract Agreements', 'Box Barcode': boxes[0]?.barcode || 'BOX0001' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Files_Template');
    XLSX.writeFile(wb, 'File_Records_Import_Template.xlsx');
  };

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
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <FileText className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading file records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load file records</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      {/* Page Header Hero Banner */}
      <PageHeaderCard
        title="File Records Master"
        description="Manage physical file folders, bulk barcode generation, labels & box storage assignments."
        badge="Physical Document Archive · File Master"
        icon={FileText}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bulk Import Button */}
          <Button
            onClick={() => {
              if (boxes.length > 0 && !importBoxId) {
                setImportBoxId(boxes[0].id);
              }
              setIsImportModalOpen(true);
            }}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-3.5 text-xs font-semibold shadow-xs"
          >
            <Upload className="w-4 h-4 mr-2 text-slate-500" />
            Import Excel
          </Button>

          {/* Bulk Generate Button */}
          <Button
            onClick={() => {
              if (boxes.length > 0 && !bulkForm.boxId) {
                setBulkForm({ ...bulkForm, boxId: boxes[0].id });
              }
              setIsBulkDrawerOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all h-10 px-4 text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2 stroke-[2.5]" />
            Bulk Generate
          </Button>

          {/* Single Add Button */}
          <Button
            onClick={() => {
              if (boxes.length > 0 && !createForm.boxId) {
                setCreateForm({ ...createForm, boxId: boxes[0].id });
              }
              setIsCreateOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all h-10 px-4 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
            Add File
          </Button>
        </div>
      </PageHeaderCard>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total File Records</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Cataloged physical folder documents
          </div>
        </div>

        {/* Active */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active in Storage</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeCount}</h3>
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
            Active folder items
          </div>
        </div>

        {/* Archived */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-50 to-orange-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Archived / Closed</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{archivedCount}</h3>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50 shadow-sm">
              <BoxIcon className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-amber-500" /> Historical or archived files
          </div>
        </div>
      </div>

      {/* Toolbar & Bulk Actions Bar */}
      <div className="space-y-3">
        {selectedFileIds.length > 0 && (
          <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="bg-blue-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                {selectedFileIds.length}
              </span>
              <span className="text-xs font-semibold text-slate-200">Files Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionMutation.isPending}
                onClick={() => bulkActionMutation.mutate({ ids: selectedFileIds, action: 'ACTIVATE' })}
                className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700 hover:text-emerald-300 rounded-xl"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionMutation.isPending}
                onClick={() => bulkActionMutation.mutate({ ids: selectedFileIds, action: 'ARCHIVE' })}
                className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:text-amber-300 rounded-xl"
              >
                <BoxIcon className="w-3.5 h-3.5 mr-1" />
                Archive
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkActionMutation.isPending}
                onClick={() => {
                  setConfirmDelete({
                    isOpen: true,
                    title: 'Delete Selected Files',
                    description: `Are you sure you want to delete ${selectedFileIds.length} selected file records? This action cannot be undone.`,
                    onConfirm: () => bulkActionMutation.mutate({ ids: selectedFileIds, action: 'DELETE' }),
                  });
                }}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search barcode or label..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-40 rounded-xl h-11"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {FILE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-44 rounded-xl h-11"><SelectValue placeholder="Client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={boxFilter} onValueChange={(v) => { setBoxFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-44 rounded-xl h-11"><SelectValue placeholder="Box" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All boxes</SelectItem>
              {boxes.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.barcode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <FileText className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No file records found</p>
              <p className="text-xs text-slate-400">Click &quot;Bulk Generate&quot; or &quot;Add File&quot; to catalog folder documents.</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={files}
            meta={meta}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
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
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Bulk Generate Files (Like Box Master) */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isBulkDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsBulkDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div
            className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              isBulkDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Generate Files</h3>
                  <p className="text-xs text-slate-400">Instantly generate consecutive file folder barcodes</p>
                </div>
              </div>
              <Button onClick={() => setIsBulkDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bulk-box">Target Box Container</Label>
                <select
                  id="bulk-box"
                  value={bulkForm.boxId}
                  onChange={(e) => setBulkForm({ ...bulkForm, boxId: e.target.value })}
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="">-- Choose Container Box --</option>
                  {boxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.barcode} {b.label ? `(${b.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-file-prefix">Barcode Prefix</Label>
                  <Input
                    id="bulk-file-prefix"
                    value={bulkForm.prefix}
                    onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="FILE"
                    className="h-11 rounded-xl uppercase font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-file-padding">Padding (Digits)</Label>
                  <Input
                    id="bulk-file-padding"
                    type="number"
                    min={1}
                    max={6}
                    value={bulkForm.padding}
                    onChange={(e) => setBulkForm({ ...bulkForm, padding: Number(e.target.value) || 4 })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-file-start">Starting Number</Label>
                  <Input
                    id="bulk-file-start"
                    type="number"
                    min={1}
                    value={bulkForm.startingNumber}
                    onChange={(e) => setBulkForm({ ...bulkForm, startingNumber: Number(e.target.value) || 1 })}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-file-qty">Quantity to Generate</Label>
                  <Input
                    id="bulk-file-qty"
                    type="number"
                    min={1}
                    max={500}
                    value={bulkForm.quantity}
                    onChange={(e) => setBulkForm({ ...bulkForm, quantity: Number(e.target.value) || 20 })}
                    className="h-11 rounded-xl font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-title-prefix">Document Label Prefix</Label>
                <Input
                  id="bulk-title-prefix"
                  value={bulkForm.titlePrefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, titlePrefix: e.target.value })}
                  placeholder="e.g. Legal Contract / Financial Doc"
                  className="h-11 rounded-xl text-xs"
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Preview Generated Sample</Label>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  {previewBarcodes.map((code, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{code}</span>
                      </div>
                      {!code.includes('...') && (
                        <VisualBarcode code={code} width={100} height={18} showText={false} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsBulkDrawerOpen(false)} className="rounded-xl border-slate-200 h-11">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={bulkGenerateMutation.isPending || !bulkForm.boxId}
                onClick={() =>
                  bulkGenerateMutation.mutate({
                    boxId: bulkForm.boxId,
                    prefix: bulkForm.prefix,
                    startingNumber: bulkForm.startingNumber,
                    quantity: bulkForm.quantity,
                    padding: bulkForm.padding,
                    titlePrefix: bulkForm.titlePrefix || undefined,
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md h-11 px-5 text-xs font-bold"
              >
                {bulkGenerateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate {bulkForm.quantity} Files
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Bulk Import Excel / CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Import File Records from Excel / CSV</h3>
                  <p className="text-xs text-slate-400">Upload batch spreadsheet to bulk create file records</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-box">Default Target Box</Label>
                <select
                  id="import-box"
                  value={importBoxId}
                  onChange={(e) => setImportBoxId(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="">-- Choose Container Box --</option>
                  {boxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.barcode} {b.label ? `(${b.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Download className="w-4 h-4 text-blue-600" />
                  Need the Excel template format?
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Download Sample (.xlsx)
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 p-8 rounded-2xl text-center cursor-pointer transition-colors space-y-2 bg-slate-50/50"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700">Click to upload spreadsheet file (.xlsx, .csv)</p>
                <p className="text-[11px] text-slate-400">Required column: File Barcode (Label & Box Barcode optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {importRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Parsed Files ({importRows.length} rows)</span>
                    <span className="text-emerald-600">Ready to Import</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-xl divide-y text-xs">
                    {importRows.slice(0, 10).map((row, idx) => (
                      <div key={idx} className="flex justify-between px-3 py-2 text-slate-600">
                        <span className="font-mono font-semibold">{row.barcode}</span>
                        <span className="text-slate-400">{row.label || 'No Label'}</span>
                        <span className="font-mono text-[11px] text-slate-400">{row.boxBarcode || 'Default Box'}</span>
                      </div>
                    ))}
                    {importRows.length > 10 && (
                      <div className="text-center py-2 text-[11px] text-slate-400 bg-slate-50">
                        ... and {importRows.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl border-slate-200 h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={importRows.length === 0 || bulkImportMutation.isPending || !importBoxId}
                onClick={() =>
                  bulkImportMutation.mutate({
                    boxId: importBoxId,
                    rows: importRows,
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 text-xs font-bold"
              >
                {bulkImportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import {importRows.length} Files
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: Add Single File Record */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Add File Record</h3>
                </div>
                <Button onClick={() => setIsCreateOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="create-box">Container Box</Label>
                  <select
                    id="create-box"
                    value={createForm.boxId}
                    onChange={(e) => setCreateForm({ ...createForm, boxId: e.target.value })}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="">-- Choose Container Box --</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.barcode} {b.label ? `(${b.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-barcode">File Barcode</Label>
                  <Input
                    id="create-barcode"
                    value={createForm.barcode}
                    onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value.toUpperCase() })}
                    placeholder="e.g. FILE0001"
                    className="h-11 rounded-xl font-mono uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-title">Document Title / Label</Label>
                  <Input
                    id="create-title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. FY24 Balance Sheet & Invoices"
                    className="h-11 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl border-slate-200 h-11">
                  Cancel
                </Button>
                <Button
                  disabled={createMutation.isPending || !createForm.boxId || !createForm.barcode}
                  onClick={() =>
                    createMutation.mutate({
                      boxId: createForm.boxId,
                      barcode: createForm.barcode,
                      title: createForm.title || undefined,
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md h-11 px-5 text-xs font-bold"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save File
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: File Details */}
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
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
                  <VisualBarcode code={selectedFile?.barcode || ''} width={220} height={44} showText={true} />
                </div>

                <div className="space-y-3 divide-y divide-slate-100 border border-slate-100 rounded-2xl p-4 bg-white shadow-xs">
                  <div className="flex justify-between py-1"><span className="text-slate-500 font-semibold">Document Label</span><span className="font-bold text-slate-800">{fileDetail?.label || '—'}</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-slate-500 font-semibold">Current Box</span><span className="font-mono font-bold text-blue-600">{fileDetail?.box?.barcode || '—'}</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-slate-500 font-semibold">Home Box</span><span className="font-mono font-bold text-slate-700">{fileDetail?.box?.barcode || fileDetail?.homeBoxId || '—'}</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-slate-500 font-semibold">Client Owner</span><span className="font-semibold text-slate-700">{fileDetail?.client?.name || '—'}</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-slate-500 font-semibold">Status</span><span className="font-bold text-emerald-600">{fileDetail?.status}</span></div>
                </div>

                <Button
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-xs font-bold"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setEditLabel(selectedFile?.label || '');
                    setEditHomeBoxId(selectedFile?.homeBoxId || selectedFile?.box?.id || '');
                    setIsEditOpen(true);
                  }}
                >
                  Edit File Record
                </Button>
              </div>
            ) : (
              <TimelineList entries={timeline} />
            )}
          </div>
        </div>
      </div>

      {/* Edit Drawer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-slate-900">Edit File Record</h3>
                <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setIsEditOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="File label" className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Home Box (Refile Destination)</Label>
                  <select
                    value={editHomeBoxId}
                    onChange={(e) => setEditHomeBoxId(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="">-- Choose Container Box --</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>{b.barcode} {b.label ? `(${b.label})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-5 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl h-11">Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold">
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDelete.title}
        description={confirmDelete.description}
        isLoading={bulkActionMutation.isPending}
      />
    </div>
  );
}
