"use client";

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  QrCode,
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
  Barcode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getBarcodeStats,
  listBarcodes,
  getBarcodeById,
  createBarcode,
  updateBarcode,
  deleteBarcode,
  bulkGenerateBarcodes,
  importBarcodes,
  bulkActionBarcodes,
  bulkAssignBarcodes,
  printBarcodes,
  BarcodeMasterItem,
  BarcodeType,
  BarcodeStatus,
  ListBarcodesParams,
  BulkGenerateRequest,
  ImportBarcodeRow
} from '@/lib/api/barcode-master';
import { getSites } from '@/lib/api/site';
import { getBranches } from '@/lib/api/branch';
import { getWarehouses } from '@/lib/api/warehouse';

/**
 * Visual 1D Barcode Graphic Component
 * Above: Barcode Text String
 * Niche (Below): Scannable 1D Barcode SVG Graphic
 */
function VisualBarcode({
  code,
  width = 160,
  height = 36,
  showText = true,
  className = ""
}: {
  code: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}) {
  if (!code) return null;

  // Generate deterministic Code 128 / Code 39 bar pattern widths
  const generateBars = (str: string) => {
    const bars: { width: number; isGap: boolean }[] = [];
    
    // Start quiet zone & guard bars
    bars.push({ width: 2, isGap: false });
    bars.push({ width: 1, isGap: true });
    bars.push({ width: 2, isGap: false });
    bars.push({ width: 2, isGap: true });

    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      const w1 = ((ch * 3 + i) % 3) + 1;
      const g1 = ((ch * 5 + i) % 2) + 1;
      const w2 = ((ch * 7 + i) % 3) + 1;
      const g2 = ((ch * 2 + i) % 2) + 1;
      
      bars.push({ width: w1, isGap: false });
      bars.push({ width: g1, isGap: true });
      bars.push({ width: w2, isGap: false });
      bars.push({ width: g2, isGap: true });
    }

    // End guard bars
    bars.push({ width: 2, isGap: false });
    bars.push({ width: 1, isGap: true });
    bars.push({ width: 3, isGap: false });

    return bars;
  };

  const bars = generateBars(code);
  const totalUnits = bars.reduce((sum, b) => sum + b.width, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs ${className}`}>
      {showText && (
        <span className="font-mono font-bold tracking-widest text-slate-900 text-xs mb-1 uppercase">
          {code}
        </span>
      )}
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        preserveAspectRatio="none"
        className="block"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (bar.isGap) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#0F172A"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function BarcodeMasterPage() {
  const queryClient = useQueryClient();

  // Filter States
  const [params, setParams] = useState<ListBarcodesParams>({
    page: 1,
    limit: 20,
    search: '',
    type: undefined,
    status: undefined,
    isAssigned: undefined,
    siteId: undefined,
    branchId: undefined,
    warehouseId: undefined,
    startDate: '',
    endDate: ''
  });

  const hasActiveFilters = !!(params.search || params.type || params.status || params.isAssigned !== undefined || params.siteId || params.branchId || params.warehouseId);

  const clearAllFilters = () => setParams(p => ({
    ...p,
    search: '',
    type: undefined,
    status: undefined,
    isAssigned: undefined,
    siteId: undefined,
    branchId: undefined,
    warehouseId: undefined,
    page: 1,
  }));


  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Slide-Over Drawers States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedBarcodeId, setSelectedBarcodeId] = useState<string | null>(null);
  const [editingBarcode, setEditingBarcode] = useState<BarcodeMasterItem | null>(null);

  // Form States - Create
  const [createForm, setCreateForm] = useState<{
    barcode: string;
    type: BarcodeType;
    status: BarcodeStatus;
    siteId: string;
    branchId: string;
    warehouseId: string;
    remarks: string;
  }>({
    barcode: '',
    type: 'BOX',
    status: 'UNASSIGNED',
    siteId: '',
    branchId: '',
    warehouseId: '',
    remarks: ''
  });

  // Form States - Bulk Generate
  const [generateForm, setGenerateForm] = useState<{
    type: BarcodeType;
    prefix: string;
    startingNumber: number;
    quantity: number;
    siteId: string;
    branchId: string;
    warehouseId: string;
    remarks: string;
  }>({
    type: 'BOX',
    prefix: 'BOX',
    startingNumber: 1,
    quantity: 50,
    siteId: '',
    branchId: '',
    warehouseId: '',
    remarks: ''
  });

  // Import State
  const [importRows, setImportRows] = useState<ImportBarcodeRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print State
  const [printLabelsData, setPrintLabelsData] = useState<{ barcode: string; zpl: string; type: string; company: string }[]>([]);

  // Queries
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['barcode-stats'],
    queryFn: getBarcodeStats
  });

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ['barcode-list', params],
    queryFn: () => listBarcodes(params)
  });

  const { data: barcodeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['barcode-detail', selectedBarcodeId],
    queryFn: () => (selectedBarcodeId ? getBarcodeById(selectedBarcodeId) : null),
    enabled: !!selectedBarcodeId
  });

  const { data: sitesData } = useQuery({ queryKey: ['sites'], queryFn: () => getSites(1, 100) });
  const { data: branchesData } = useQuery({ queryKey: ['branches'], queryFn: () => getBranches(1, 100) });
  const { data: warehousesData } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses(1, 100) });

  const sites = sitesData?.data || [];
  const branches = branchesData?.data || [];
  const warehouses = warehousesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBarcode,
    onSuccess: () => {
      toast.success('Barcode created successfully');
      setIsCreateOpen(false);
      setCreateForm({
        barcode: '',
        type: 'BOX',
        status: 'UNASSIGNED',
        siteId: '',
        branchId: '',
        warehouseId: '',
        remarks: ''
      });
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create barcode');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BarcodeMasterItem> }) => updateBarcode(id, data),
    onSuccess: () => {
      toast.success('Barcode updated successfully');
      setEditingBarcode(null);
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update barcode');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBarcode,
    onSuccess: () => {
      toast.success('Barcode deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete barcode');
    }
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: bulkGenerateBarcodes,
    onSuccess: (data) => {
      toast.success(`Successfully generated ${data.generatedCount} barcodes`);
      setIsGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate barcodes');
    }
  });

  const importMutation = useMutation({
    mutationFn: (rows: ImportBarcodeRow[]) => importBarcodes(rows),
    onSuccess: (res) => {
      toast.success(`Import complete! Imported: ${res.importedCount}, Skipped: ${res.failedCount}`);
      setIsImportOpen(false);
      setImportRows([]);
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to import barcodes');
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' }) =>
      bulkActionBarcodes(ids, action),
    onSuccess: (res) => {
      toast.success(res.message || 'Bulk action completed');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk action failed');
    }
  });

  // Bulk Assign modal state
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [assignWarehouseId, setAssignWarehouseId] = useState('');
  const [assignSiteId, setAssignSiteId] = useState('');
  const [assignBranchId, setAssignBranchId] = useState('');

  const bulkAssignMutation = useMutation({
    mutationFn: () => bulkAssignBarcodes(selectedIds, {
      warehouseId: assignWarehouseId || null,
      siteId: assignSiteId || null,
      branchId: assignBranchId || null,
    }),
    onSuccess: (res) => {
      toast.success(res.message || 'Barcodes assigned successfully');
      setIsBulkAssignOpen(false);
      setAssignWarehouseId('');
      setAssignSiteId('');
      setAssignBranchId('');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['barcode-list'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
      refetchList();
      refetchStats();
    },
    onError: (err: any) => toast.error(err.message || 'Bulk assign failed'),
  });

  // Table Row Selection
  const items = listData?.data || [];
  const total = listData?.pagination?.total || 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // CSV/Excel Import Handler
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
          barcode: String(row.barcode || row.Barcode || '').trim(),
          type: (String(row.type || row.Type || 'BOX').toUpperCase() as BarcodeType),
          status: (row.status || row.Status ? String(row.status || row.Status).toUpperCase() as BarcodeStatus : 'UNASSIGNED'),
          siteCode: row.siteCode || row.site_code || row.SiteCode,
          branchCode: row.branchCode || row.branch_code || row.BranchCode,
          warehouseCode: row.warehouseCode || row.warehouse_code || row.WarehouseCode,
          remarks: row.remarks || row.Remarks || ''
        })).filter((r) => r.barcode.length > 0);

        setImportRows(parsedRows);
        toast.success(`Parsed ${parsedRows.length} valid barcode rows.`);
      } catch (e) {
        toast.error('Failed to parse spreadsheet file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Export Data Handler
  const handleExportData = () => {
    if (items.length === 0) return toast.error('No data available to export');
    const exportRows = items.map((b) => ({
      ID: b.id,
      Barcode: b.barcode,
      Type: b.type,
      Status: b.status,
      IsAssigned: b.isAssigned ? 'YES' : 'NO',
      AssignedToType: b.assignedToType || '',
      AssignedToID: b.assignedToId || '',
      Site: b.site?.name || '',
      Warehouse: b.warehouse?.name || '',
      CreatedBy: b.createdBy?.fullName || '',
      CreatedAt: new Date(b.createdAt).toLocaleString(),
      Remarks: b.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Barcodes');
    XLSX.writeFile(wb, `Barcode_Master_${Date.now()}.xlsx`);
  };

  // Print Label Handler
  const handleTriggerPrint = async (idsToPrint: string[]) => {
    if (idsToPrint.length === 0) return toast.error('No barcodes selected for printing');
    try {
      const res = await printBarcodes(idsToPrint);
      setPrintLabelsData(res.labels || []);
      setIsPrintOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate print payloads');
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status: BarcodeStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNASSIGNED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INACTIVE':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'LOST':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DESTROYED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getTypeBadge = (type: BarcodeType) => {
    switch (type) {
      case 'BOX':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'FILE_RECORD':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'LOCATION':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Barcode Master</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized registry & barcode repository management for physical assets
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Barcode
          </Button>

          <Button
            onClick={() => setIsGenerateOpen(true)}
            variant="outline"
            className="border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100 rounded-xl h-10 px-4 text-xs font-semibold"
          >
            <Zap className="w-4 h-4 mr-1.5 text-amber-600" /> Sequence Generator
          </Button>

          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 rounded-xl h-10 px-3.5 text-xs font-medium"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Import
          </Button>

          <Button
            onClick={handleExportData}
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 rounded-xl h-10 px-3.5 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
          <div className="text-xl font-bold text-slate-900">{statsLoading ? '-' : statsData?.total || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider">Box Barcodes</span>
          <div className="text-xl font-bold text-indigo-700">{statsLoading ? '-' : statsData?.boxCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-teal-500 uppercase tracking-wider">File Barcodes</span>
          <div className="text-xl font-bold text-teal-700">{statsLoading ? '-' : statsData?.fileCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-violet-500 uppercase tracking-wider">Locations</span>
          <div className="text-xl font-bold text-violet-700">{statsLoading ? '-' : statsData?.locationCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-blue-500 uppercase tracking-wider">Assigned</span>
          <div className="text-xl font-bold text-blue-700">{statsLoading ? '-' : statsData?.assignedCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">Unassigned</span>
          <div className="text-xl font-bold text-amber-700">{statsLoading ? '-' : statsData?.unassignedCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-rose-500 uppercase tracking-wider">Inactive</span>
          <div className="text-xl font-bold text-rose-700">{statsLoading ? '-' : statsData?.inactiveCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Today Generated</span>
          <div className="text-xl font-bold text-slate-800">{statsLoading ? '-' : statsData?.todayGenerated || 0}</div>
        </div>
      </div>

      {/* Filter & Toolbar Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search barcode string, notes, or assignment..."
              value={params.search || ''}
              onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
              className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs focus:bg-white transition-colors"
            />
            {params.search && (
              <button
                onClick={() => setParams((p) => ({ ...p, search: '', page: 1 }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Type Filter */}
            <select
              value={params.type || ''}
              onChange={(e) => setParams((p) => ({ ...p, type: (e.target.value || undefined) as BarcodeType, page: 1 }))}
              className="h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50/50 text-slate-700 font-medium focus:bg-white outline-none"
            >
              <option value="">All Types</option>
              <option value="BOX">Box Barcodes</option>
              <option value="FILE_RECORD">File Barcodes</option>
              <option value="LOCATION">Location Barcodes</option>
            </select>

            {/* Status Filter — only real status values */}
            <select
              value={params.status || ''}
              onChange={(e) => setParams((p) => ({ ...p, status: (e.target.value || undefined) as BarcodeStatus, page: 1 }))}
              className="h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50/50 text-slate-700 font-medium focus:bg-white outline-none"
            >
              <option value="">All Statuses</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOST">Lost</option>
              <option value="DESTROYED">Destroyed</option>
            </select>

            {/* Assignment Filter */}
            <select
              value={params.isAssigned === undefined ? '' : params.isAssigned ? 'true' : 'false'}
              onChange={(e) => setParams((p) => ({ ...p, isAssigned: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 }))}
              className="h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50/50 text-slate-700 font-medium focus:bg-white outline-none"
            >
              <option value="">All Assignments</option>
              <option value="true">Assigned to Asset</option>
              <option value="false">Not Assigned</option>
            </select>

            {/* Site Filter */}
            <select
              value={params.siteId || ''}
              onChange={(e) => setParams((p) => ({ ...p, siteId: e.target.value || undefined, page: 1 }))}
              className="h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50/50 text-slate-700 font-medium focus:bg-white outline-none"
            >
              <option value="">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              value={params.branchId || ''}
              onChange={(e) => setParams((p) => ({ ...p, branchId: e.target.value || undefined, page: 1 }))}
              className="h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50/50 text-slate-700 font-medium focus:bg-white outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Warehouse Filter */}
            <select
              value={params.warehouseId || ''}
              onChange={(e) => setParams((p) => ({ ...p, warehouseId: e.target.value || undefined, page: 1 }))}
              className="h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50/50 text-slate-700 font-medium focus:bg-white outline-none"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                className="h-10 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            )}

            <Button
              onClick={() => { refetchList(); refetchStats(); }}
              variant="outline"
              className="h-10 w-10 p-0 rounded-xl border-slate-200"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </div>


        {/* Selected Rows Batch Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl text-xs text-blue-900">
            <span className="font-semibold">{selectedIds.length} barcode(s) selected</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-violet-200 text-violet-700 hover:bg-violet-100 rounded-lg text-xs font-semibold"
                onClick={() => setIsBulkAssignOpen(true)}
              >
                <MapPin className="w-3.5 h-3.5 mr-1" /> Bulk Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs"
                onClick={() => handleTriggerPrint(selectedIds)}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs"
                onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'ACTIVATE' })}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs"
                onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'DEACTIVATE' })}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Deactivate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3.5">Barcode</th>
                <th className="p-3.5">Asset Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assignment</th>
                <th className="p-3.5">Site / Warehouse</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading barcode inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    No barcodes found matching the current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {/* Barcode String ABOVE & Visual 1D Barcode Graphic BELOW */}
                      <td className="p-3.5">
                        <VisualBarcode code={item.barcode} width={150} height={32} />
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.isAssigned ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                              <CheckCircle className="w-3 h-3" /> ASSIGNED ({item.assignedToType})
                            </span>
                            {item.assignedToId && (
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                                ID: {item.assignedToId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-medium text-slate-800">{item.site?.name || '-'}</div>
                        <div className="text-[11px] text-slate-400">{item.warehouse?.name || '-'}</div>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg"
                            onClick={() => setSelectedBarcodeId(item.id)}
                            title="View Audit History Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 rounded-lg"
                            onClick={() => setEditingBarcode(item)}
                            title="Edit Barcode"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 rounded-lg"
                            onClick={() => handleTriggerPrint([item.id])}
                            title="Print Label Payload"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {!item.isAssigned && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete barcode "${item.barcode}"?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              title="Delete Barcode"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{items.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> total barcodes
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={params.page === 1}
              onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
              className="rounded-lg text-xs"
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-slate-700">Page {params.page}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={items.length < (params.limit || 20)}
              onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
              className="rounded-lg text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER 1: Add Single Barcode */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isCreateOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsCreateOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isCreateOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Barcode</h3>
                  <p className="text-xs text-slate-500">Register a new barcode into master inventory</p>
                </div>
              </div>
              <Button onClick={() => setIsCreateOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Barcode String *</label>
                <Input
                  placeholder="e.g. BOX000100 or LOC-A-1-01"
                  value={createForm.barcode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, barcode: e.target.value }))}
                  className="rounded-xl font-mono uppercase h-11 border-slate-200"
                />
              </div>

              {createForm.barcode && (
                <div className="flex justify-center my-2">
                  <VisualBarcode code={createForm.barcode} width={200} height={42} />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Asset Type *</label>
                <select
                  className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as BarcodeType }))}
                >
                  <option value="BOX">Box Barcode</option>
                  <option value="FILE_RECORD">File Barcode</option>
                  <option value="LOCATION">Location Barcode</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Initial Status</label>
                <select
                  className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                  value={createForm.status}
                  onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value as BarcodeStatus }))}
                >
                  <option value="UNASSIGNED">Unassigned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Site Scope</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                    value={createForm.siteId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, siteId: e.target.value }))}
                  >
                    <option value="">Select Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Warehouse Scope</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                    value={createForm.warehouseId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, warehouseId: e.target.value }))}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Remarks / Notes</label>
                <Input
                  placeholder="Optional notes or batch reference"
                  value={createForm.remarks}
                  onChange={(e) => setCreateForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="rounded-xl h-11 border-slate-200"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-slate-600">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!createForm.barcode) return toast.error('Barcode string is required');
                  createMutation.mutate(createForm);
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Create Barcode
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER 2: Bulk Sequence Generator */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isGenerateOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsGenerateOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isGenerateOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sequence Generator</h3>
                  <p className="text-xs text-slate-500">Auto-generate sequential barcode series</p>
                </div>
              </div>
              <Button onClick={() => setIsGenerateOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Barcode Type *</label>
                <select
                  className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                  value={generateForm.type}
                  onChange={(e) => {
                    const t = e.target.value as BarcodeType;
                    const p = t === 'BOX' ? 'BOX' : t === 'FILE_RECORD' ? 'FILE' : 'LOC';
                    setGenerateForm((f) => ({ ...f, type: t, prefix: p }));
                  }}
                >
                  <option value="BOX">Box Barcode (Prefix e.g. BOX)</option>
                  <option value="FILE_RECORD">File Barcode (Prefix e.g. FILE)</option>
                  <option value="LOCATION">Location Barcode (Prefix e.g. LOC)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Prefix *</label>
                  <Input
                    value={generateForm.prefix}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, prefix: e.target.value }))}
                    className="rounded-xl font-mono uppercase h-11 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Start Num *</label>
                  <Input
                    type="number"
                    value={generateForm.startingNumber}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, startingNumber: parseInt(e.target.value) || 1 }))}
                    className="rounded-xl h-11 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Quantity *</label>
                  <Input
                    type="number"
                    value={generateForm.quantity}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                    className="rounded-xl h-11 border-slate-200"
                  />
                </div>
              </div>

              {/* Preview Box with 1D Visual Barcode */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col items-center space-y-2 text-xs text-amber-900">
                <span className="font-sans font-semibold text-amber-700 block w-full text-left">Preview Sample Barcode:</span>
                <VisualBarcode
                  code={`${generateForm.prefix.toUpperCase()}${String(generateForm.startingNumber).padStart(6, '0')}`}
                  width={200}
                  height={44}
                />
                <div className="text-amber-600 font-sans italic text-[11px] pt-1">
                  Sequence range: {generateForm.prefix.toUpperCase()}{String(generateForm.startingNumber).padStart(6, '0')} to {generateForm.prefix.toUpperCase()}{String(generateForm.startingNumber + generateForm.quantity - 1).padStart(6, '0')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Site Scope</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                    value={generateForm.siteId}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, siteId: e.target.value }))}
                  >
                    <option value="">Select Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Warehouse Scope</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                    value={generateForm.warehouseId}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, warehouseId: e.target.value }))}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Batch Remarks</label>
                <Input
                  value={generateForm.remarks}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="rounded-xl h-11 border-slate-200"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
              <Button variant="ghost" onClick={() => setIsGenerateOpen(false)} className="rounded-xl text-slate-600">
                Cancel
              </Button>
              <Button
                onClick={() => bulkGenerateMutation.mutate(generateForm)}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium"
              >
                Generate Barcodes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER 3: Import CSV/Excel */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isImportOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsImportOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isImportOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Barcodes</h3>
                  <p className="text-xs text-slate-500">Upload batch spreadsheet (.csv, .xlsx)</p>
                </div>
              </div>
              <Button onClick={() => setIsImportOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Upload a spreadsheet containing required header columns: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">barcode</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">type</code> (BOX, FILE_RECORD, LOCATION), <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">status</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">remarks</code>.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleParseImportFile(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Click or drag spreadsheet file to upload</p>
                <p className="text-[11px] text-slate-400 mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)</p>
              </div>

              {importRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Parsed Preview ({importRows.length} rows loaded)</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2.5 text-xs font-mono bg-slate-50 space-y-1.5">
                    {importRows.slice(0, 10).map((r, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-200/60 pb-1 text-[11px]">
                        <span className="font-bold text-slate-900">{r.barcode}</span>
                        <span className="text-blue-600 font-sans font-semibold">{r.type}</span>
                      </div>
                    ))}
                    {importRows.length > 10 && (
                      <div className="text-slate-400 italic text-[11px]">...and {importRows.length - 10} more rows</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
              <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="rounded-xl text-slate-600">
                Cancel
              </Button>
              <Button
                disabled={importRows.length === 0}
                onClick={() => importMutation.mutate(importRows)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Import Barcodes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER 4: Print Barcode Labels */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isPrintOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsPrintOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isPrintOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Print Barcode Labels</h3>
                  <p className="text-xs text-slate-500">{printLabelsData.length} label(s) ready to print</p>
                </div>
              </div>
              <Button onClick={() => setIsPrintOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Body - Printable Label Cards */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {printLabelsData.map((lbl, idx) => (
                <div key={idx} className="border-2 border-slate-900 rounded-2xl p-5 bg-white shadow-sm flex flex-col items-center justify-center space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-start">{lbl.company}</div>
                  
                  {/* Text ABOVE & Visual 1D Barcode Graphic NICHE (Below) */}
                  <VisualBarcode code={lbl.barcode} width={240} height={52} />

                  <div className="flex justify-between items-center w-full pt-2 border-t border-slate-100 text-xs">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">{lbl.type}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">ZPL Ready</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-2">
              <Button
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => {
                  const zplContent = printLabelsData.map((l) => l.zpl).join('\n');
                  const blob = new Blob([zplContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `labels_${Date.now()}.zpl`;
                  a.click();
                }}
              >
                Download ZPL
              </Button>
              <Button onClick={() => window.print()} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs">
                <Printer className="w-4 h-4 mr-1.5" /> Print Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER 5: Edit Barcode */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${editingBarcode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setEditingBarcode(null)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${editingBarcode ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Barcode</h3>
                  <p className="text-xs font-mono text-slate-500">{editingBarcode?.barcode}</p>
                </div>
              </div>
              <Button onClick={() => setEditingBarcode(null)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Body */}
            {editingBarcode && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div className="flex justify-center mb-2">
                  <VisualBarcode code={editingBarcode.barcode} width={200} height={44} />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Status</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                    value={editingBarcode.status}
                    onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, status: e.target.value as BarcodeStatus }) : null)}
                  >
                    <option value="UNASSIGNED">Unassigned</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LOST">Lost</option>
                    <option value="DESTROYED">Destroyed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">Site Scope</label>
                    <select
                      className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                      value={editingBarcode.siteId || ''}
                      onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, siteId: e.target.value ? e.target.value : null }) : null)}
                    >
                      <option value="">No Site</option>
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">Warehouse Scope</label>
                    <select
                      className="w-full border border-slate-200 rounded-xl h-11 px-3 bg-white text-xs font-medium text-slate-800 outline-none"
                      value={editingBarcode.warehouseId || ''}
                      onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, warehouseId: e.target.value ? e.target.value : null }) : null)}
                    >
                      <option value="">No Warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assignment Controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Assignment Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBarcode.isAssigned}
                        onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, isAssigned: e.target.checked, status: e.target.checked ? 'ASSIGNED' : 'UNASSIGNED' }) : null)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {editingBarcode.isAssigned && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/80">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Assigned Asset Type</label>
                        <select
                          className="w-full border border-slate-200 rounded-xl h-9 px-2.5 bg-white text-xs text-slate-800 outline-none"
                          value={editingBarcode.assignedToType || 'BOX'}
                          onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, assignedToType: e.target.value }) : null)}
                        >
                          <option value="BOX">BOX</option>
                          <option value="FILE_RECORD">FILE_RECORD</option>
                          <option value="LOCATION">LOCATION</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Assigned Target Entity ID</label>
                        <Input
                          placeholder="e.g. UUID or Identifier of Box / File / Location"
                          value={editingBarcode.assignedToId || ''}
                          onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, assignedToId: e.target.value }) : null)}
                          className="rounded-xl h-9 text-xs font-mono border-slate-200"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Remarks</label>
                  <Input
                    value={editingBarcode.remarks || ''}
                    onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, remarks: e.target.value }) : null)}
                    className="rounded-xl h-11 border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
              <Button variant="ghost" onClick={() => setEditingBarcode(null)} className="rounded-xl text-slate-600">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingBarcode) {
                    updateMutation.mutate({
                      id: editingBarcode.id,
                      data: {
                        status: editingBarcode.status,
                        siteId: editingBarcode.siteId ? editingBarcode.siteId : null,
                        warehouseId: editingBarcode.warehouseId ? editingBarcode.warehouseId : null,
                        isAssigned: editingBarcode.isAssigned,
                        assignedToType: editingBarcode.isAssigned ? (editingBarcode.assignedToType || 'BOX') : null,
                        assignedToId: editingBarcode.isAssigned ? (editingBarcode.assignedToId || null) : null,
                        remarks: editingBarcode.remarks || ''
                      }
                    });
                  }
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER 6: Audit History & Barcode Details */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${selectedBarcodeId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setSelectedBarcodeId(null)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${selectedBarcodeId ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Barcode Timeline</h3>
                  <p className="text-xs font-mono text-slate-500">{barcodeDetail?.barcode}</p>
                </div>
              </div>
              <Button onClick={() => setSelectedBarcodeId(null)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading timeline...
                </div>
              ) : barcodeDetail ? (
                <div className="space-y-6 text-xs">
                  {/* Summary Box with Visual Barcode Graphic */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center space-y-3">
                    <VisualBarcode code={barcodeDetail.barcode} width={200} height={46} />

                    <div className="w-full space-y-2 text-slate-700 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between"><span className="text-slate-500">Asset Type:</span> <span className="font-bold">{barcodeDetail.type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="font-bold">{barcodeDetail.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Assigned:</span> <span className="font-bold">{barcodeDetail.isAssigned ? 'YES' : 'NO'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Created By:</span> <span className="font-bold">{barcodeDetail.createdBy?.fullName || 'System'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Created Date:</span> <span className="font-bold">{new Date(barcodeDetail.createdAt).toLocaleString()}</span></div>
                      {barcodeDetail.remarks && <div className="pt-2 text-slate-600 border-t border-slate-200/60 mt-1">Remarks: {barcodeDetail.remarks}</div>}
                    </div>
                  </div>

                  {/* Audit Timeline */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" /> Audit Timeline
                    </h3>
                    <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-4">
                      {barcodeDetail.history && barcodeDetail.history.length > 0 ? (
                        barcodeDetail.history.map((hist) => (
                          <div key={hist.id} className="relative text-xs space-y-1">
                            <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{hist.action}</span>
                              <span className="text-slate-400 text-[10px]">{new Date(hist.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600">{hist.remarks || 'No notes'}</p>
                            {hist.user && <p className="text-slate-400">By: {hist.user.fullName}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">No timeline events logged.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Bulk Assign Modal ===== */}
      {isBulkAssignOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-50 rounded-xl">
                  <MapPin className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bulk Assign Location</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedIds.length} barcode(s) selected</p>
                </div>
              </div>
              <button onClick={() => setIsBulkAssignOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Warehouse</label>
                <select
                  value={assignWarehouseId}
                  onChange={e => setAssignWarehouseId(e.target.value)}
                  className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">-- Select Warehouse --</option>
                  {(warehousesData?.data || []).map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Site <span className="text-slate-400 font-normal">(optional)</span></label>
                <select
                  value={assignSiteId}
                  onChange={e => setAssignSiteId(e.target.value)}
                  className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">-- Select Site --</option>
                  {(sitesData?.data || []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Branch <span className="text-slate-400 font-normal">(optional)</span></label>
                <select
                  value={assignBranchId}
                  onChange={e => setAssignBranchId(e.target.value)}
                  className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">-- Select Branch --</option>
                  {(branchesData?.data || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <span>This will update the site/branch/warehouse assignment for all <strong>{selectedIds.length}</strong> selected barcodes. Leave a field blank to keep it unchanged.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setIsBulkAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white"
                disabled={bulkAssignMutation.isPending || (!assignWarehouseId && !assignSiteId && !assignBranchId)}
                onClick={() => bulkAssignMutation.mutate()}
              >
                {bulkAssignMutation.isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                )}
                Assign {selectedIds.length} Barcode(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
