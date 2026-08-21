"use client";

import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Package,
  Search,
  Plus,
  Zap,
  Upload,
  Download,
  Printer,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  RefreshCw,
  Layers,
  FileBox,
  MapPin,
  Clock,
  Filter,
  X,
  AlertCircle,
  Tag,
  CheckSquare,
  Square,
  Building2,
  Warehouse,
  History,
  Barcode,
  List,
  LayoutGrid,
  CheckCircle2,
  ArrowRightLeft,
  TrendingUp,
  Loader2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  listRecordBoxes,
  getRecordBox,
  updateRecordBox,
  deleteRecordBox,
  getRecordBoxTimeline,
  RecordBox,
} from '@/lib/api/records';
import {
  getBarcodeStats,
  getNextBoxBarcode,
  createBarcode,
  bulkGenerateBarcodes,
  importBarcodes,
  bulkActionBarcodes,
  printBarcodes,
  BarcodeType,
  BarcodeStatus,
  ImportBarcodeRow,
  BulkGenerateRequest
} from '@/lib/api/barcode-master';
import { getClients } from '@/lib/api/client';
import { getSites } from '@/lib/api/site';
import { getBranches } from '@/lib/api/branch';
import { getWarehouses } from '@/lib/api/warehouse';
import { TimelineList } from '@/components/records/timeline-list';
import { BoxStatusBadge } from '@/components/records/status-badge';
import { VisualBarcode } from '@/components/records/visual-barcode';

const BOX_STATUS_OPTIONS = ['ACTIVE', 'IN_TRANSIT', 'MERGED', 'DESTROYED', 'UNASSIGNED', 'INACTIVE'] as const;

export default function BoxesPage() {
  const queryClient = useQueryClient();

  // Navigation & Search State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Checkbox Batch Selection
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);

  // Selected Box State
  const [selectedBox, setSelectedBox] = useState<RecordBox | null>(null);
  const [detailTab, setDetailTab] = useState<'files' | 'timeline' | 'location'>('files');

  // Modals & Drawers States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState<RecordBox | null>(null);

  // Edit State
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState<number>(25);
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Single Box Creation Form State
  const [createForm, setCreateForm] = useState<{
    barcode: string;
    label: string;
    status: BarcodeStatus;
    siteId: string;
    branchId: string;
    warehouseId: string;
    clientId: string;
    fileCapacity: number;
    remarks: string;
  }>({
    barcode: '',
    label: '',
    status: 'ACTIVE',
    siteId: '',
    branchId: '',
    warehouseId: '',
    clientId: '',
    fileCapacity: 20,
    remarks: ''
  });

  // Bulk Generator Form State
  const [generateForm, setGenerateForm] = useState<{
    prefix: string;
    startingNumber: number;
    quantity: number;
    siteId: string;
    branchId: string;
    warehouseId: string;
    remarks: string;
  }>({
    prefix: 'BOX',
    startingNumber: 1,
    quantity: 50,
    siteId: '',
    branchId: '',
    warehouseId: '',
    remarks: ''
  });

  // Excel Import State
  const [importRows, setImportRows] = useState<ImportBarcodeRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thermal Print Label State
  const [printLabelsData, setPrintLabelsData] = useState<{ barcode: string; zpl: string; type: string; company: string }[]>([]);

  // Queries
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['barcode-stats'],
    queryFn: getBarcodeStats
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['record-boxes', page, searchTerm, statusFilter, clientFilter, warehouseFilter, siteFilter],
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

  const { data: sitesData } = useQuery({
    queryKey: ['sites-all'],
    queryFn: () => getSites(1, 100),
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

  const { data: nextBarcodeData, isLoading: nextBarcodeLoading, refetch: refetchNextBarcode } = useQuery({
    queryKey: ['next-box-barcode'],
    queryFn: getNextBoxBarcode,
    enabled: isCreateOpen,
  });

  // Extract Data
  const boxes = data?.data || [];
  const meta = data?.meta;
  const clients = clientsData?.data || [];
  const sites = sitesData?.data || [];
  const warehouses = warehousesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      return createBarcode({
        barcode: createForm.barcode || nextBarcodeData,
        type: 'BOX',
        status: createForm.status,
        siteId: createForm.siteId || undefined,
        branchId: createForm.branchId || undefined,
        warehouseId: createForm.warehouseId || undefined,
        remarks: createForm.remarks || undefined
      });
    },
    onSuccess: (created) => {
      toast.success(`Box created successfully with barcode: ${created.barcode}`);
      setIsCreateOpen(false);
      setCreateForm({
        barcode: '',
        label: '',
        status: 'ACTIVE',
        siteId: '',
        branchId: '',
        warehouseId: '',
        clientId: '',
        fileCapacity: 20,
        remarks: ''
      });
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      queryClient.invalidateQueries({ queryKey: ['next-box-barcode'] });
      refetch();
      refetchStats();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create box')
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: (req: BulkGenerateRequest) => bulkGenerateBarcodes(req),
    onSuccess: (res) => {
      toast.success(`Successfully generated ${res.generatedCount} box barcodes`);
      setIsGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetch();
      refetchStats();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to bulk generate box barcodes')
  });

  const importMutation = useMutation({
    mutationFn: (rows: ImportBarcodeRow[]) => importBarcodes(rows),
    onSuccess: (res) => {
      toast.success(`Box import complete! Imported: ${res.importedCount}, Skipped: ${res.failedCount}`);
      setIsImportOpen(false);
      setImportRows([]);
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetch();
      refetchStats();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to import box barcodes')
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' }) => {
      if (action === 'DELETE') {
        await Promise.allSettled(ids.map((id) => deleteRecordBox(id)));
        try {
          await bulkActionBarcodes(ids, 'DELETE');
        } catch {
          // Handled via deleteRecordBox
        }
        return { message: `${ids.length} box(es) deleted successfully` };
      }
      return bulkActionBarcodes(ids, action);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Bulk action completed successfully');
      setSelectedBoxIds([]);
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetch();
      refetchStats();
    },
    onError: (err: any) => toast.error(err.message || 'Bulk action failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, label, capacity }: { id: string; label?: string; capacity?: number }) =>
      updateRecordBox(id, { label, capacity, fileCapacity: capacity }),
    onSuccess: (updatedBox) => {
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['record-box-detail'] });
      if (updatedBox && selectedBox) {
        setSelectedBox((prev) => (prev ? { ...prev, ...updatedBox } : updatedBox));
      }
      setIsEditOpen(false);
      toast.success('Box updated successfully');
      refetch();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update box'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecordBox(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      setIsDeleteOpen(false);
      setBoxToDelete(null);
      setSelectedBoxIds((prev) => prev.filter((i) => i !== boxToDelete?.id));
      toast.success('Box record deleted successfully');
      refetch();
      refetchStats();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete box'),
  });

  // Calculate 8 KPI Stats
  const kpiStats = useMemo(() => {
    const totalBoxes = meta?.total ?? boxes.length;
    const active = boxes.filter((b) => b.status === 'ACTIVE').length;
    const inTransit = boxes.filter((b) => b.status === 'IN_TRANSIT').length;
    const totalFiles = boxes.reduce((acc, b) => acc + (b.fileCount || 0), 0);
    const totalCapacity = boxes.reduce((acc, b) => acc + (b.capacity || b.fileCapacity || 25), 0);
    const capacityRatio = totalCapacity > 0 ? Math.round((totalFiles / totalCapacity) * 100) : 0;
    const boxBarcodes = statsData?.boxCount || 0;
    const assigned = statsData?.assignedCount || 0;
    const unassigned = statsData?.unassignedCount || 0;
    const todayGen = statsData?.todayGenerated || 0;

    return {
      total: totalBoxes,
      active,
      inTransit,
      totalFiles,
      totalCapacity,
      capacityRatio,
      boxBarcodes,
      assigned,
      unassigned,
      todayGen
    };
  }, [boxes, meta, statsData]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!boxes.length) {
      toast.error('No box records available to export');
      return;
    }

    const exportData = boxes.map((box) => ({
      'Box Barcode': box.barcode,
      Label: box.label || '—',
      Status: box.status,
      Client: box.client?.name || '—',
      'Location Barcode': box.location?.barcode || '—',
      'Files Stored': box.fileCount ?? 0,
      'Capacity Limit': box.fileCapacity ?? 20,
      'Last Updated': new Date(box.updatedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Box Master');
    XLSX.writeFile(workbook, `Box_Master_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Exported Box Master data to Excel');
  };

  // CSV/Excel Import File Handler
  const handleParseImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        const parsedRows: ImportBarcodeRow[] = rawJson.map((row) => ({
          barcode: String(row.barcode || row.Barcode || row['Box Barcode'] || '').trim(),
          type: 'BOX' as BarcodeType,
          status: (row.status || row.Status ? String(row.status || row.Status).toUpperCase() as BarcodeStatus : 'ACTIVE'),
          siteCode: row.siteCode || row.site_code || row.SiteCode,
          branchCode: row.branchCode || row.branch_code || row.BranchCode,
          warehouseCode: row.warehouseCode || row.warehouse_code || row.WarehouseCode,
          remarks: row.remarks || row.Remarks || ''
        })).filter((r) => r.barcode.length > 0);

        setImportRows(parsedRows);
        toast.success(`Parsed ${parsedRows.length} valid box rows.`);
      } catch (e) {
        toast.error('Failed to parse spreadsheet file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Print Label Handler
  const handleTriggerPrint = async (idsToPrint: string[]) => {
    if (idsToPrint.length === 0) return toast.error('No boxes selected for printing');
    try {
      const res = await printBarcodes(idsToPrint);
      setPrintLabelsData(res.labels || []);
      setIsPrintOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate print payloads');
    }
  };

  // Checkbox Selection Toggle Helpers
  const toggleSelectAll = () => {
    if (boxes.length > 0 && selectedBoxIds.length === boxes.length) {
      setSelectedBoxIds([]);
    } else {
      setSelectedBoxIds(boxes.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedBoxIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Filtered files in selected box detail drawer
  const filteredFiles = useMemo(() => {
    if (!boxDetail?.files) return [];
    if (!fileSearchQuery.trim()) return boxDetail.files;
    const q = fileSearchQuery.toLowerCase();
    return boxDetail.files.filter(
      (f) => f.barcode.toLowerCase().includes(q) || (f.label && f.label.toLowerCase().includes(q))
    );
  }, [boxDetail?.files, fileSearchQuery]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading Box Master records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="text-sm font-semibold text-slate-700">Failed to load box records</p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 pb-16">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Box Master"
        description="Centralized registry & physical box storage repository management."
        badge={`Inventory Registry · ${kpiStats.total} Records`}
        icon={Package}
      >
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-4 text-xs font-semibold shadow-lg shadow-blue-600/30"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Box
        </Button>

        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md rounded-xl h-10 px-4 text-xs font-semibold"
        >
          <Zap className="w-4 h-4 mr-1.5 text-amber-300" /> Sequence Generator
        </Button>

        <Button
          onClick={() => setIsImportOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md rounded-xl h-10 px-3.5 text-xs font-medium"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-300" /> Import
        </Button>

        <Button
          onClick={handleExportExcel}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md rounded-xl h-10 px-3.5 text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-slate-300" /> Export
        </Button>
      </PageHeaderCard>

      {/* 8 KPI Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Boxes</span>
          <div className="text-xl font-bold text-slate-900">{isLoading ? '-' : kpiStats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">Active</span>
          <div className="text-xl font-bold text-emerald-700">{isLoading ? '-' : kpiStats.active}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">In Transit</span>
          <div className="text-xl font-bold text-amber-700">{isLoading ? '-' : kpiStats.inTransit}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider">Total Files</span>
          <div className="text-xl font-bold text-indigo-700">{isLoading ? '-' : kpiStats.totalFiles}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-blue-500 uppercase tracking-wider">Occupancy</span>
          <div className="text-xl font-bold text-blue-700">{kpiStats.capacityRatio}%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-purple-500 uppercase tracking-wider">Box Barcodes</span>
          <div className="text-xl font-bold text-purple-700">{statsLoading ? '-' : kpiStats.boxBarcodes}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-teal-500 uppercase tracking-wider">Unassigned</span>
          <div className="text-xl font-bold text-teal-700">{statsLoading ? '-' : kpiStats.unassigned}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Today Gen</span>
          <div className="text-xl font-bold text-slate-800">{statsLoading ? '-' : kpiStats.todayGen}</div>
        </div>
      </div>

      {/* Filter & Toolbar Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by box barcode or label..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {BOX_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Client Filter */}
            <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Site Filter */}
            <Select value={siteFilter} onValueChange={(v) => { setSiteFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Warehouse Filter */}
            <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              onClick={() => {
                refetch();
                refetchStats();
              }}
              variant="outline"
              className="h-10 w-10 p-0 rounded-xl border-slate-200"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            {/* View Switcher Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid Cards
              </button>
            </div>
          </div>
        </div>

        {/* Selected Rows Batch Bar */}
        {selectedBoxIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl text-xs text-blue-900 animate-in fade-in duration-200">
            <span className="font-semibold">{selectedBoxIds.length} box(es) selected</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs"
                onClick={() => handleTriggerPrint(selectedBoxIds)}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs"
                onClick={() => bulkActionMutation.mutate({ ids: selectedBoxIds, action: 'ACTIVATE' })}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg text-xs"
                onClick={() => bulkActionMutation.mutate({ ids: selectedBoxIds, action: 'DEACTIVATE' })}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedBoxIds.length} selected box(es)?`)) {
                    bulkActionMutation.mutate({ ids: selectedBoxIds, action: 'DELETE' });
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" /> Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main View Area: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={boxes.length > 0 && selectedBoxIds.length === boxes.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Box Barcode</th>
                  <th className="p-3.5">Label / Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Current Location</th>
                  <th className="p-3.5">Capacity / Files</th>
                  <th className="p-3.5">Last Updated</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading box records...
                    </td>
                  </tr>
                ) : boxes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      No box records found matching current filters.
                    </td>
                  </tr>
                ) : (
                  boxes.map((box) => {
                    const isSelected = selectedBoxIds.includes(box.id);
                    return (
                      <tr
                        key={box.id}
                        className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(box.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5">
                          <button
                            className="group flex flex-col items-start gap-1 text-left py-1"
                            onClick={() => {
                              setSelectedBox(box);
                              setDetailTab('files');
                              setIsDetailOpen(true);
                            }}
                          >
                            <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {box.barcode}
                            </span>
                            <VisualBarcode code={box.barcode} width={120} height={24} showText={false} />
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{box.label || 'Unlabeled Box'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {box.id.slice(0, 8)}...</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <BoxStatusBadge status={box.status} />
                        </td>
                        <td className="p-3.5">
                          {box.client?.name ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800">{box.client.name}</span>
                                {box.client.code && <span className="text-[10px] text-slate-400 font-mono">{box.client.code}</span>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {box.location?.barcode ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium border border-slate-200">
                              {box.location.barcode}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No Location</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {(() => {
                            const cap = box.capacity || box.fileCapacity || 25;
                            const count = box.fileCount ?? 0;
                            const ratio = count / cap;
                            return (
                              <div className="flex flex-col gap-1 w-28">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-slate-700">{count} files</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{cap} max</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      ratio >= 0.9
                                        ? 'bg-rose-500'
                                        : ratio >= 0.6
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {new Date(box.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg"
                              onClick={() => {
                                setSelectedBox(box);
                                setDetailTab('files');
                                setIsDetailOpen(true);
                              }}
                              title="View Box Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-indigo-600 rounded-lg"
                              onClick={() => {
                                setSelectedBox(box);
                                setEditLabel(box.label || '');
                                setEditCapacity(box.capacity || box.fileCapacity || 25);
                                setIsEditOpen(true);
                              }}
                              title="Edit Box"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-emerald-600 rounded-lg"
                              onClick={() => handleTriggerPrint([box.id])}
                              title="Print Barcode Label"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              onClick={() => {
                                setBoxToDelete(box);
                                setIsDeleteOpen(true);
                              }}
                              title="Delete Box"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              <div>
                Page <span className="font-semibold text-slate-700">{meta.page}</span> of{' '}
                <span className="font-semibold text-slate-700">{meta.totalPages}</span> ({meta.total} total boxes)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {boxes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No boxes found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boxes.map((box) => {
                const isSelected = selectedBoxIds.includes(box.id);
                return (
                  <div
                    key={box.id}
                    className={`group bg-white rounded-2xl border shadow-xs hover:shadow-md hover:border-blue-300 transition-all p-5 flex flex-col justify-between ${
                      isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      {/* Header: Barcode & Checkbox */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(box.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {box.barcode}
                          </span>
                        </div>
                        <BoxStatusBadge status={box.status} />
                      </div>

                      {/* Visual Barcode Graphic */}
                      <div className="my-4 flex justify-center bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <VisualBarcode code={box.barcode} width={150} height={32} showText={false} />
                      </div>

                      {/* Label & Details */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Label</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {box.label || 'Unlabeled Box'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Client</span>
                            <span className="text-slate-700 font-medium">{box.client?.name || '—'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
                            <span className="font-mono text-slate-700 font-medium">
                              {box.location?.barcode || '—'}
                            </span>
                          </div>
                        </div>

                        {/* File capacity progress */}
                        <div className="pt-2">
                          {(() => {
                            const cap = box.capacity || box.fileCapacity || 25;
                            const count = box.fileCount ?? 0;
                            const ratio = count / cap;
                            return (
                              <>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-slate-500 font-medium">Files inside</span>
                                  <span className="font-bold text-slate-800">
                                    {count} / {cap}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      ratio >= 0.9
                                        ? 'bg-rose-500'
                                        : ratio >= 0.6
                                        ? 'bg-amber-500'
                                        : 'bg-blue-600'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, Math.round(ratio * 100))}%`,
                                    }}
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl text-xs font-semibold"
                        onClick={() => {
                          setSelectedBox(box);
                          setDetailTab('files');
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" /> Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl px-2 text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setSelectedBox(box);
                          setEditLabel(box.label || '');
                          setEditCapacity(box.capacity || box.fileCapacity || 25);
                          setIsEditOpen(true);
                        }}
                        title="Edit Box"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl px-2 text-slate-500 hover:text-slate-900"
                        onClick={() => handleTriggerPrint([box.id])}
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => {
                          setBoxToDelete(box);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Slide-Over Drawer: Add Box */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg">Add New Box Barcode</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Box Barcode</Label>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-Generated
                  </span>
                </div>
                <div className="mt-1 relative">
                  <Input
                    value={nextBarcodeLoading ? 'Generating...' : nextBarcodeData || 'BX...'}
                    readOnly
                    className="font-mono text-sm font-bold bg-slate-100/80 border-slate-200 text-slate-800 rounded-xl cursor-not-allowed select-all"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Unique sequential barcode assigned automatically on save.
                  </div>
                </div>
              </div>

              {nextBarcodeData && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Barcode Preview</span>
                  <VisualBarcode code={nextBarcodeData} width={200} height={38} />
                </div>
              )}

              <div>
                <Label className="text-xs font-bold text-slate-700">Initial Status</Label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as BarcodeStatus })}
                  className="w-full mt-1 h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-medium text-slate-800 outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UNASSIGNED">UNASSIGNED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Site Assignment</Label>
                <select
                  value={createForm.siteId}
                  onChange={(e) => setCreateForm({ ...createForm, siteId: e.target.value })}
                  className="w-full mt-1 h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-medium text-slate-800 outline-none"
                >
                  <option value="">Select Site (Optional)</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Warehouse Assignment</Label>
                <select
                  value={createForm.warehouseId}
                  onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
                  className="w-full mt-1 h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-medium text-slate-800 outline-none"
                >
                  <option value="">Select Warehouse (Optional)</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Remarks / Description</Label>
                <Input
                  value={createForm.remarks}
                  onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
                  placeholder="Notes..."
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending || nextBarcodeLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Create Box'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer: Sequence Generator */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">Box Sequence Generator</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsGenerateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <Label className="text-xs font-bold text-slate-700">Prefix *</Label>
                <Input
                  value={generateForm.prefix}
                  onChange={(e) => setGenerateForm({ ...generateForm, prefix: e.target.value })}
                  placeholder="e.g. BOX-"
                  className="mt-1 font-mono rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Start Number *</Label>
                  <Input
                    type="number"
                    value={generateForm.startingNumber}
                    onChange={(e) => setGenerateForm({ ...generateForm, startingNumber: parseInt(e.target.value) || 1 })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Quantity *</Label>
                  <Input
                    type="number"
                    value={generateForm.quantity}
                    onChange={(e) => setGenerateForm({ ...generateForm, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Site</Label>
                <select
                  value={generateForm.siteId}
                  onChange={(e) => setGenerateForm({ ...generateForm, siteId: e.target.value })}
                  className="w-full mt-1 h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white"
                >
                  <option value="">Select Site (Optional)</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Warehouse</Label>
                <select
                  value={generateForm.warehouseId}
                  onChange={(e) => setGenerateForm({ ...generateForm, warehouseId: e.target.value })}
                  className="w-full mt-1 h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white"
                >
                  <option value="">Select Warehouse (Optional)</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Remarks</Label>
                <Input
                  value={generateForm.remarks}
                  onChange={(e) => setGenerateForm({ ...generateForm, remarks: e.target.value })}
                  placeholder="Batch generator notes..."
                  className="mt-1 rounded-xl"
                />
              </div>

              {/* Live Preview of Sequence */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sequence Sample</span>
                <div className="font-mono text-xs text-blue-700 font-bold">
                  {generateForm.prefix}{String(generateForm.startingNumber).padStart(4, '0')} ... {generateForm.prefix}{String(generateForm.startingNumber + generateForm.quantity - 1).padStart(4, '0')}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsGenerateOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  bulkGenerateMutation.mutate({
                    type: 'BOX',
                    prefix: generateForm.prefix,
                    startingNumber: generateForm.startingNumber,
                    quantity: generateForm.quantity,
                    siteId: generateForm.siteId || undefined,
                    warehouseId: generateForm.warehouseId || undefined,
                    remarks: generateForm.remarks || undefined
                  });
                }}
                disabled={bulkGenerateMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
              >
                {bulkGenerateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : `Generate ${generateForm.quantity} Boxes`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer: Import Boxes */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg">Import Box Barcodes (Excel / CSV)</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all space-y-2"
              >
                <FileBox className="w-10 h-10 text-blue-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">Click to upload spreadsheet file (.xlsx, .csv)</p>
                <p className="text-xs text-slate-400">Columns: barcode, status, siteCode, warehouseCode, remarks</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleParseImportFile(file);
                  }}
                  accept=".xlsx,.csv"
                  className="hidden"
                />
              </div>

              {importRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Parsed Preview ({importRows.length} rows)</span>
                    <Button variant="ghost" size="sm" onClick={() => setImportRows([])} className="text-rose-600 h-6 text-[11px]">
                      Clear
                    </Button>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2">Barcode</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono">{r.barcode}</td>
                            <td className="p-2">{r.status || 'ACTIVE'}</td>
                            <td className="p-2 text-slate-400">{r.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsImportOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => importMutation.mutate(importRows)}
                disabled={importRows.length === 0 || importMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : `Import ${importRows.length} Rows`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thermal Print Labels */}
      {isPrintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Thermal Box Label Preview</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsPrintOpen(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto p-1">
              {printLabelsData.map((lbl, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center space-y-2">
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      {lbl.company || 'RMS PHYSICAL STORAGE'}
                    </span>
                    <span className="font-mono text-base font-black text-slate-900">{lbl.barcode}</span>
                  </div>
                  <VisualBarcode code={lbl.barcode} width={200} height={48} showText={false} />
                  <div className="text-[10px] text-slate-400 font-mono">Payload: {lbl.type}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setIsPrintOpen(false)} className="rounded-xl">
                Close
              </Button>
              <Button
                onClick={() => {
                  window.print();
                  toast.success('Print job dispatched');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Box Detail Drawer */}
      <div className={`fixed inset-0 z-50 ${isDetailOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ${
            isDetailOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsDetailOpen(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isDetailOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <h2 className="font-mono text-xl font-bold tracking-tight">{selectedBox?.barcode}</h2>
              </div>
              <p className="text-xs text-slate-400">
                {selectedBox?.label ? `Label: ${selectedBox.label}` : 'No label set for box'}
              </p>
              <div className="pt-2">
                <VisualBarcode code={selectedBox?.barcode || ''} width={160} height={36} showText={false} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
                onClick={() => {
                  if (selectedBox) {
                    setEditLabel(selectedBox.label || '');
                    setEditCapacity(boxDetail?.capacity || selectedBox.capacity || selectedBox.fileCapacity || 25);
                    setIsEditOpen(true);
                  }
                }}
              >
                <Edit2 className="w-4 h-4 mr-1 text-indigo-400" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
                onClick={() => selectedBox && handleTriggerPrint([selectedBox.id])}
              >
                <Printer className="w-4 h-4 mr-1 text-emerald-400" /> Print
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-2"
                onClick={() => setIsDetailOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <BoxStatusBadge status={selectedBox?.status || 'ACTIVE'} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Client</span>
              <span className="font-semibold text-slate-800">{selectedBox?.client?.name || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Location</span>
              <span className="font-mono font-semibold text-slate-800">{selectedBox?.location?.barcode || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
              <span className="font-mono font-semibold text-slate-800">
                {boxDetail?.capacity || selectedBox?.capacity || selectedBox?.fileCapacity || 25} files
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Files in Box</span>
              <span className="font-mono font-semibold text-slate-800">
                {boxDetail?.files?.length ?? selectedBox?.fileCount ?? 0} / {boxDetail?.capacity || selectedBox?.capacity || selectedBox?.fileCapacity || 25}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Slots</span>
              <span className="font-mono font-semibold text-emerald-600">
                {Math.max(
                  0,
                  (boxDetail?.capacity || selectedBox?.capacity || selectedBox?.fileCapacity || 25) -
                    (boxDetail?.files?.length ?? selectedBox?.fileCount ?? 0)
                )}{' '}
                left
              </span>
            </div>
          </div>

          {/* Drawer Tabs Header */}
          <div className="flex border-b border-slate-200 bg-white px-6 gap-6">
            {(['files', 'timeline', 'location'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  detailTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'files' ? `Files (${boxDetail?.files?.length || 0})` : tab}
              </button>
            ))}
          </div>

          {/* Drawer Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <p className="text-xs text-slate-400 mt-2">Loading detail contents...</p>
              </div>
            ) : detailTab === 'files' ? (
              <div className="space-y-4">
                {/* Search File Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Search file barcode or label..."
                    className="pl-9 h-9 rounded-xl text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileBox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No files in this box</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <FileBox className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <a
                              href={`/file-records?search=${encodeURIComponent(file.barcode)}`}
                              className="font-mono font-bold text-blue-600 hover:underline block"
                            >
                              {file.barcode}
                            </a>
                            <span className="text-slate-500 text-[11px]">{file.label || 'No label'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                            {file.status || 'IN_BOX'}
                          </span>
                          <a
                            href={`/file-records?search=${encodeURIComponent(file.barcode)}`}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline px-1 py-0.5"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : detailTab === 'timeline' ? (
              <TimelineList entries={timeline} />
            ) : (
              /* Location Hierarchy Tab */
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Location Barcode</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedBox?.location?.barcode || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Location Name</span>
                    <span className="font-semibold text-slate-800">
                      {selectedBox?.location?.name || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" /> Location Hierarchy
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Physical location hierarchy is assigned and audited through scanner workflows (Fresh Box Move, Refile, Inventory Audit).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-Over Drawer: Edit Box */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-lg">Edit Box</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedBox?.barcode}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Box Barcode</span>
                  <span className="font-mono font-bold text-slate-900">{selectedBox?.barcode}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Current Files in Box</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                    {selectedBox?.fileCount || 0} files
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Current Capacity</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {selectedBox?.capacity || selectedBox?.fileCapacity || 25} files
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Label / Description</Label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Enter descriptive label..."
                  className="mt-1 rounded-xl"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Box Capacity (Max Files)</Label>
                <Input
                  type="number"
                  min={Math.max(1, selectedBox?.fileCount || 0)}
                  value={isNaN(editCapacity) ? '' : editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value, 10))}
                  placeholder="e.g. 25, 30, 50"
                  className="mt-1 rounded-xl font-mono text-sm"
                />
                {editCapacity < (selectedBox?.fileCount || 0) && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Cannot reduce box capacity below current file count ({selectedBox?.fileCount || 0}).
                  </p>
                )}
                {editCapacity < 1 && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Box capacity must be at least 1.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedBox) {
                    if (editCapacity < (selectedBox.fileCount || 0)) {
                      toast.error(`Cannot reduce box capacity below current file count (${selectedBox.fileCount || 0}).`);
                      return;
                    }
                    if (editCapacity < 1) {
                      toast.error('Box capacity must be at least 1.');
                      return;
                    }
                    updateMutation.mutate({
                      id: selectedBox.id,
                      label: editLabel,
                      capacity: Number(editCapacity)
                    });
                  }
                }}
                disabled={
                  updateMutation.isPending ||
                  isNaN(editCapacity) ||
                  editCapacity < 1 ||
                  editCapacity < (selectedBox?.fileCount || 0)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setBoxToDelete(null);
        }}
        onConfirm={() => {
          if (boxToDelete) {
            deleteMutation.mutate(boxToDelete.id);
          }
        }}
        title="Delete Box Record"
        description={`Are you sure you want to delete box ${boxToDelete?.barcode}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
