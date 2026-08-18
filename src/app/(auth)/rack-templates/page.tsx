"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Grid,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeaderCard } from '@/components/page-header-card';
import { columns } from './columns';
import {
  activateRackTemplate,
  applyRackTemplate,
  cloneRackTemplate,
  createRackTemplate,
  deactivateRackTemplate,
  deleteRackTemplate,
  getRackTemplates,
  previewRackTemplate,
  previewRackTemplateDraft,
  updateRackTemplate
} from '@/lib/api/rack-template';
import { getWarehouses } from '@/lib/api/warehouse';
import { getRooms } from '@/lib/api/room';
import { PreviewNode, RackTemplate } from '@/lib/types/rack-template';
import {
  applyTemplateSchema,
  cloneTemplateSchema,
  rackTemplateFormSchema,
  RackTemplateFormData,
  WAREHOUSE_TYPE_PRESETS
} from '@/lib/validations/rack-template';

function PreviewTree({ nodes, depth = 0 }: { nodes: PreviewNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? 'space-y-2' : 'ml-4 mt-1 space-y-1 border-l border-slate-200 pl-3'}>
      {nodes.map((node, index) => (
        <li key={`${depth}-${index}-${node.label}`}>
          <span className="font-mono text-xs text-slate-700">{node.label}</span>
          {node.children && node.children.length > 0 && (
            <PreviewTree nodes={node.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

const defaultFormValues: RackTemplateFormData = {
  name: '',
  code: '',
  description: '',
  warehouseType: 'MEDIUM',
  rowsCount: 2,
  racksCount: 4,
  levelsCount: 5,
  locationPerLevel: 5,
  rowPrefix: 'ROW',
  rackPrefix: 'R',
  levelPrefix: 'L',
  locationPrefix: 'LOC',
  locationPadding: 3,
  locationNaming: 'AUTO',
  status: 'ACTIVE'
};

export default function RackTemplatesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState<'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM'>('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedTemplate, setSelectedTemplate] = useState<RackTemplate | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState<RackTemplate | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTree, setPreviewTree] = useState<PreviewNode[]>([]);
  const [previewSummary, setPreviewSummary] = useState<{
    rows: number;
    racksPerRow: number;
    levelsPerRack: number;
    locationsPerLevel: number;
    totalLocations: number;
  } | null>(null);

  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<RackTemplate | null>(null);

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyTemplate, setApplyTemplate] = useState<RackTemplate | null>(null);
  const [applyWarehouseId, setApplyWarehouseId] = useState('');
  const [applyRoomId, setApplyRoomId] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });

  const form = useForm<RackTemplateFormData>({
    resolver: zodResolver(rackTemplateFormSchema) as any,
    defaultValues: defaultFormValues
  });

  const cloneForm = useForm<{ name: string; code: string }>({
    resolver: zodResolver(cloneTemplateSchema),
    defaultValues: { name: '', code: '' }
  });

  const warehouseType = form.watch('warehouseType');

  useEffect(() => {
    if (formMode === 'CREATE' && warehouseType !== 'CUSTOM') {
      const preset = WAREHOUSE_TYPE_PRESETS[warehouseType];
      form.setValue('rowsCount', preset.rowsCount);
      form.setValue('racksCount', preset.racksCount);
      form.setValue('levelsCount', preset.levelsCount);
      form.setValue('locationPerLevel', preset.locationPerLevel);
    }
  }, [warehouseType, formMode, form]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['rack-templates', page, searchTerm, statusFilter, warehouseTypeFilter],
    queryFn: () =>
      getRackTemplates({
        page,
        pageSize: 20,
        search: searchTerm || undefined,
        status: statusFilter,
        warehouseType: warehouseTypeFilter
      })
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => getWarehouses(1, 100)
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-for-apply', applyWarehouseId],
    queryFn: () => getRooms(applyWarehouseId, 1, 100),
    enabled: !!applyWarehouseId
  });

  const templates = data?.data || [];
  const meta = data?.meta;
  const warehouses = warehousesData?.data || [];
  const rooms = roomsData?.data || [];

  const stats = useMemo(() => {
    const active = templates.filter((t) => t.status === 'ACTIVE').length;
    return { total: meta?.total ?? templates.length, active, inactive: (meta?.total ?? templates.length) - active };
  }, [templates, meta]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['rack-templates'] });
    queryClient.invalidateQueries({ queryKey: ['racks'] });
    queryClient.invalidateQueries({ queryKey: ['racks-list'] });
    queryClient.invalidateQueries({ queryKey: ['rack-levels'] });
    queryClient.invalidateQueries({ queryKey: ['levels-list'] });
    queryClient.invalidateQueries({ queryKey: ['locations'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['warehouses-list'] });
  };

  const createMutation = useMutation({
    mutationFn: createRackTemplate,
    onSuccess: () => {
      invalidate();
      setIsFormOpen(false);
      form.reset(defaultFormValues);
      toast.success('Rack template created successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create template')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RackTemplateFormData }) => updateRackTemplate(id, data),
    onSuccess: () => {
      invalidate();
      setIsFormOpen(false);
      setSelectedTemplate(null);
      toast.success('Rack template updated successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update template')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRackTemplate,
    onSuccess: () => {
      invalidate();
      setIsDetailsOpen(false);
      toast.success('Rack template deleted');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete template')
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; code: string } }) => cloneRackTemplate(id, data),
    onSuccess: () => {
      invalidate();
      setIsCloneOpen(false);
      cloneForm.reset();
      toast.success('Template cloned successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to clone template')
  });

  const previewMutation = useMutation({
    mutationFn: async (payload: { id?: string; draft?: RackTemplateFormData }) => {
      if (payload.id) return previewRackTemplate(payload.id);
      return previewRackTemplateDraft(payload.draft!);
    },
    onSuccess: (result) => {
      setPreviewTree(result.tree);
      setPreviewSummary(result.summary);
      setIsPreviewOpen(true);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to generate preview')
  });

  const applyMutation = useMutation({
    mutationFn: ({ id, warehouseId, roomId }: { id: string; warehouseId: string; roomId: string }) =>
      applyRackTemplate(id, { warehouseId, roomId }),
    onSuccess: (result) => {
      invalidate();
      setIsApplyOpen(false);
      setApplyTemplate(null);
      setApplyWarehouseId('');
      setApplyRoomId('');
      setApplyError(null);
      toast.success(result?.message || 'Template applied successfully');
    },
    onError: (err: any) => {
      const errorMsg = err?.message || 'Failed to apply template';
      setApplyError(errorMsg);
      toast.error(errorMsg);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) =>
      activate ? activateRackTemplate(id) : deactivateRackTemplate(id),
    onSuccess: () => {
      invalidate();
      toast.success('Template status updated');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update status')
  });

  const openCreate = () => {
    setFormMode('CREATE');
    setSelectedTemplate(null);
    form.reset({ ...defaultFormValues, ...WAREHOUSE_TYPE_PRESETS.MEDIUM, warehouseType: 'MEDIUM' });
    setIsFormOpen(true);
  };

  const openEdit = (template: RackTemplate) => {
    setFormMode('EDIT');
    setSelectedTemplate(template);
    form.reset({
      name: template.name,
      code: template.code,
      description: template.description || '',
      warehouseType: template.warehouseType,
      rowsCount: template.rowsCount,
      racksCount: template.racksCount,
      levelsCount: template.levelsCount,
      locationPerLevel:
        template.locationPerLevelDisplay ??
        template.locationPerLevel ??
        template.locRows * template.locCols,
      rowPrefix: template.rowPrefix || 'ROW',
      rackPrefix: template.rackPrefix || 'R',
      levelPrefix: template.levelPrefix || 'L',
      locationPrefix: template.locationPrefix || 'LOC',
      locationPadding: template.locationPadding || 3,
      locationNaming: template.locationNaming || 'AUTO',
      status: template.status
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (values: RackTemplateFormData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(values);
    } else if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data: values });
    }
  };

  const handleDelete = (template: RackTemplate) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Rack Template',
      description: `Are you sure you want to delete "${template.name}"? This is a soft delete and can be restored from the database if needed.`,
      onConfirm: () => deleteMutation.mutate(template.id)
    });
  };

  const openClone = (template: RackTemplate) => {
    setCloneSource(template);
    cloneForm.reset({
      name: `${template.name} (Copy)`,
      code: `${template.code}-COPY`
    });
    setIsCloneOpen(true);
  };

  const openApply = (template: RackTemplate) => {
    setApplyTemplate(template);
    setApplyWarehouseId('');
    setApplyRoomId('');
    setApplyError(null);
    setIsApplyOpen(true);
  };

  const handleApply = () => {
    const parsed = applyTemplateSchema.safeParse({ warehouseId: applyWarehouseId, roomId: applyRoomId });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid apply form');
      return;
    }
    if (!applyTemplate) return;
    applyMutation.mutate({
      id: applyTemplate.id,
      warehouseId: applyWarehouseId,
      roomId: applyRoomId
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <Sparkles className="absolute h-5 w-5 animate-pulse text-blue-600" />
        </div>
        <span className="animate-pulse text-sm font-semibold text-slate-500">Loading rack templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-rose-50 p-4">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load rack templates</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 pb-16 sm:px-6 lg:px-0">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Rack Template Master"
        description="Create reusable warehouse rack layouts and apply them to any room."
        badge="Storage Infrastructure · Templates"
        icon={Sparkles}
      >
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-11 rounded-xl bg-white/10 text-white border-white/15 hover:bg-white/20 backdrop-blur-md"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin text-blue-300' : ''}`} />
          Refresh
        </Button>
        <Button onClick={openCreate} className="h-11 rounded-xl bg-blue-600 px-5 text-white font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-500">
          <Plus className="mr-2 h-4 w-4 stroke-[2.5]" />
          Create Template
        </Button>
      </PageHeaderCard>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-150 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 -z-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-blue-50 to-indigo-50/30 opacity-80" />
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Templates</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</h3>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-150 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 -z-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-emerald-50 to-teal-50/30 opacity-80" />
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Active</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{stats.active}</h3>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-150 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 -z-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-rose-50 to-red-50/30 opacity-80" />
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Inactive</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{stats.inactive}</h3>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by code or name..."
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <div className="flex rounded-xl bg-slate-100 p-1.5">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold tracking-wide capitalize transition-all ${
                  statusFilter === status
                    ? 'border border-slate-200/50 bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
          <select
            value={warehouseTypeFilter}
            onChange={(e) => {
              setWarehouseTypeFilter(e.target.value as typeof warehouseTypeFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Types</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      <div className="rounded-[14px] border border-slate-200 bg-white shadow-sm">
        {templates.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center space-y-3 p-6 text-slate-400">
            <div className="rounded-full bg-slate-50 p-4">
              <Sparkles className="h-10 w-10 text-slate-350 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No rack templates found</p>
            <p className="text-xs text-slate-400">Create a template to auto-generate rows, racks, levels, and locations.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={templates}
            meta={meta}
            onPageChange={setPage}
            onCustomAction={(template) => {
              setDetailTemplate(template);
              setIsDetailsOpen(true);
            }}
            onEdit={(template, isToggle) => {
              if (isToggle) {
                statusMutation.mutate({
                  id: template.id,
                  activate: template.status !== 'ACTIVE'
                });
              } else {
                openEdit(template);
              }
            }}
            onDelete={handleDelete}
            onDeactivate={openApply}
            onPrintBarcode={(template) => previewMutation.mutate({ id: template.id })}
            onViewTimeline={openClone}
          />
        )}
      </div>

      {/* Create / Edit Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isFormOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`flex w-screen max-w-lg transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isFormOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Create Rack Template' : 'Edit Rack Template'}
                </h3>
              </div>
              <Button onClick={() => setIsFormOpen(false)} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Code *</Label>
                    <Input className="h-11 rounded-xl uppercase" {...form.register('code')} />
                    {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input className="h-11 rounded-xl" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input className="h-11 rounded-xl" {...form.register('description')} />
                </div>

                <div className="space-y-2">
                  <Label>Warehouse Type</Label>
                  <select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" {...form.register('warehouseType')}>
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Row Count *</Label>
                    <Input type="number" min={1} className="h-11 rounded-xl" {...form.register('rowsCount')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rack Per Row *</Label>
                    <Input type="number" min={1} className="h-11 rounded-xl" {...form.register('racksCount')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Level Per Rack *</Label>
                    <Input type="number" min={1} className="h-11 rounded-xl" {...form.register('levelsCount')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location Per Level *</Label>
                    <Input type="number" min={1} className="h-11 rounded-xl" {...form.register('locationPerLevel')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Row Prefix</Label>
                    <Input className="h-11 rounded-xl uppercase" {...form.register('rowPrefix')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rack Prefix</Label>
                    <Input className="h-11 rounded-xl uppercase" {...form.register('rackPrefix')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Level Prefix</Label>
                    <Input className="h-11 rounded-xl uppercase" {...form.register('levelPrefix')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location Prefix</Label>
                    <Input className="h-11 rounded-xl uppercase" {...form.register('locationPrefix')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location Number Padding</Label>
                    <Input type="number" min={1} max={6} className="h-11 rounded-xl" {...form.register('locationPadding')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location Naming</Label>
                    <select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" {...form.register('locationNaming')}>
                      <option value="AUTO">Auto</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <Label className="text-sm font-bold text-slate-800">Status</Label>
                    <p className="text-[10px] font-semibold text-slate-400">Active templates can be applied to rooms</p>
                  </div>
                  <Switch
                    checked={form.watch('status') === 'ACTIVE'}
                    onCheckedChange={(checked) => form.setValue('status', checked ? 'ACTIVE' : 'INACTIVE')}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200"
                  onClick={() => previewMutation.mutate({ draft: form.getValues() })}
                  disabled={previewMutation.isPending}
                >
                  {previewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Preview
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-11 rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Details Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isDetailsOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isDetailsOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">Template Details</h3>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 rounded-full p-0">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
            {detailTemplate && (
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 p-6 text-center">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
                    {detailTemplate.code}
                  </span>
                  <h4 className="mt-2 text-base font-extrabold text-slate-900">{detailTemplate.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">{detailTemplate.description || 'No description'}</p>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white text-xs">
                  {[
                    ['Warehouse Type', detailTemplate.warehouseType],
                    ['Rows', detailTemplate.rowsCount],
                    ['Racks / Row', detailTemplate.racksCount],
                    ['Levels / Rack', detailTemplate.levelsCount],
                    [
                      'Locations / Level',
                      detailTemplate.locationPerLevelDisplay ??
                        detailTemplate.locationPerLevel ??
                        detailTemplate.locRows * detailTemplate.locCols
                    ],
                    ['Status', detailTemplate.status],
                    ['Created By', detailTemplate.createdByUser?.fullName || '-']
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="font-semibold text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <Button className="h-11 w-full rounded-xl" onClick={() => openEdit(detailTemplate)}>
                    Edit Template
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl"
                    onClick={() => previewMutation.mutate({ id: detailTemplate.id })}
                  >
                    Preview Layout
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl"
                    onClick={() => openApply(detailTemplate)}
                  >
                    Apply Template
                  </Button>
                  <Button variant="outline" className="h-11 w-full rounded-xl" onClick={() => openClone(detailTemplate)}>
                    <Copy className="mr-2 h-4 w-4" /> Clone Template
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(detailTemplate)}
                  >
                    Delete Template
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Layout Preview</h3>
                <p className="text-xs text-slate-500">No database changes during preview</p>
              </div>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" onClick={() => setIsPreviewOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {previewSummary && (
                <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="rounded-lg bg-slate-100 px-2 py-1">{previewSummary.rows} rows</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1">{previewSummary.racksPerRow} racks/row</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1">{previewSummary.levelsPerRack} levels/rack</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1">{previewSummary.locationsPerLevel} loc/level</span>
                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">
                    {previewSummary.totalLocations} total locations
                  </span>
                </div>
              )}
              <PreviewTree nodes={previewTree} />
            </div>
          </div>
        </div>
      )}

      {/* Clone Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isCloneOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsCloneOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ${
              isCloneOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">Clone Template</h3>
              <p className="text-xs text-slate-500">Copy configuration from {cloneSource?.name}</p>
            </div>
            <form
              onSubmit={cloneForm.handleSubmit((values) => {
                if (cloneSource) cloneMutation.mutate({ id: cloneSource.id, data: values });
              })}
              className="flex flex-1 flex-col"
            >
              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>New Template Name *</Label>
                  <Input className="h-11 rounded-xl" {...cloneForm.register('name')} />
                </div>
                <div className="space-y-2">
                  <Label>New Template Code *</Label>
                  <Input className="h-11 rounded-xl uppercase" {...cloneForm.register('code')} />
                </div>
              </div>
              <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 p-6">
                <Button type="button" variant="outline" onClick={() => setIsCloneOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={cloneMutation.isPending} className="rounded-xl bg-blue-600 text-white">
                  {cloneMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Clone
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Apply Right-Side Sheet / Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isApplyOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => !applyMutation.isPending && setIsApplyOpen(false)}
        />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div
            className={`flex w-screen max-w-lg transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isApplyOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <Grid className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">Apply Rack Template</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Select a warehouse and room to apply this template.
                </p>
              </div>
              <Button
                onClick={() => setIsApplyOpen(false)}
                variant="ghost"
                disabled={applyMutation.isPending}
                className="h-9 w-9 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sheet Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* Template Information */}
              {applyTemplate && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Template Information
                  </Label>
                  <div className="rounded-2xl border border-slate-150 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">{applyTemplate.name}</h4>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
                        {applyTemplate.code}
                      </span>
                    </div>
                    {applyTemplate.description && (
                      <p className="text-xs text-slate-500">{applyTemplate.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Warehouse Type</span>
                        <span className="font-semibold text-slate-700">{applyTemplate.warehouseType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Rows</span>
                        <span className="font-semibold text-slate-700">{applyTemplate.rowsCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Racks / Row</span>
                        <span className="font-semibold text-slate-700">{applyTemplate.racksCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Levels / Rack</span>
                        <span className="font-semibold text-slate-700">{applyTemplate.levelsCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Locations / Level</span>
                        <span className="font-semibold text-slate-700">
                          {applyTemplate.locationPerLevelDisplay ??
                            applyTemplate.locationPerLevel ??
                            applyTemplate.locRows * applyTemplate.locCols}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Total Locations</span>
                        <span className="font-bold text-emerald-600">
                          {applyTemplate.rowsCount *
                            applyTemplate.racksCount *
                            applyTemplate.levelsCount *
                            (applyTemplate.locationPerLevelDisplay ??
                              applyTemplate.locationPerLevel ??
                              applyTemplate.locRows * applyTemplate.locCols)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warehouse Selection */}
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <select
                  value={applyWarehouseId}
                  onChange={(e) => {
                    setApplyWarehouseId(e.target.value);
                    setApplyRoomId('');
                    setApplyError(null);
                  }}
                  disabled={applyMutation.isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Selection */}
              <div className="space-y-2">
                <Label>Room *</Label>
                <select
                  value={applyRoomId}
                  onChange={(e) => {
                    setApplyRoomId(e.target.value);
                    setApplyError(null);
                  }}
                  disabled={!applyWarehouseId || applyMutation.isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">{applyWarehouseId ? 'Select room' : 'Select warehouse first'}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview / Template Structure Information */}
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3.5 text-xs text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Existing records with matching codes will be reused — no duplicate rows, racks, levels, or locations will be created.</span>
              </div>

              {/* Error Message Display */}
              {applyError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div>
                    <span className="font-semibold">Application Failed:</span> {applyError}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Sheet Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApplyOpen(false)}
                disabled={applyMutation.isPending}
                className="h-11 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={applyMutation.isPending || !applyTemplate || !applyWarehouseId || !applyRoomId}
                className="h-11 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Apply Template
                  </>
                )}
              </Button>
            </div>
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
