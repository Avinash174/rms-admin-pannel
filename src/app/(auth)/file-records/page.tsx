"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, Loader2, AlertCircle, RefreshCw, Search, FileText, 
  CheckCircle2, XCircle, Info, Sparkles, X, Calendar, 
  ArrowRight, ShieldCheck, KeyRound, Tag, Box, Users, Building2, Briefcase
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getFileRecords, createFileRecord, updateFileRecord, deleteFileRecord } from '@/lib/api/fileRecord';
import { FileRecord } from '@/lib/types/fileRecord';
import { CreateFileRecordData, createFileRecordSchema } from '@/lib/validations/fileRecord';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getClients } from '@/lib/api/client';
import { getDepartments } from '@/lib/api/department';
import { getBoxes } from '@/lib/api/box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FileRecordsPage() {
  const [page, setPage] = useState(1);
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
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedFileRecord, setSelectedFileRecord] = useState<FileRecord | null>(null);
  
  // Details panel state
  const [selectedFileRecordForDetail, setSelectedFileRecordForDetail] = useState<FileRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['file-records', page],
    queryFn: () => getFileRecords(undefined, page, 20),
  });

  const createMutation = useMutation({
    mutationFn: createFileRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-records'] });
      setIsFormDrawerOpen(false);
      createForm.reset();
      toast.success('File record created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create file record');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateFileRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-records'] });
      setIsFormDrawerOpen(false);
      setSelectedFileRecord(null);
      toast.success('File record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update file record');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFileRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-records'] });
      if (selectedFileRecordForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedFileRecordForDetail(null);
      }
      toast.success('File record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete file record');
    },
  });

  const createForm = useForm<CreateFileRecordData>({
    resolver: zodResolver(createFileRecordSchema),
    defaultValues: {
      barcode: '',
      title: '',
      description: '',
      referenceNumber: '',
      boxId: '',
      clientId: '',
      departmentId: '',
      isActive: true,
    },
  });

  const selectedClientId = createForm.watch('clientId');

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients(1, 100),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-for-client', selectedClientId],
    queryFn: () => getDepartments(selectedClientId, 1, 100),
    enabled: !!selectedClientId,
  });

  const { data: boxesData } = useQuery({
    queryKey: ['boxes-all-select'],
    queryFn: () => getBoxes(1, 100),
  });

  const clients = clientsData?.data || [];
  const departments = departmentsData?.data || [];
  const boxes = boxesData?.data || [];

  const handleFormSubmit = (data: CreateFileRecordData) => {
    const { isActive, ...rest } = data;
    const apiData = {
      ...rest,
      status: isActive ? 'ACTIVE' as const : 'ARCHIVED' as const,
    };

    if (formMode === 'CREATE') {
      createMutation.mutate(apiData as any);
    } else if (selectedFileRecord) {
      updateMutation.mutate({ id: selectedFileRecord.id, data: apiData });
    }
  };

  const handleDelete = (fileRecord: FileRecord) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete File Record',
      description: `Are you sure you want to delete file record ${fileRecord.barcode}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(fileRecord.id);
      },
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
        <div className="text-center max-w-sm space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Failed to load file records</h3>
          <p className="text-sm text-slate-500">Please check database connectivity or permissions and try again</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const fileRecords = data?.data || [];
  const meta = data?.meta;

  const filteredFileRecords = fileRecords.filter((file: FileRecord) => {
    const matchesSearch = file.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.title && file.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.referenceNumber && file.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const isActive = file.status === 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);
    return matchesSearch && matchesStatus;
  });

  const totalCount = meta?.total || fileRecords.length;
  const activeCount = fileRecords.filter(f => f.status === 'ACTIVE').length;
  const inactiveCount = fileRecords.filter(f => f.status !== 'ACTIVE').length;

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">File Records</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Active Registry
            </span>
          </div>
          <p className="text-sm text-slate-500">Track and index corporate documents, barcodes, reference tags, and box associations.</p>
        </div>
        <Button
          onClick={() => {
            setFormMode('CREATE');
            setSelectedFileRecord(null);
            createForm.reset({
              barcode: '',
              title: '',
              description: '',
              referenceNumber: '',
              boxId: '',
              clientId: '',
              departmentId: '',
              isActive: true,
            });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Add File Record
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Records */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Indexed Files</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Tracking barcodes and locations
          </div>
        </div>

        {/* Active Status */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Status</p>
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
            Fully active and verification sync enabled
          </div>
        </div>

        {/* Suspended Records */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive / Suspended</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <XCircle className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Refile updates required
          </div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search barcode, title, or reference..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
          />
        </div>

        {/* Status Filter Tab Buttons */}
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

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {filteredFileRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <FileText className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No file records found</p>
              <p className="text-xs text-slate-400">Try altering your search keywords or reset active filters</p>
            </div>
            <Button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              variant="outline"
              className="text-xs font-bold text-blue-600 hover:bg-slate-50 border-slate-200 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFileRecords}
            meta={meta}
            onPageChange={setPage}
            onEdit={(fileRecord, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: fileRecord.id, data: { status: fileRecord.status } });
              } else {
                setFormMode('EDIT');
                setSelectedFileRecord(fileRecord);
                createForm.reset({
                  barcode: fileRecord.barcode,
                  title: fileRecord.title,
                  description: fileRecord.description || '',
                  referenceNumber: fileRecord.referenceNumber || '',
                  boxId: fileRecord.boxId,
                  clientId: fileRecord.clientId,
                  departmentId: fileRecord.departmentId || '',
                  isActive: fileRecord.status === 'ACTIVE',
                });
                setIsFormDrawerOpen(true);
              }
            }}
            onDelete={handleDelete}
            onCustomAction={(fileRecord) => {
              setSelectedFileRecordForDetail(fileRecord);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit File Record */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add File Record' : 'Edit File Record'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formMode === 'CREATE' ? 'Index a new physical file record into system inventory.' : 'Modify catalog meta and registry parameters.'}
                </p>
              </div>
              <Button 
                onClick={() => setIsFormDrawerOpen(false)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Content */}
            <form onSubmit={createForm.handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="barcode" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Barcode</Label>
                <Input
                  id="barcode"
                  {...createForm.register('barcode')}
                  placeholder="e.g. FILE-001"
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-mono tracking-wider transition-all"
                />
                {createForm.formState.errors.barcode && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.barcode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Title</Label>
                <Input
                  id="title"
                  {...createForm.register('title')}
                  placeholder="e.g. Q1 Financial Audit"
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
                {createForm.formState.errors.title && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  {...createForm.register('referenceNumber')}
                  placeholder="e.g. REF-2026-001"
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Description</Label>
                <Input
                  id="description"
                  {...createForm.register('description')}
                  placeholder="Enter record details..."
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boxId" className="text-xs font-bold text-slate-655 uppercase tracking-wider">Target Box</Label>
                <Select 
                  value={createForm.watch('boxId') || undefined} 
                  onValueChange={(val) => createForm.setValue('boxId', val)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs transition-all">
                    <SelectValue placeholder="Select box" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes.map((box: any) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.barcode} {box.description ? `(${box.description})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.boxId && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.boxId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-xs font-bold text-slate-655 uppercase tracking-wider">Client</Label>
                  <Select 
                    value={createForm.watch('clientId') || undefined} 
                    onValueChange={(val) => {
                      createForm.setValue('clientId', val);
                      createForm.setValue('departmentId', ''); // Reset department
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs transition-all">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {createForm.formState.errors.clientId && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.clientId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentId" className="text-xs font-bold text-slate-655 uppercase tracking-wider">Department (optional)</Label>
                  <Select 
                    value={createForm.watch('departmentId') || 'none'} 
                    onValueChange={(val) => createForm.setValue('departmentId', val === 'none' ? '' : val)}
                    disabled={!selectedClientId}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs transition-all">
                      <SelectValue placeholder={selectedClientId ? "Select department" : "Select client first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/75 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Operational Status</Label>
                  <p className="text-xs text-slate-500">Allow instant systems sync and authorization</p>
                </div>
                <Switch
                  id="isActive"
                  checked={createForm.watch('isActive')}
                  onCheckedChange={(checked) => createForm.setValue('isActive', checked)}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDrawerOpen(false)}
                  className="flex-1 rounded-xl h-11 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/10 transition-all"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    formMode === 'CREATE' ? 'Create Record' : 'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: File Record Details Panel */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">File Insights</h3>
              </div>
              <Button 
                onClick={() => setIsDetailsOpen(false)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Drawer Content */}
            {selectedFileRecordForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Brand Showcase */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">{selectedFileRecordForDetail.title}</h4>
                  <p className="text-xs text-slate-550 text-slate-500 mt-1 max-w-[240px]">{selectedFileRecordForDetail.description || 'No description provided'}</p>
                  
                  <div className="flex items-center gap-1.5 mt-3.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-650 text-xs font-bold uppercase tracking-wider font-mono border border-slate-200">
                      {selectedFileRecordForDetail.barcode}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedFileRecordForDetail.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedFileRecordForDetail.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {selectedFileRecordForDetail.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Metadata Properties */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Registry</h5>
                  
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    
                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Record ID</span>
                      </div>
                      <span className="text-xs font-mono text-slate-700 select-all font-bold">{selectedFileRecordForDetail.id}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Reference #</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono">{selectedFileRecordForDetail.referenceNumber || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Created Date</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(selectedFileRecordForDetail.createdAt).toLocaleDateString(undefined, { 
                          dateStyle: 'medium' 
                        })}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Parent Associations */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hierarchy Links</h5>
                  
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    
                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Box Barcode</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono">{selectedFileRecordForDetail.boxBarcode || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Client</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{selectedFileRecordForDetail.clientName || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Department</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{selectedFileRecordForDetail.departmentName || '-'}</span>
                    </div>

                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    onClick={() => {
                      setFormMode('EDIT');
                      setSelectedFileRecord(selectedFileRecordForDetail);
                      createForm.reset({
                        barcode: selectedFileRecordForDetail.barcode,
                        title: selectedFileRecordForDetail.title,
                        description: selectedFileRecordForDetail.description || '',
                        referenceNumber: selectedFileRecordForDetail.referenceNumber || '',
                        boxId: selectedFileRecordForDetail.boxId,
                        clientId: selectedFileRecordForDetail.clientId,
                        departmentId: selectedFileRecordForDetail.departmentId || '',
                        isActive: selectedFileRecordForDetail.status === 'ACTIVE',
                      });
                      setIsDetailsOpen(false);
                      setIsFormDrawerOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Record details
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedFileRecordForDetail)}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete File Instance
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
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
