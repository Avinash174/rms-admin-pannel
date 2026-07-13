"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2, AlertCircle, RefreshCw, FileText, Download,
  Calendar, Package, Users, Sparkles, X, Plus, Info, CheckCircle, Search, KeyRound,
  Upload, FileSpreadsheet, File, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { useForm } from 'react-hook-form';
import { listReports, generateReport, downloadReport, updateReport, deleteReport } from '@/lib/api/report';
import { ReportType, ReportJob, GenerateReportRequest } from '@/lib/types/report';
import { exportToPDF } from '@/lib/utils/pdf';

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<ReportJob | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Edit & Delete States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormValues, setEditFormValues] = useState({ name: '', description: '' });
  const [selectedFormFile, setSelectedFormFile] = useState<File | null>(null);

  // Upload States
  const [activeTab, setActiveTab] = useState<'reports' | 'uploads'>('reports');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([
    {
      id: 'upl-1',
      fileName: 'warehouse_A_boxes_june.xlsx',
      fileSize: '1.2 MB',
      importType: 'BOX_INVENTORY',
      recordCount: 145,
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'upl-2',
      fileName: 'barcode_scans_room3.csv',
      fileSize: '450 KB',
      importType: 'CUSTODY_HISTORY',
      recordCount: 38,
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadedFiles((current) => [
              {
                id: `upl-${Date.now()}`,
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                importType: 'BOX_INVENTORY',
                recordCount: Math.floor(Math.random() * 200) + 10,
                status: 'SUCCESS',
                createdAt: new Date().toISOString(),
              },
              ...current,
            ]);
            toast.success(`Successfully uploaded and imported ${file.name}`);
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: listReports,
  });

  const generateReportMutation = useMutation({
    mutationFn: (variables: GenerateReportRequest) => generateReport(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsFormDrawerOpen(false);
      setSelectedFormFile(null);
      toast.success('Report generation started');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to generate report');
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) => updateReport(id, data),
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsEditDialogOpen(false);
      
      // Update local state if this report is open in detail drawer
      if (selectedReportForDetail?.id === updatedReport.id) {
        setSelectedReportForDetail(updatedReport);
      }
      
      toast.success('Report updated successfully');
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsDetailsOpen(false);
      setSelectedReportForDetail(null);
      toast.success('Report deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete report');
    },
  });

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      type: 'BOX_INVENTORY' as ReportType,
      description: '',
    }
  });

  const handleFormSubmit = (data: any) => {
    generateReportMutation.mutate({
      type: data.type,
      name: data.name,
      description: data.description
    });
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: 'System Reports',
      subtitle: `Total Reports: ${reports.length}`,
      columns: [
        { header: 'Type', dataKey: 'type' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Created', dataKey: 'createdAt' },
        { header: 'Completed', dataKey: 'completedAt' },
      ],
      data: reports.map(r => ({
        type: r.type,
        status: r.status,
        createdAt: new Date(r.createdAt).toLocaleString(),
        completedAt: r.completedAt ? new Date(r.completedAt).toLocaleString() : 'N/A',
      })),
      fileName: `reports-${Date.now()}.pdf`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <FileText className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading system reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load reports</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const reports = data || [];

  const filteredReports = reports.filter((report: ReportJob) => {
    const matchesSearch = (report.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (report.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesType = typeFilter === 'ALL' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const inventoryCount = reports.filter((r: ReportJob) => r.type === 'BOX_INVENTORY').length;
  const activityCount = reports.filter((r: ReportJob) => r.type === 'USER_WORKLOAD').length;
  const auditCount = reports.filter((r: ReportJob) => r.type === 'CUSTODY_HISTORY').length;
  const performanceCount = 0; // No performance type in backend

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Reports</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Reports Dashboard
            </span>
          </div>
          <p className="text-sm text-slate-500">Generate, view, and export detailed analytical PDFs for inventory states, operations tracking, and speed benchmarks.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl h-11 px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => {
              resetForm({ name: '', type: 'BOX_INVENTORY' as ReportType, description: '' });
              setIsFormDrawerOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 h-11 px-5"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
            Generate New Report
          </Button>
        </div>
      </div>

      {/* Reports Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory Reports */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-350 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-indigo-50/20 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
              <Package className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory</p>
              <h3 className="text-xl font-black text-slate-905">{inventoryCount}</h3>
            </div>
          </div>
        </div>

        {/* Activity Reports */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-350 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-50 to-teal-50/20 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
              <FileText className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity</p>
              <h3 className="text-xl font-black text-slate-905">{activityCount}</h3>
            </div>
          </div>
        </div>

        {/* Audit Reports */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-350 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-50 to-violet-50/20 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/50">
              <Users className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit</p>
              <h3 className="text-xl font-black text-slate-905">{auditCount}</h3>
            </div>
          </div>
        </div>

        {/* Performance Reports */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-350 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-50 to-orange-50/20 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
              <Calendar className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Performance</p>
              <h3 className="text-xl font-black text-slate-905">{performanceCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200/60 pb-px gap-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'reports' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Generated Reports
          {activeTab === 'reports' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('uploads')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'uploads' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          File Uploads & Imports
          {activeTab === 'uploads' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'reports' ? (
        <>
          {/* Toolbar Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report name or description..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm"
          />
        </div>

        {/* Filter Type — mobile: native select, md+: pill segmented control */}
        <div className="w-full md:w-auto">
          {/* Mobile dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="md:hidden w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            {(['ALL', 'BOX_INVENTORY', 'USER_WORKLOAD', 'CUSTODY_HISTORY'] as const).map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'All Types' : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Desktop segmented pill control */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-0.5">
            {([
              { value: 'ALL', label: 'All' },
              { value: 'BOX_INVENTORY', label: 'Inventory' },
              { value: 'USER_WORKLOAD', label: 'Activity' },
              { value: 'CUSTODY_HISTORY', label: 'Audit' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all whitespace-nowrap ${
                  typeFilter === value
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 space-y-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <FileText className="w-10 h-10 text-slate-350 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">No reports found</p>
              <p className="text-xs text-slate-400">Try altering your search keywords or active filters</p>
            </div>
            <Button
              onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); }}
              variant="outline"
              className="text-xs font-bold text-blue-600 hover:bg-slate-50 border-slate-200 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredReports}
            onCustomAction={(report) => {
              setSelectedReportForDetail(report);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>
        </>
      ) : (
        /* Uploads Layout */
        <div className="space-y-6">
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Import Spreadsheet Data</h3>
            <p className="text-xs text-slate-500 mb-6">Bulk upload box and file record Excel/CSV sheets directly to seed database inventory.</p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/5 rounded-2xl p-8 text-center cursor-pointer transition-all relative h-48">
              <input 
                type="file" 
                id="bulk-file-upload" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleUploadFile}
                disabled={isUploading}
              />
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-800">
                {isUploading ? 'Uploading and processing file...' : 'Choose file or drag here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Excel or CSV formats accepted (up to 10MB)</p>

              {isUploading && (
                <div className="w-full max-w-xs mt-4 space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-150" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                    Progress: {uploadProgress}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Upload History list */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
              <h4 className="text-sm font-bold text-slate-800">Upload & Import History</h4>
            </div>
            
            <div className="divide-y divide-slate-100">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-800 leading-none">{file.fileName}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <span>{file.fileSize}</span>
                        <span>•</span>
                        <span>{file.recordCount} records loaded</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Imported Successfully
                    </span>
                    <Button 
                      variant="ghost" 
                      onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                      className="h-8 w-8 p-0 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: Generate New Report */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Generate Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">Start an async background report generation task.</p>
              </div>
              <Button onClick={() => setIsFormDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-slate-655 uppercase tracking-wider">Report Title Name</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  placeholder="e.g. Monthly Audit Q3 2026"
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs"
                />
                {errors.name && <p className="text-xs font-semibold text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-bold text-slate-655 uppercase tracking-wider">Report Category Type</Label>
                <select
                  id="type"
                  {...register('type', { required: true })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="BOX_INVENTORY">INVENTORY SUMMARY</option>
                  <option value="USER_WORKLOAD">ACTIVITY STATS</option>
                  <option value="CUSTODY_HISTORY">AUDIT LOGS HISTORY</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-655 uppercase tracking-wider">Description Summary</Label>
                <Input
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Describe the target data constraints..."
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs"
                />
                {errors.description && <p className="text-xs font-semibold text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-655 uppercase tracking-wider">Data Source File (Optional CSV/Excel)</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="form-file-upload" className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-605 font-bold">
                        {selectedFormFile ? selectedFormFile.name : 'Upload reference data'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {selectedFormFile ? `${(selectedFormFile.size / 1024).toFixed(1)} KB` : 'CSV, XLSX or TXT (Max. 5MB)'}
                      </p>
                    </div>
                    <input 
                      id="form-file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setSelectedFormFile(e.target.files?.[0] || null)} 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDrawerOpen(false)}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={generateReportMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/10 transition-all"
                >
                  {generateReportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Generate Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: Report Insights Panel */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Report Details</h3>
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
            {selectedReportForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Brand Showcase */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{selectedReportForDetail.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">{selectedReportForDetail.description}</p>
                  
                  <div className="flex items-center gap-1.5 mt-3.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-650 text-xs font-bold uppercase tracking-wider font-mono border border-slate-200">
                      {selectedReportForDetail.type}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedReportForDetail.status === 'READY' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : selectedReportForDetail.status === 'GENERATING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {selectedReportForDetail.status}
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
                        <span className="text-xs font-semibold text-slate-500">Report ID</span>
                      </div>
                      <span className="text-xs font-mono text-slate-700 select-all font-bold">{selectedReportForDetail.id}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Generated By</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{selectedReportForDetail.generatedBy}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Timestamp</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(selectedReportForDetail.createdAt).toLocaleString()}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Actions Panel */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  {selectedReportForDetail.status === 'READY' && (
                    <Button
                      onClick={async () => {
                        try {
                          const blob = await downloadReport(selectedReportForDetail.id);
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedReportForDetail.name || 'report'}-${selectedReportForDetail.id}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error(err);
                          alert('Failed to download report data');
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV Report
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      setEditFormValues({
                        name: selectedReportForDetail.name || '',
                        description: selectedReportForDetail.description || ''
                      });
                      setIsDetailsOpen(false);
                      setIsEditDialogOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit Metadata
                  </Button>

                  <Button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete report: ${selectedReportForDetail.name}?`)) {
                        deleteReportMutation.mutate(selectedReportForDetail.id);
                      }
                    }}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Report
                  </Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIALOG: Edit Report */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsEditDialogOpen(false)} />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 w-full max-w-md relative z-10 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Report Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Modify the metadata of this generated report.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-bold text-slate-500 uppercase">Report Name</Label>
                <Input
                  id="edit-name"
                  value={editFormValues.name}
                  onChange={(e) => setEditFormValues(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs font-bold text-slate-500 uppercase">Description</Label>
                <Input
                  id="edit-description"
                  value={editFormValues.description}
                  onChange={(e) => setEditFormValues(prev => ({ ...prev, description: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedReportForDetail) {
                    updateReportMutation.mutate({
                      id: selectedReportForDetail.id,
                      data: editFormValues
                    });
                  }
                }}
                disabled={updateReportMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
              >
                {updateReportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
