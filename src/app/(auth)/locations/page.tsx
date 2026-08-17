"use client";

import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  MapPin,
  CheckCircle2,
  Info,
  Search,
  Wand2,
  Upload,
  Download,
  Trash2,
  Check,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { VisualBarcode } from '@/components/records/visual-barcode';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  bulkGenerateLocations,
  bulkActionLocations,
  bulkImportLocations,
  BulkGenerateLocationsRequest
} from '@/lib/api/location';
import { Location } from '@/lib/types/location';
import { CreateLocationData, createLocationSchema } from '@/lib/validations/location';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HierarchyFilters, useEffectiveHierarchyIds } from '@/components/masters/hierarchy-filters';
import { PageHeaderCard } from '@/components/page-header-card';

interface ImportLocationRow {
  name: string;
  barcode?: string;
}

export default function LocationsPage() {
  const [page, setPage] = useState(1);
  const [warehouseId, setWarehouseId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rackId, setRackId] = useState('');
  const [shelfId, setShelfId] = useState('');
  const { effectiveShelfId } = useEffectiveHierarchyIds(warehouseId, roomId, rackId, shelfId, 'shelf');

  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Bulk Generator State
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    prefix: 'LOC',
    startingNumber: 1,
    quantity: 20,
    padding: 3,
    barcodePrefix: '',
  });

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportLocationRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Row Selection State for Bulk Actions
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Details drawer
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState<Location | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
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
    queryKey: ['locations', effectiveShelfId, page],
    queryFn: () => getLocations(effectiveShelfId || undefined, page, 20),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLocationData) => createLocation(effectiveShelfId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success('Location created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create location');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsFormDrawerOpen(false);
      setSelectedLocation(null);
      form.reset();
      toast.success('Location updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update location');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      if (selectedLocationForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedLocationForDetail(null);
      }
      toast.success('Location deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    },
  });

  // Bulk Generate Mutation
  const bulkGenerateMutation = useMutation({
    mutationFn: (req: BulkGenerateLocationsRequest) => bulkGenerateLocations(req),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsBulkDrawerOpen(false);
      toast.success(res.message || 'Locations generated in bulk successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to bulk generate locations');
    },
  });

  // Bulk Action Mutation (Activate / Deactivate / Delete)
  const bulkActionMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' }) =>
      bulkActionLocations(ids, action),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setRowSelection({});
      toast.success(res.message || 'Bulk action executed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Bulk action failed');
    },
  });

  // Bulk Import Mutation
  const bulkImportMutation = useMutation({
    mutationFn: ({ shelfId, rows }: { shelfId: string; rows: ImportLocationRow[] }) =>
      bulkImportLocations(shelfId, rows),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsImportModalOpen(false);
      setImportRows([]);
      toast.success(res.message || 'Locations imported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to import locations');
    },
  });

  const form = useForm<CreateLocationData>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      barcode: '',
      name: '',
      shelfId: effectiveShelfId,
      isActive: true,
    },
  });

  const handleFormSubmit = (data: CreateLocationData) => {
    if (formMode === 'CREATE') {
      if (!effectiveShelfId) {
        toast.error('Please select a Shelf in the hierarchy filters first');
        return;
      }
      createMutation.mutate(data);
    } else if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data });
    }
  };

  const handleDelete = (location: Location) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Location',
      description: `Are you sure you want to delete location barcode ${location.barcode}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(location.id);
      },
    });
  };

  const locations = data?.data || [];
  const meta = data?.meta;

  const totalCount = locations.length;
  const activeCount = locations.filter((l) => l.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const filteredLocations = useMemo(() => {
    return locations.filter((l) => {
      const matchesSearch =
        !searchTerm ||
        l.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && l.isActive) ||
        (statusFilter === 'INACTIVE' && !l.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [locations, searchTerm, statusFilter]);

  // Selected row IDs
  const selectedLocationIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((indexStr) => rowSelection[indexStr])
      .map((indexStr) => filteredLocations[Number(indexStr)]?.id)
      .filter(Boolean);
  }, [rowSelection, filteredLocations]);

  // Bulk Generator Preview
  const previewBarcodes = useMemo(() => {
    const qty = Math.min(Math.max(1, bulkForm.quantity), 500);
    const start = Math.max(1, bulkForm.startingNumber);
    const pad = Math.min(Math.max(1, bulkForm.padding), 6);
    const prefix = (bulkForm.prefix || 'LOC').trim().toUpperCase();

    const sample = [];
    const countToShow = Math.min(qty, 4);
    for (let i = 0; i < countToShow; i++) {
      const numStr = String(start + i).padStart(pad, '0');
      sample.push(`${prefix}-${numStr}`);
    }
    if (qty > countToShow) {
      sample.push(`... and ${qty - countToShow} more`);
    }
    return sample;
  }, [bulkForm]);

  // Handle Excel/CSV File Upload
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

        const parsed: ImportLocationRow[] = rawJson
          .map((row) => {
            const name = String(row['Location Name'] || row['Name'] || row['name'] || row['Location'] || '').trim();
            const barcode = String(row['Barcode'] || row['barcode'] || row['Code'] || '').trim();
            return { name, barcode: barcode || undefined };
          })
          .filter((r) => r.name.length > 0);

        if (!parsed.length) {
          toast.error('No valid rows found. Ensure the file has a "Location Name" column.');
          return;
        }

        setImportRows(parsed);
        toast.success(`Parsed ${parsed.length} locations ready for import`);
      } catch (err: any) {
        toast.error('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Location Name': 'LOC-001', 'Barcode': 'WH1-RM1-RK1-S1-LOC-001' },
      { 'Location Name': 'LOC-002', 'Barcode': 'WH1-RM1-RK1-S1-LOC-002' },
      { 'Location Name': 'LOC-003', 'Barcode': 'WH1-RM1-RK1-S1-LOC-003' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Locations_Template');
    XLSX.writeFile(wb, 'Locations_Import_Template.xlsx');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <MapPin className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load locations</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      {/* Header */}
      <PageHeaderCard
        title="Location Master"
        description="Manage physical folder storage locations, bulk generation, barcodes & shelf levels."
        badge="Warehouse Structure · Locations"
        icon={MapPin}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bulk Import Button */}
          <Button
            onClick={() => {
              if (!effectiveShelfId) {
                toast.error('Please select a Shelf in the hierarchy filters first');
                return;
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
              if (!effectiveShelfId) {
                toast.error('Please select a Shelf in the hierarchy filters first');
                return;
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
              if (!effectiveShelfId) {
                toast.error('Please select a Shelf in the hierarchy filters first');
                return;
              }
              setFormMode('CREATE');
              setSelectedLocation(null);
              form.reset({
                barcode: '',
                name: '',
                shelfId: effectiveShelfId,
                isActive: true,
              });
              setIsFormDrawerOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all h-10 px-4 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
            Add Location
          </Button>
        </div>
      </PageHeaderCard>

      <HierarchyFilters
        depth="shelf"
        warehouseId={warehouseId}
        roomId={roomId}
        rackId={rackId}
        shelfId={shelfId}
        onWarehouseChange={setWarehouseId}
        onRoomChange={setRoomId}
        onRackChange={setRackId}
        onShelfChange={setShelfId}
      />

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Barcodes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <MapPin className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Physical storage location labels
          </div>
        </div>

        {/* Active */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Labels</p>
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
            Active locations operational
          </div>
        </div>

        {/* Suspended */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive Labels</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <X className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Offline warehouse storage barcodes
          </div>
        </div>
      </div>

      {/* Toolbar & Bulk Actions Bar */}
      <div className="space-y-3">
        {selectedLocationIds.length > 0 && (
          <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="bg-blue-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                {selectedLocationIds.length}
              </span>
              <span className="text-xs font-semibold text-slate-200">Locations Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionMutation.isPending}
                onClick={() => bulkActionMutation.mutate({ ids: selectedLocationIds, action: 'ACTIVATE' })}
                className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700 hover:text-emerald-300 rounded-xl"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionMutation.isPending}
                onClick={() => bulkActionMutation.mutate({ ids: selectedLocationIds, action: 'DEACTIVATE' })}
                className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:text-amber-300 rounded-xl"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkActionMutation.isPending}
                onClick={() => {
                  setConfirmDelete({
                    isOpen: true,
                    title: 'Delete Selected Locations',
                    description: `Are you sure you want to delete ${selectedLocationIds.length} selected locations? Locations holding boxes cannot be deleted.`,
                    onConfirm: () => bulkActionMutation.mutate({ ids: selectedLocationIds, action: 'DELETE' }),
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

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by barcode or description..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-none px-5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all capitalize ${
                  statusFilter === status
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm">
        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <MapPin className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No locations found</p>
              <p className="text-xs text-slate-400">
                Select a shelf in the hierarchy filter, then click &quot;Bulk Generate&quot; or &quot;Add Location&quot;.
              </p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredLocations}
            meta={meta}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onPageChange={setPage}
            onEdit={(location, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: location.id, data: location });
              } else {
                setSelectedLocation(location);
                setFormMode('EDIT');
                form.reset({
                  barcode: location.barcode,
                  name: location.name || '',
                  shelfId: location.shelfId,
                  isActive: location.isActive,
                });
                setIsFormDrawerOpen(true);
              }
            }}
            onDelete={handleDelete}
            onCustomAction={(location) => {
              setSelectedLocationForDetail(location);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Bulk Generate Locations (Like Box Master) */}
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
                  <h3 className="text-base font-bold text-slate-900">Bulk Generate Locations</h3>
                  <p className="text-xs text-slate-400">Instantly generate consecutive storage locations</p>
                </div>
              </div>
              <Button onClick={() => setIsBulkDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Target Shelf</span>
                <p className="text-xs font-semibold text-slate-700">
                  {effectiveShelfId ? `Shelf ID: ${effectiveShelfId}` : 'No shelf selected. Select one in hierarchy filters.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-prefix">Location Prefix</Label>
                  <Input
                    id="bulk-prefix"
                    value={bulkForm.prefix}
                    onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="LOC"
                    className="h-11 rounded-xl uppercase font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-padding">Padding (Digits)</Label>
                  <Input
                    id="bulk-padding"
                    type="number"
                    min={1}
                    max={6}
                    value={bulkForm.padding}
                    onChange={(e) => setBulkForm({ ...bulkForm, padding: Number(e.target.value) || 3 })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-start">Starting Number</Label>
                  <Input
                    id="bulk-start"
                    type="number"
                    min={1}
                    value={bulkForm.startingNumber}
                    onChange={(e) => setBulkForm({ ...bulkForm, startingNumber: Number(e.target.value) || 1 })}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-qty">Quantity to Generate</Label>
                  <Input
                    id="bulk-qty"
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
                <Label htmlFor="bulk-barcode-prefix">
                  Custom Barcode Prefix <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </Label>
                <Input
                  id="bulk-barcode-prefix"
                  value={bulkForm.barcodePrefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, barcodePrefix: e.target.value.toUpperCase() })}
                  placeholder="e.g. WH1-RM1-RK1-S1 (Leave empty to auto-generate)"
                  className="h-11 rounded-xl font-mono text-xs uppercase"
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
                disabled={bulkGenerateMutation.isPending || !effectiveShelfId}
                onClick={() =>
                  bulkGenerateMutation.mutate({
                    shelfId: effectiveShelfId,
                    prefix: bulkForm.prefix,
                    startingNumber: bulkForm.startingNumber,
                    quantity: bulkForm.quantity,
                    padding: bulkForm.padding,
                    barcodePrefix: bulkForm.barcodePrefix || undefined,
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md h-11 px-5 text-xs font-bold"
              >
                {bulkGenerateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate {bulkForm.quantity} Locations
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
                  <h3 className="font-bold text-slate-900 text-base">Import Locations from Excel / CSV</h3>
                  <p className="text-xs text-slate-400">Upload batch spreadsheet to bulk create locations</p>
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
                <p className="text-[11px] text-slate-400">Required column: Location Name (Barcode optional)</p>
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
                    <span>Parsed Locations ({importRows.length} rows)</span>
                    <span className="text-emerald-600">Ready to Import</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-xl divide-y text-xs">
                    {importRows.slice(0, 10).map((row, idx) => (
                      <div key={idx} className="flex justify-between px-3 py-2 text-slate-600">
                        <span className="font-semibold">{row.name}</span>
                        <span className="font-mono text-slate-400">{row.barcode || 'Auto Barcode'}</span>
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
                disabled={importRows.length === 0 || bulkImportMutation.isPending || !effectiveShelfId}
                onClick={() =>
                  bulkImportMutation.mutate({
                    shelfId: effectiveShelfId,
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
                Import {importRows.length} Locations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: Add/Edit Single Location */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div
            className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add Location' : 'Edit Location'}
                </h3>
              </div>
              <Button onClick={() => setIsFormDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode Identifier</Label>
                  <Input id="barcode" placeholder="LOC-001" className="h-11 rounded-xl border-slate-200 uppercase font-mono" {...form.register('barcode')} />
                  {form.formState.errors.barcode && <p className="text-xs text-red-500">{form.formState.errors.barcode.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Location Description Name</Label>
                  <Input id="name" placeholder="Shelf 1 - Rack A1" className="h-11 rounded-xl border-slate-200" {...form.register('name')} />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Status</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Enable or disable operator visibility for this location barcode</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsFormDrawerOpen(false)} className="rounded-xl border-slate-200 h-11">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 h-11 px-5"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: Location Details */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div
            className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              isDetailsOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Location Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedLocationForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md mb-3">
                    {selectedLocationForDetail.barcode}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedLocationForDetail.name || 'Unnamed'}</h4>
                  
                  <div className="my-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center">
                    <VisualBarcode code={selectedLocationForDetail.barcode} width={200} height={40} showText={true} />
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                      selectedLocationForDetail.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {selectedLocationForDetail.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Info</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Shelf level Name</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedLocationForDetail.shelfName || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    onClick={() => {
                      setSelectedLocation(selectedLocationForDetail);
                      setFormMode('EDIT');
                      form.reset({
                        barcode: selectedLocationForDetail.barcode,
                        name: selectedLocationForDetail.name || '',
                        shelfId: selectedLocationForDetail.shelfId,
                        isActive: selectedLocationForDetail.isActive,
                      });
                      setIsDetailsOpen(false);
                      setIsFormDrawerOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Location
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedLocationForDetail)}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Location
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDelete.title}
        description={confirmDelete.description}
        isLoading={deleteMutation.isPending || bulkActionMutation.isPending}
      />
    </div>
  );
}
