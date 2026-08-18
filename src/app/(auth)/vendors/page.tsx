"use client";

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  AlertCircle,
  Building2,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
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
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor
} from '@/lib/api/vendor';
import { Vendor } from '@/lib/types/vendor';
import { VendorFormData, vendorSchema } from '@/lib/validations/vendor';

const defaultFormValues: VendorFormData = {
  name: '',
  code: '',
  contactEmail: '',
  phone: '',
  address: '',
  isActive: true
};

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create / Edit Drawer
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // View Details Drawer
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);

  // Delete Confirm Modal
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: defaultFormValues
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['vendors', page, searchTerm, statusFilter],
    queryFn: () =>
      getVendors(page, 20, {
        search: searchTerm || undefined,
        status: statusFilter
      })
  });

  const vendors = data?.data || [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const active = vendors.filter((v) => v.isActive).length;
    return {
      total: meta?.total ?? vendors.length,
      active,
      inactive: (meta?.total ?? vendors.length) - active
    };
  }, [vendors, meta]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  };

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      invalidate();
      setIsFormOpen(false);
      form.reset(defaultFormValues);
      setFormError(null);
      toast.success('Vendor created successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create vendor';
      setFormError(msg);
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorFormData> }) => updateVendor(id, data),
    onSuccess: (updatedVendor) => {
      invalidate();
      setIsFormOpen(false);
      setSelectedVendor(null);
      setFormError(null);
      if (detailVendor && detailVendor.id === updatedVendor.id) {
        setDetailVendor(updatedVendor);
      }
      toast.success('Vendor updated successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update vendor';
      setFormError(msg);
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      invalidate();
      setIsDetailsOpen(false);
      setDetailVendor(null);
      toast.success('Vendor deleted successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete vendor')
  });

  const openCreate = () => {
    setFormMode('CREATE');
    setSelectedVendor(null);
    setFormError(null);
    form.reset(defaultFormValues);
    setIsFormOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setFormMode('EDIT');
    setSelectedVendor(vendor);
    setFormError(null);
    form.reset({
      name: vendor.name,
      code: vendor.code,
      contactEmail: vendor.contactEmail || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      isActive: vendor.isActive
    });
    setIsFormOpen(true);
  };

  const handleCloseFormAttempt = () => {
    if (form.formState.isDirty) {
      setShowDiscardDialog(true);
    } else {
      setIsFormOpen(false);
      form.reset(defaultFormValues);
      setFormError(null);
    }
  };

  const handleSubmit = (values: VendorFormData) => {
    setFormError(null);
    if (formMode === 'CREATE') {
      createMutation.mutate({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        contactEmail: values.contactEmail ? values.contactEmail.trim() : undefined,
        phone: values.phone ? values.phone.trim() : undefined,
        address: values.address ? values.address.trim() : undefined,
        isActive: values.isActive
      });
    } else if (selectedVendor) {
      updateMutation.mutate({
        id: selectedVendor.id,
        data: {
          name: values.name.trim(),
          contactEmail: values.contactEmail ? values.contactEmail.trim() : undefined,
          phone: values.phone ? values.phone.trim() : undefined,
          address: values.address ? values.address.trim() : undefined,
          isActive: values.isActive
        }
      });
    }
  };

  const handleDelete = (vendor: Vendor) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Vendor',
      description: `Are you sure you want to delete vendor "${vendor.name}" (${vendor.code})? This action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(vendor.id)
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <Building2 className="absolute h-5 w-5 animate-pulse text-blue-600" />
        </div>
        <span className="animate-pulse text-sm font-semibold text-slate-500">Loading vendors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-rose-50 p-4">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load vendors</h3>
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
        title="Vendor Master"
        description="Manage supplier and vendor relationships, contact information, and service assignments."
        badge="Business Masters · Vendors"
        icon={Building2}
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
          Add Vendor
        </Button>
      </PageHeaderCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-150 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 -z-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-blue-50 to-indigo-50/30 opacity-80" />
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Vendors</p>
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by vendor code, name, email..."
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
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-[14px] border border-slate-200 bg-white shadow-sm">
        {vendors.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center space-y-3 p-6 text-slate-400">
            <div className="rounded-full bg-slate-50 p-4">
              <Building2 className="h-10 w-10 text-slate-350 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No vendors found</p>
            <p className="text-xs text-slate-400">Add a vendor to record contacts, services, and assignments.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={vendors}
            meta={meta}
            onPageChange={setPage}
            onCustomAction={(vendor) => {
              setDetailVendor(vendor);
              setIsDetailsOpen(true);
            }}
            onEdit={(vendor, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({
                  id: vendor.id,
                  data: { isActive: vendor.isActive }
                });
              } else {
                openEdit(vendor);
              }
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Create / Edit Right-Side Sheet */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isFormOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => !createMutation.isPending && !updateMutation.isPending && handleCloseFormAttempt()}
        />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div
            className={`flex w-screen max-w-lg transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isFormOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {formMode === 'CREATE' ? 'Create Vendor' : 'Edit Vendor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formMode === 'CREATE' ? 'Add a new supplier or vendor' : `Updating ${selectedVendor?.name}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCloseFormAttempt}
                variant="ghost"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-9 w-9 rounded-full p-0 hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sheet Form Body */}
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor Name *</Label>
                  <Input
                    id="vendor-name"
                    placeholder="e.g. Acme Logistics Pvt Ltd"
                    className="h-11 rounded-xl"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-rose-500 font-medium">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-code">Vendor Code *</Label>
                  <Input
                    id="vendor-code"
                    placeholder="e.g. VND-001"
                    disabled={formMode === 'EDIT'}
                    className="h-11 rounded-xl uppercase font-mono disabled:bg-slate-50"
                    {...form.register('code')}
                  />
                  {form.formState.errors.code && (
                    <p className="text-xs text-rose-500 font-medium">{form.formState.errors.code.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-email">Contact Email</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      placeholder="vendor@company.com"
                      className="h-11 rounded-xl"
                      {...form.register('contactEmail')}
                    />
                    {form.formState.errors.contactEmail && (
                      <p className="text-xs text-rose-500 font-medium">{form.formState.errors.contactEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-phone">Phone / Mobile</Label>
                    <Input
                      id="vendor-phone"
                      placeholder="+91 98765 43210"
                      className="h-11 rounded-xl"
                      {...form.register('phone')}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-rose-500 font-medium">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-address">Address</Label>
                  <textarea
                    id="vendor-address"
                    rows={3}
                    placeholder="Full street address, city, state, pincode..."
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    {...form.register('address')}
                  />
                  {form.formState.errors.address && (
                    <p className="text-xs text-rose-500 font-medium">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div>
                    <Label className="text-sm font-bold text-slate-800">Active Status</Label>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Active vendors are selectable for service orders and shipments
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
                  />
                </div>

                {/* Error Banner */}
                {formError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <span className="font-semibold">Submission Error:</span> {formError}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseFormAttempt}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-11 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {formMode === 'CREATE' ? 'Creating...' : 'Saving...'}
                    </>
                  ) : (
                    formMode === 'CREATE' ? 'Create Vendor' : 'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Details Right-Side Sheet / Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isDetailsOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div
            className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isDetailsOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Vendor Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 rounded-full p-0">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            {detailVendor && (
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-blue-50/40 to-indigo-50/10 p-6 text-center">
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 uppercase tracking-wide border border-blue-200/50">
                    {detailVendor.code}
                  </span>
                  <h4 className="mt-3 text-lg font-extrabold text-slate-900">{detailVendor.name}</h4>
                  {detailVendor.company?.name && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Company: {detailVendor.company.name}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white text-xs">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-semibold text-slate-500">Status</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        detailVendor.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {detailVendor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-semibold text-slate-500">Contact Email</span>
                    <span className="font-semibold text-slate-700">{detailVendor.contactEmail || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-semibold text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-700">{detailVendor.phone || '-'}</span>
                  </div>
                  <div className="flex items-start justify-between px-4 py-3">
                    <span className="font-semibold text-slate-500">Address</span>
                    <span className="font-semibold text-slate-700 text-right max-w-[200px]">
                      {detailVendor.address || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-semibold text-slate-500">Vendor ID</span>
                    <span className="font-mono text-[10px] text-slate-500 select-all">{detailVendor.id}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <Button
                    className="h-11 w-full rounded-xl"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      openEdit(detailVendor);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Vendor
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl"
                    onClick={() => {
                      updateMutation.mutate({
                        id: detailVendor.id,
                        data: { isActive: !detailVendor.isActive }
                      });
                    }}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {detailVendor.isActive ? 'Deactivate Vendor' : 'Activate Vendor'}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(detailVendor)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Vendor
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discard Confirmation Centered Modal */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsFormOpen(false);
          form.reset(defaultFormValues);
          setFormError(null);
        }}
        title="Discard changes?"
        description="You have unsaved changes in this vendor form. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Continue Editing"
        variant="warning"
      />

      {/* Delete Confirmation Centered Modal */}
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
