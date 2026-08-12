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
  Square
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

export default function BarcodeMasterPage() {
  const queryClient = useQueryClient();

  // Filter States
  const [params, setParams] = useState<ListBarcodesParams>({
    page: 1,
    limit: 20,
    search: '',
    type: undefined,
    status: undefined,
    startDate: '',
    endDate: ''
  });

  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawer States
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
  const [generateForm, setGenerateForm] = useState<BulkGenerateRequest>({
    type: 'BOX',
    prefix: 'BOX',
    startingNumber: 1,
    quantity: 100,
    remarks: 'Auto-generated barcode batch'
  });

  // Import State
  const [importRows, setImportRows] = useState<ImportBarcodeRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print State
  const [printLabelsData, setPrintLabelsData] = useState<any[]>([]);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['barcode-stats'],
    queryFn: getBarcodeStats
  });

  const { data: barcodeList, isLoading: listLoading, refetch } = useQuery({
    queryKey: ['barcodes-master', params],
    queryFn: () => listBarcodes(params)
  });

  const { data: barcodeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['barcode-detail', selectedBarcodeId],
    queryFn: () => getBarcodeById(selectedBarcodeId!),
    enabled: !!selectedBarcodeId
  });

  // Dropdown Master Queries
  const { data: sitesData } = useQuery({
    queryKey: ['sites-list'],
    queryFn: () => getSites(1, 100)
  });
  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => getBranches(1, 100)
  });
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => getWarehouses(1, 100)
  });

  const sites = sitesData?.data || [];
  const branches = branchesData?.data || [];
  const warehouses = warehousesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBarcode,
    onSuccess: () => {
      toast.success('Barcode created successfully');
      setIsCreateOpen(false);
      setCreateForm({ barcode: '', type: 'BOX', status: 'UNASSIGNED', siteId: '', branchId: '', warehouseId: '', remarks: '' });
      queryClient.invalidateQueries({ queryKey: ['barcodes-master'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Creation failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBarcode(id, data),
    onSuccess: () => {
      toast.success('Barcode updated successfully');
      setEditingBarcode(null);
      queryClient.invalidateQueries({ queryKey: ['barcodes-master'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBarcode,
    onSuccess: () => {
      toast.success('Barcode deleted');
      queryClient.invalidateQueries({ queryKey: ['barcodes-master'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Deletion failed')
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: bulkGenerateBarcodes,
    onSuccess: (res) => {
      toast.success(`Generated ${res.totalCreated} barcodes successfully (${res.totalSkipped} skipped)`);
      setIsGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['barcodes-master'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Generation failed')
  });

  const importMutation = useMutation({
    mutationFn: importBarcodes,
    onSuccess: (res) => {
      toast.success(`Import complete: ${res.createdCount} created, ${res.skippedCount} skipped`);
      setIsImportOpen(false);
      setImportRows([]);
      queryClient.invalidateQueries({ queryKey: ['barcodes-master'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Import failed')
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' }) =>
      bulkActionBarcodes(ids, action),
    onSuccess: (_, variables) => {
      toast.success(`Bulk ${variables.action.toLowerCase()} completed`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['barcodes-master'] });
      queryClient.invalidateQueries({ queryKey: ['barcode-stats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Action failed')
  });

  const printMutation = useMutation({
    mutationFn: printBarcodes,
    onSuccess: (res) => {
      setPrintLabelsData(res.labels);
      setIsPrintOpen(true);
    },
    onError: (err: Error) => toast.error(err.message || 'Print generation failed')
  });

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && barcodeList?.data) {
      setSelectedIds(barcodeList.data.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleParseImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

        const mapped: ImportBarcodeRow[] = json.map((row) => ({
          barcode: String(row.barcode || row.Barcode || '').trim(),
          type: (String(row.type || row.Type || 'BOX').toUpperCase() as BarcodeType),
          status: (String(row.status || row.Status || 'UNASSIGNED').toUpperCase() as BarcodeStatus),
          siteCode: String(row.siteCode || row.site || '').trim(),
          branchCode: String(row.branchCode || row.branch || '').trim(),
          warehouseCode: String(row.warehouseCode || row.warehouse || '').trim(),
          remarks: String(row.remarks || '').trim()
        })).filter(r => r.barcode);

        setImportRows(mapped);
      } catch (err) {
        toast.error('Failed to parse spreadsheet file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportCSV = () => {
    if (!barcodeList?.data || barcodeList.data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const exportRows = barcodeList.data.map((b) => ({
      Barcode: b.barcode,
      Type: b.type,
      Status: b.status,
      IsAssigned: b.isAssigned ? 'YES' : 'NO',
      AssignedToType: b.assignedToType || '',
      AssignedToId: b.assignedToId || '',
      Site: b.site?.name || '',
      Warehouse: b.warehouse?.name || '',
      CreatedBy: b.createdBy?.fullName || '',
      CreatedAt: new Date(b.createdAt).toLocaleString(),
      Remarks: b.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BarcodeMaster');
    XLSX.writeFile(workbook, `barcode_master_export_${Date.now()}.xlsx`);
  };

  const items = barcodeList?.data || [];
  const pagination = barcodeList?.pagination;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Barcode Master</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pre-register, bulk generate, track and manage physical barcode inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Barcode
          </Button>
          <Button onClick={() => setIsGenerateOpen(true)} variant="outline" className="rounded-xl border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100">
            <Zap className="w-4 h-4 mr-2 text-amber-600" /> Bulk Sequence
          </Button>
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="rounded-xl">
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Dashboard Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.total || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Boxes</span>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats?.boxCount || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-purple-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Files</span>
          <div className="text-xl font-bold text-purple-600 mt-1">{stats?.fileCount || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Locations</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.locationCount || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats?.assignedCount || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-teal-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unassigned</span>
          <div className="text-xl font-bold text-teal-600 mt-1">{stats?.unassignedCount || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats?.inactiveCount || 0}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats?.todayGenerated || 0}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search barcode string or remarks..."
              className="pl-9 rounded-xl"
              value={params.search || ''}
              onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
            />
          </div>

          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700"
            value={params.type || ''}
            onChange={(e) => setParams((p) => ({ ...p, type: (e.target.value || undefined) as BarcodeType, page: 1 }))}
          >
            <option value="">All Barcode Types</option>
            <option value="BOX">Box Barcode</option>
            <option value="FILE_RECORD">File Barcode</option>
            <option value="LOCATION">Location Barcode</option>
          </select>

          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700"
            value={params.status || ''}
            onChange={(e) => setParams((p) => ({ ...p, status: (e.target.value || undefined) as BarcodeStatus, page: 1 }))}
          >
            <option value="">All Statuses</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOST">Lost</option>
            <option value="DESTROYED">Destroyed</option>
          </select>

          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700"
            value={params.siteId || ''}
            onChange={(e) => setParams((p) => ({ ...p, siteId: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700"
            value={params.warehouseId || ''}
            onChange={(e) => setParams((p) => ({ ...p, warehouseId: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </div>

        {/* Selected Batch Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
            <span className="font-semibold text-blue-900">
              {selectedIds.length} barcodes selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white rounded-lg border-blue-300"
                onClick={() => printMutation.mutate(selectedIds)}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Labels
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white rounded-lg border-emerald-300 text-emerald-700"
                onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'ACTIVATE' })}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white rounded-lg border-amber-300 text-amber-700"
                onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'DEACTIVATE' })}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Deactivate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-lg"
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.length} unassigned barcodes?`)) {
                    bulkActionMutation.mutate({ ids: selectedIds, action: 'DELETE' });
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 font-semibold">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4">Barcode</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned</th>
                <th className="p-4">Site / Warehouse</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading Barcode Master...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No barcodes found matching the criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {item.barcode}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.type === 'BOX'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.type === 'FILE_RECORD'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.type === 'BOX' && <FileBox className="w-3 h-3 mr-1" />}
                        {item.type === 'FILE_RECORD' && <Tag className="w-3 h-3 mr-1" />}
                        {item.type === 'LOCATION' && <MapPin className="w-3 h-3 mr-1" />}
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'ASSIGNED'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : item.status === 'UNASSIGNED' || item.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium">
                      {item.isAssigned ? (
                        <span className="text-indigo-600 font-semibold">
                          Assigned to {item.assignedToType || 'Object'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {item.site?.name || '—'} {item.warehouse ? `(${item.warehouse.name})` : ''}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => setSelectedBarcodeId(item.id)}
                          title="View History Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                          onClick={() => setEditingBarcode(item)}
                          title="Edit Barcode"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {!item.isAssigned && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              if (confirm(`Delete barcode ${item.barcode}?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} barcodes
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setParams((p) => ({ ...p, page: p.page! - 1 }))}
                className="rounded-lg"
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-700">Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setParams((p) => ({ ...p, page: p.page! + 1 }))}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Create Single Barcode */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create New Barcode</h2>
              <button onClick={() => setIsCreateOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode String *</label>
                <Input
                  placeholder="e.g. BOX000100 or LOC-A-1-01"
                  value={createForm.barcode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, barcode: e.target.value }))}
                  className="rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode Type *</label>
                <select
                  className="w-full border rounded-xl p-2 bg-white"
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as BarcodeType }))}
                >
                  <option value="BOX">Box Barcode</option>
                  <option value="FILE_RECORD">File Barcode</option>
                  <option value="LOCATION">Location Barcode</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="w-full border rounded-xl p-2 bg-white"
                  value={createForm.status}
                  onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value as BarcodeStatus }))}
                >
                  <option value="UNASSIGNED">Unassigned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Site</label>
                  <select
                    className="w-full border rounded-xl p-2 bg-white text-xs"
                    value={createForm.siteId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, siteId: e.target.value }))}
                  >
                    <option value="">Select Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Warehouse</label>
                  <select
                    className="w-full border rounded-xl p-2 bg-white text-xs"
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

              <div>
                <label className="block font-medium text-slate-700 mb-1">Remarks</label>
                <Input
                  placeholder="Optional notes or batch reference"
                  value={createForm.remarks}
                  onChange={(e) => setCreateForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => {
                  if (!createForm.barcode) return toast.error('Barcode string is required');
                  createMutation.mutate(createForm);
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                Create Barcode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Sequence Auto-Generation */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900">Bulk Sequence Generator</h2>
              </div>
              <button onClick={() => setIsGenerateOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <p className="text-xs text-slate-500">
              Automatically generate a batch of sequential barcode labels (e.g. BOX000001, BOX000002).
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode Type *</label>
                <select
                  className="w-full border rounded-xl p-2 bg-white"
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prefix *</label>
                  <Input
                    value={generateForm.prefix}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, prefix: e.target.value }))}
                    className="rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Num *</label>
                  <Input
                    type="number"
                    value={generateForm.startingNumber}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, startingNumber: parseInt(e.target.value) || 1 }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Quantity *</label>
                  <Input
                    type="number"
                    value={generateForm.quantity}
                    onChange={(e) => setGenerateForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border rounded-xl p-3 text-xs space-y-1 font-mono text-slate-700">
                <span className="font-sans font-semibold text-slate-500 block">Preview Sequence Sample:</span>
                <div>{generateForm.prefix.toUpperCase()}{String(generateForm.startingNumber).padStart(6, '0')}</div>
                <div>{generateForm.prefix.toUpperCase()}{String(generateForm.startingNumber + 1).padStart(6, '0')}</div>
                <div>... to {generateForm.prefix.toUpperCase()}{String(generateForm.startingNumber + generateForm.quantity - 1).padStart(6, '0')}</div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Remarks</label>
                <Input
                  value={generateForm.remarks}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setIsGenerateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => bulkGenerateMutation.mutate(generateForm)}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                Generate Barcodes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Import CSV/Excel */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Import Barcodes (CSV / Excel)</h2>
              <button onClick={() => setIsImportOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <p className="text-xs text-slate-500">
              Upload a spreadsheet containing headers: <code className="bg-slate-100 px-1 py-0.5 rounded">barcode</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">type</code> (BOX, FILE_RECORD, LOCATION), <code className="bg-slate-100 px-1 py-0.5 rounded">status</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">remarks</code>.
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
              className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-colors"
            >
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Click to choose CSV or Excel file</p>
              <p className="text-xs text-slate-400 mt-1">Supports .csv, .xlsx, .xls</p>
            </div>

            {importRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Preview ({importRows.length} rows loaded)</span>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-xl p-2 text-xs font-mono bg-slate-50 space-y-1">
                  {importRows.slice(0, 10).map((r, i) => (
                    <div key={i} className="flex justify-between border-b pb-1">
                      <span>{r.barcode}</span>
                      <span className="text-blue-600 font-sans">{r.type}</span>
                    </div>
                  ))}
                  {importRows.length > 10 && <div className="text-slate-400 italic">...and {importRows.length - 10} more rows</div>}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                disabled={importRows.length === 0}
                onClick={() => importMutation.mutate(importRows)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                Import Barcodes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Print Barcode Labels Preview */}
      {isPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Print Barcode Labels ({printLabelsData.length})</h2>
              </div>
              <button onClick={() => setIsPrintOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 p-2">
              {printLabelsData.map((lbl, idx) => (
                <div key={idx} className="border-2 border-slate-900 rounded-xl p-4 bg-white flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">{lbl.company}</span>
                    <div className="text-2xl font-mono font-black tracking-wider text-slate-900 mt-1">{lbl.barcode}</div>
                    <span className="inline-block text-xs bg-slate-100 font-semibold px-2 py-0.5 rounded mt-1">{lbl.type}</span>
                  </div>
                  <div className="text-right font-mono text-xs bg-slate-50 border p-2 rounded-lg text-slate-600 max-w-[140px] truncate">
                    ZPL Preview Payload Generated
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t pt-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  const zplContent = printLabelsData.map(l => l.zpl).join('\n');
                  const blob = new Blob([zplContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `labels_${Date.now()}.zpl`;
                  a.click();
                }}
              >
                Download ZPL File
              </Button>
              <Button onClick={() => { window.print(); }} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" /> Print Labels Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Barcode Detail & Lifecycle History Timeline */}
      {selectedBarcodeId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 space-y-6 shadow-2xl overflow-y-auto border-l">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Barcode Timeline</h2>
                <p className="text-xs text-slate-500 font-mono">{barcodeDetail?.barcode}</p>
              </div>
              <button onClick={() => setSelectedBarcodeId(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading timeline...
              </div>
            ) : barcodeDetail ? (
              <div className="space-y-6">
                {/* Information Card */}
                <div className="bg-slate-50 border rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-bold">{barcodeDetail.type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="font-bold">{barcodeDetail.status}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Assigned:</span> <span className="font-bold">{barcodeDetail.isAssigned ? 'YES' : 'NO'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Created By:</span> <span className="font-bold">{barcodeDetail.createdBy?.fullName || 'System'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Created Date:</span> <span className="font-bold">{new Date(barcodeDetail.createdAt).toLocaleString()}</span></div>
                  {barcodeDetail.remarks && <div className="pt-1 text-slate-600 border-t mt-1">Remarks: {barcodeDetail.remarks}</div>}
                </div>

                {/* Lifetime History Timeline */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" /> Complete Audit Timeline
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
      )}

      {/* Modal 5: Edit Barcode */}
      {editingBarcode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Edit Barcode: {editingBarcode.barcode}</h2>
              <button onClick={() => setEditingBarcode(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="w-full border rounded-xl p-2 bg-white"
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

              <div>
                <label className="block font-medium text-slate-700 mb-1">Remarks</label>
                <Input
                  value={editingBarcode.remarks || ''}
                  onChange={(e) => setEditingBarcode((b) => b ? ({ ...b, remarks: e.target.value }) : null)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setEditingBarcode(null)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => {
                  updateMutation.mutate({
                    id: editingBarcode.id,
                    data: {
                      status: editingBarcode.status,
                      remarks: editingBarcode.remarks
                    }
                  });
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
