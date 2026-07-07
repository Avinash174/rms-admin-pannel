"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, AlertCircle, RefreshCw, FileText, Download, 
  Calendar, Package, Users, Sparkles, X, Plus, Info, CheckCircle, Search, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { useForm } from 'react-hook-form';

interface Report {
  id: string;
  name: string;
  type: 'INVENTORY' | 'ACTIVITY' | 'AUDIT' | 'PERFORMANCE';
  description: string;
  generatedAt: string;
  generatedBy: string;
  fileUrl?: string;
  status: 'READY' | 'GENERATING' | 'FAILED';
}

const mockData: Report[] = [
  {
    id: 'REP-001',
    name: 'Monthly Inventory Report - January 2026',
    type: 'INVENTORY',
    description: 'Complete inventory summary for all locations',
    generatedAt: '2026-06-30T23:59:00Z',
    generatedBy: 'John Doe',
    fileUrl: '/reports/inventory-jan-2026.pdf',
    status: 'READY',
  },
  {
    id: 'REP-002',
    name: 'Activity Report - Week 26',
    type: 'ACTIVITY',
    description: 'Weekly workflow activity summary',
    generatedAt: '2026-07-01T18:00:00Z',
    generatedBy: 'Jane Smith',
    fileUrl: '/reports/activity-week-26.pdf',
    status: 'READY',
  },
  {
    id: 'REP-003',
    name: 'Audit Log Report - Q2 2026',
    type: 'AUDIT',
    description: 'Quarterly audit trail summary',
    generatedAt: '2026-07-02T17:00:00Z',
    generatedBy: 'Admin Operator',
    fileUrl: '/reports/audit-q2-2026.pdf',
    status: 'READY',
  },
  {
    id: 'REP-004',
    name: 'Performance Report - June 2026',
    type: 'PERFORMANCE',
    description: 'System performance metrics',
    generatedAt: '2026-07-03T09:00:00Z',
    generatedBy: 'System Cron',
    status: 'GENERATING',
  },
];

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', page],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return { data: mockData, meta: { page, pageSize: 20, total: 4, totalPages: 1 } };
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Simulate API POST /reports/generate
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: `REP-00${Math.floor(Math.random() * 100)}`,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Admin Operator',
        status: 'GENERATING' as const,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsFormDrawerOpen(false);
      resetForm();
    }
  });

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      type: 'INVENTORY',
      description: '',
    }
  });

  const handleFormSubmit = (data: any) => {
    generateReportMutation.mutate(data);
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

  const reports = data?.data || [];
  const meta = data?.meta;

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const inventoryCount = reports.filter(r => r.type === 'INVENTORY').length;
  const activityCount = reports.filter(r => r.type === 'ACTIVITY').length;
  const auditCount = reports.filter(r => r.type === 'AUDIT').length;
  const performanceCount = reports.filter(r => r.type === 'PERFORMANCE').length;

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
        <Button
          onClick={() => {
            resetForm({ name: '', type: 'INVENTORY', description: '' });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Generate New Report
        </Button>
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
            {(['ALL', 'INVENTORY', 'ACTIVITY', 'AUDIT', 'PERFORMANCE'] as const).map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Desktop segmented pill control */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-0.5">
            {([
              { value: 'ALL', label: 'All' },
              { value: 'INVENTORY', label: 'Inventory' },
              { value: 'ACTIVITY', label: 'Activity' },
              { value: 'AUDIT', label: 'Audit' },
              { value: 'PERFORMANCE', label: 'Performance' },
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
            meta={meta}
            onPageChange={setPage}
            onCustomAction={(report) => {
              setSelectedReportForDetail(report);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

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
                  <option value="INVENTORY">INVENTORY SUMMARY</option>
                  <option value="ACTIVITY">ACTIVITY STATS</option>
                  <option value="AUDIT">AUDIT LOGS HISTORY</option>
                  <option value="PERFORMANCE">SPEED PERFORMANCE</option>
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
                        {new Date(selectedReportForDetail.generatedAt).toLocaleString()}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Download Actions */}
                {selectedReportForDetail.status === 'READY' && selectedReportForDetail.fileUrl && (
                  <div className="pt-6 border-t border-slate-100">
                    <Button
                      onClick={() => alert(`Downloading: ${selectedReportForDetail.name}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
                    >
                      <Download className="w-4 h-4" />
                      Download Completed PDF
                    </Button>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
