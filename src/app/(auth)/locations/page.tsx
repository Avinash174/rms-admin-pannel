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
  ArrowRight,
  Building2,
  ChevronRight,
  AlertTriangle
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
  importWarehouseLocations,
  BulkGenerateLocationsRequest
} from '@/lib/api/location';
import { getWarehouses } from '@/lib/api/warehouse';
import { Location, LocationImportRow, LocationImportResult } from '@/lib/types/location';
import { CreateLocationData, createLocationSchema } from '@/lib/validations/location';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HierarchyFilters, useEffectiveHierarchyIds } from '@/components/masters/hierarchy-filters';
import { PageHeaderCard } from '@/components/page-header-card';

export default function LocationsPage() {
  const [page, setPage] = useState(1);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rackId, setRackId] = useState('');
  const [shelfId, setShelfId] = useState('');
  const { effectiveShelfId } = useEffectiveHierarchyIds(selectedWarehouseId, roomId, rackId, shelfId, 'shelf');

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
  const [importRows, setImportRows] = useState<LocationImportRow[]>([]);
  const [importResult, setImportResult] = useState<LocationImportResult | null>(null);
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

  // Fetch Warehouses for dropdown
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });
  const warehouses = warehousesData?.data || [];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['locations', effectiveShelfId, selectedWarehouseId, searchTerm, statusFilter, page],
    queryFn: () => getLocations(effectiveShelfId || undefined, selectedWarehouseId || undefined, searchTerm || undefined, statusFilter, page, 20),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLocationData) => createLocation(effectiveShelfId || undefined, { ...data, warehouseId: selectedWarehouseId || undefined }),
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

  // Bulk Import Excel Mutation
  const bulkImportMutation = useMutation({
    mutationFn: ({ warehouseId, rows }: { warehouseId: string; rows: LocationImportRow[] }) =>
      importWarehouseLocations(warehouseId, rows),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setImportResult(res);
      toast.success(`Import completed: ${res.imported} imported, ${res.updated} updated, ${res.failed} failed`);
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
      createMutation.mutate(data);
    } else if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data });
    }
  };

  const handleDelete = (location: Location) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Location',
      description: `Are you sure you want to delete location ${location.fullLocation2 || location.barcode}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(location.id);
      },
    });
  };

  const locations = data?.data || [];
  const meta = data?.meta;

  const totalCount = meta?.total || locations.length;
  const activeCount = locations.filter((l) => l.isActive).length;
  const inactiveCount = totalCount - activeCount;

  // Selected row IDs
  const selectedLocationIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((indexStr) => rowSelection[indexStr])
      .map((indexStr) => locations[Number(indexStr)]?.id)
      .filter(Boolean);
  }, [rowSelection, locations]);

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

  // Handle Client Excel Location Upload
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
          toast.error('Uploaded Excel file is empty.');
          return;
        }

        const parsed: LocationImportRow[] = rawJson.map((row) => {
          return {
            'Full Location': row['Full Location'] || row['fullLocation'] || row['FullLocation'] || '',
            'NRow': row['NRow'] || row['nRow'] || row['Row'] || row['row'] || '',
            'NRack2': row['NRack2'] || row['nRack2'] || row['Rack'] || row['rack'] || '',
            'Nlevel': row['Nlevel'] || row['nLevel'] || row['Level'] || row['level'] || '',
            'NLocation': row['NLocation'] || row['nLocation'] || row['Location'] || row['location'] || '',
            'NFull Location2': row['NFull Location2'] || row['nFullLocation2'] || row['FullLocation2'] || row['Barcode'] || ''
          };
        }).filter(r => r['NFull Location2'] || r['Full Location'] || r['NLocation']);

        if (!parsed.length) {
          toast.error('No valid location rows found. Ensure the file has client location columns (Full Location, NRow, NRack2, Nlevel, NLocation, NFull Location2).');
          return;
        }

        setImportRows(parsed);
        setImportResult(null);
        toast.success(`Parsed ${parsed.length} client location records ready for import`);
      } catch (err: any) {
        toast.error('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download Client Excel Template
  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Full Location': 'AB1W-01-A1-01-01',
        'NRow': 'R23',
        'NRack2': '01',
        'Nlevel': 'A1',
        'NLocation': '01',
        'NFull Location2': 'R23-01-A1-01'
      },
      {
        'Full Location': 'AB1W-01-A1-01-02',
        'NRow': 'R23',
        'NRack2': '01',
        'Nlevel': 'A1',
        'NLocation': '02',
        'NFull Location2': 'R23-01-A1-02'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Location_Master_Template');
    XLSX.writeFile(wb, 'Warehouse_Location_Master_Template.xlsx');
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
        title="Warehouse Location Master"
        description="Client Warehouse Location Structure & Barcode Master (Full Location, Row, Rack, Level, Location)."
        badge="Warehouse Structure · Locations"
        icon={MapPin}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bulk Import Client Excel */}
          <Button
            onClick={() => {
              if (!selectedWarehouseId && warehouses.length > 0) {
                setSelectedWarehouseId(warehouses[0].id);
              }
              setIsImportModalOpen(true);
            }}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-3.5 text-xs font-semibold shadow-xs"
          >
            <Upload className="w-4 h-4 mr-2 text-blue-600" />
            Import Client Excel
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

      {/* Warehouse Selector & Hierarchy Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Warehouse:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {locations.length} of {totalCount} locations
          </span>
        </div>

        <HierarchyFilters
          depth="shelf"
          warehouseId={selectedWarehouseId}
          roomId={roomId}
          rackId={rackId}
          shelfId={shelfId}
          onWarehouseChange={setSelectedWarehouseId}
          onRoomChange={setRoomId}
          onRackChange={setRackId}
          onShelfChange={setShelfId}
        />
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Locations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-xs">
              <MapPin className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Physical warehouse storage location master
          </div>
        </div>

        {/* Active */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Locations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeCount}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-xs">
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
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive Locations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-xs">
              <X className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Offline warehouse storage barcodes
          </div>
        </div>
      </div>

      {/* Toolbar & Search Bar */}
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

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Full Location, Row, Rack, Level, Location..."
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
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
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
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-xs">
        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <MapPin className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No locations found</p>
              <p className="text-xs text-slate-400">
                Click &quot;Import Client Excel&quot; to upload client location master or &quot;Add Location&quot; to create manually.
              </p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={locations}
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

      {/* MODAL: Import Client Excel Location Master */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Import Client Location Master</h3>
                  <p className="text-xs text-slate-400">Upload Excel spreadsheet with client location columns</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRows([]);
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Warehouse</Label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Download className="w-4 h-4 text-blue-600" />
                  Download client location Excel template
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                >
                  Download Template
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Click to upload client Excel file</p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports columns: Full Location, NRow, NRack2, Nlevel, NLocation, NFull Location2
                </p>
              </div>

              {importRows.length > 0 && !importResult && (
                <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{importRows.length} Location Records Loaded</p>
                      <p className="text-[11px] text-slate-500">Ready to import into selected warehouse</p>
                    </div>
                  </div>
                  <Button
                    disabled={bulkImportMutation.isPending || !selectedWarehouseId}
                    onClick={() => bulkImportMutation.mutate({ warehouseId: selectedWarehouseId, rows: importRows })}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4"
                  >
                    {bulkImportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Confirm Import
                  </Button>
                </div>
              )}

              {/* Import Summary Result Modal */}
              {importResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Import Summary Report</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <span className="text-lg font-extrabold text-blue-700">{importResult.totalRecords}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <span className="text-lg font-extrabold text-emerald-700">{importResult.imported}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Imported</p>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-xl">
                      <span className="text-lg font-extrabold text-amber-700">{importResult.updated}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Updated</p>
                    </div>
                    <div className="p-2.5 bg-rose-50 rounded-xl">
                      <span className="text-lg font-extrabold text-rose-700">{importResult.failed}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Failed</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors ({importResult.errors.length})
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                        {importResult.errors.map((err, i) => (
                          <div key={i} className="flex items-center justify-between text-slate-700">
                            <span>Row {err.row}: {err.location}</span>
                            <span className="text-rose-600 font-semibold">{err.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRows([]);
                  setImportResult(null);
                }}
                className="rounded-xl border-slate-200 text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS DRAWER: Location Inspection & Client Hierarchy View */}
      {isDetailsOpen && selectedLocationForDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden transition-opacity duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Location Inspector</h3>
                    <p className="text-xs text-slate-400">Physical Warehouse Storage Detail</p>
                  </div>
                </div>
                <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Location Barcode Badge */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location Barcode</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-mono font-extrabold text-blue-400">
                      {selectedLocationForDetail.fullLocation2 || selectedLocationForDetail.barcode}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedLocationForDetail.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {selectedLocationForDetail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <VisualBarcode
                    code={selectedLocationForDetail.fullLocation2 || selectedLocationForDetail.barcode}
                    width={280}
                    height={36}
                    showText={false}
                  />
                </div>

                {/* Client Hierarchy View: Warehouse -> Row -> Rack -> Level -> Location */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location Hierarchy</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 font-mono text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900">
                        Warehouse: {selectedLocationForDetail.warehouseName || selectedLocationForDetail.warehouse?.name || 'Main Warehouse'}
                      </span>
                    </div>
                    <div className="pl-5 border-l-2 border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 font-semibold">Row (NRow):</span>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">{selectedLocationForDetail.row || '-'}</span>
                      </div>
                      <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500 font-semibold">Rack (NRack2):</span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">{selectedLocationForDetail.rack || '-'}</span>
                        </div>
                        <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500 font-semibold">Level (Nlevel):</span>
                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">{selectedLocationForDetail.level || '-'}</span>
                          </div>
                          <div className="pl-4 border-l-2 border-blue-300">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-blue-600 font-semibold">Location (NLocation):</span>
                              <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {selectedLocationForDetail.location || selectedLocationForDetail.name || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Attributes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location Attributes</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white text-xs">
                    <div className="p-3 flex justify-between">
                      <span className="text-slate-500">Full Location:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedLocationForDetail.fullLocation || '-'}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-slate-500">NFull Location2:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedLocationForDetail.fullLocation2 || '-'}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-slate-500">Occupancy Status:</span>
                      <span className="font-bold text-slate-900">{selectedLocationForDetail.isOccupied ? 'Occupied' : 'Empty'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="rounded-xl border-slate-200 text-xs font-semibold">
                  Close Inspector
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete.onConfirm}
        title={confirmDelete.title}
        description={confirmDelete.description}
      />
    </div>
  );
}
