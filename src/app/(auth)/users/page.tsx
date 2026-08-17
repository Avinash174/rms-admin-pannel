"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, AlertCircle, RefreshCw, Key, Search, Users, UserCheck, UserX, Info, Sparkles, X, Save, Check, ShieldCheck } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
  updateUserAssignments,
} from '@/lib/api/user';
import { getWarehouses } from '@/lib/api/warehouse';
import { useAuth } from '@/contexts/auth-context';
import { RoleNameKey } from '@/lib/types/user';
import { User } from '@/lib/types/user';
import { CreateUserData, createUserSchema } from '@/lib/validations/user';
import { isWarehouseAdmin } from '@/lib/permissions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { PageHeaderCard } from '@/components/page-header-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Roles that require explicit warehouse assignment (mobile + warehouse manager admin panel). */
const WAREHOUSE_ASSIGNMENT_ROLES: RoleNameKey[] = ['WAREHOUSE_MANAGER', 'SUPERVISOR', 'OPERATOR'];

const ALL_ROLES: { value: RoleNameKey; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'COMPANY_ADMIN', label: 'Company Admin' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'VIEWER', label: 'Viewer' },
];

export default function UsersPage() {
  const { user: authUser } = useAuth();

  if (isWarehouseAdmin(authUser)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          User Master and user management are restricted to Super Administrators. Warehouse Administrators do not have access to user accounts.
        </p>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', page, searchTerm, roleFilter, statusFilter],
    queryFn: () =>
      getUsers(page, 20, {
        search: searchTerm || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        isActive:
          statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: () => getWarehouses(1, 100),
  });
  const warehouses = warehousesData?.data || [];

  const assignableRoles =
    authUser?.roleName === 'SUPER_ADMIN'
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r.value !== 'SUPER_ADMIN');

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (selectedUserForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedUserForDetail(null);
      }
      toast.success('User deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate user');
    },
  });

  const assignmentsMutation = useMutation({
    mutationFn: ({ id, warehouseIds }: { id: string; warehouseIds: string[] }) =>
      updateUserAssignments(id, warehouseIds),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update warehouse assignments');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetUserPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      toast.success('Password reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'OPERATOR',
      warehouseIds: [],
      password: '',
    },
  });

  const selectedRole = createForm.watch('role');
  const selectedWarehouseIds = createForm.watch('warehouseIds') || [];
  const showWarehousePicker = WAREHOUSE_ASSIGNMENT_ROLES.includes(selectedRole);

  const handleCreateSubmit = (data: CreateUserData) => {
    createMutation.mutate({
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      password: data.password,
      warehouseIds: data.warehouseIds || [],
    });
  };

  const handleEditSubmit = async (data: CreateUserData) => {
    if (!selectedUser) return;
    const { firstName, lastName, phone, role } = data;
    await updateMutation.mutateAsync({
      id: selectedUser.id,
      data: {
        firstName,
        lastName,
        phone: phone || null,
        role,
      },
    });
    if (role && WAREHOUSE_ASSIGNMENT_ROLES.includes(role)) {
      await assignmentsMutation.mutateAsync({
        id: selectedUser.id,
        warehouseIds: data.warehouseIds || [],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    toast.success('User updated successfully');
  };

  const handleDeactivate = (user: User) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Deactivate User',
      description: `Deactivate ${user.fullName || user.firstName}? They will no longer be able to sign in.`,
      onConfirm: () => {
        deactivateMutation.mutate(user.id);
      },
    });
  };

  const toggleWarehouse = (warehouseId: string) => {
    const current = createForm.getValues('warehouseIds') || [];
    if (current.includes(warehouseId)) {
      createForm.setValue(
        'warehouseIds',
        current.filter((id) => id !== warehouseId)
      );
    } else {
      createForm.setValue('warehouseIds', [...current, warehouseId]);
    }
  };

  const handlePasswordReset = (user: User) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    if (selectedUser && password) {
      passwordMutation.mutate({ id: selectedUser.id, password });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500 animate-pulse">Loading user accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">Failed to load users</h3>
          <p className="text-sm text-slate-500 mt-1">Please check your connection and try again</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const users = data?.data || [];
  const meta = data?.meta;

  const totalCount = meta?.total || users.length;
  const activeCount = users.filter((u) => u.isActive ?? u.status === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;

  const editIsActive = selectedUser?.isActive ?? selectedUser?.status === 'ACTIVE';
  const editInitials = `${selectedUser?.firstName?.[0] || ''}${selectedUser?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-0 pb-12">
      {/* Page Header Hero Banner */}
      <PageHeaderCard
        title="User Management"
        description="Manage system access, assign roles, assign warehouses, and reset passwords."
        badge="System Live · Accounts Dashboard"
        showAccessScope={true}
      >
        <Button
          onClick={() => {
            createForm.reset({
              username: '',
              email: '',
              firstName: '',
              lastName: '',
              phone: '',
              role: 'OPERATOR',
              warehouseIds: [],
              password: '',
            });
            setIsCreateDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-300 h-11 px-5 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Add User
        </Button>
      </PageHeaderCard>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Authorized user accounts
          </div>
        </div>

        {/* Active Accounts */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeCount}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <UserCheck className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active operational status
          </div>
        </div>

        {/* Suspended Users */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive Users</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <UserX className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Deactivated accounts
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, username..."
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/25 transition-all rounded-xl"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-48 h-10 rounded-xl">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {ALL_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold tracking-wide rounded-lg transition-all capitalize ${
                statusFilter === status
                  ? 'bg-white text-blue-600 shadow-sm'
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
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-slate-400 p-6 space-y-2">
            <Users className="w-12 h-12 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No users found matching your filters</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setRoleFilter('ALL');
              }}
              variant="ghost"
              className="text-blue-600 text-xs font-semibold hover:bg-slate-50"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            meta={meta}
            onPageChange={setPage}
            onEdit={(user, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: user.id, data: { isActive: user.isActive } });
              } else {
                setSelectedUser(user);
                createForm.reset({
                  username: user.username || user.employeeCode,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  phone: user.phone || '',
                  role: (user.roleKey || 'OPERATOR') as RoleNameKey,
                  warehouseIds: user.warehouseIds || [],
                  password: '',
                });
                setIsEditDialogOpen(true);
              }
            }}
            onCustomAction={(user) => {
              setSelectedUserForDetail(user);
              setIsDetailsOpen(true);
            }}
            onDelete={handleDeactivate}
          />
        )}
      </div>

      {/* ===== Add User — Right Slide-Over Drawer ===== */}
      {/* Backdrop */}
      <div
        onClick={() => setIsCreateDialogOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          isCreateDialogOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-Over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-slate-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200/80 ${
          isCreateDialogOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 shrink-0 text-white border-b border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
              <Plus className="h-3 w-3 text-indigo-400" />
              Add New User
            </span>
            <h2 className="text-white text-base font-extrabold tracking-tight mt-1">Create User Account</h2>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          <form id="create-user-form" onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4 pb-4">

            {/* Identity Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  Account Identity
                </div>
                <span className="text-[11px] text-slate-400 font-medium">User Credentials</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-username" className="text-xs font-semibold text-slate-700">Username</Label>
                <Input
                  id="create-username"
                  {...createForm.register('username')}
                  placeholder="e.g. jdoe"
                  className="h-10 rounded-xl font-mono border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                />
                {createForm.formState.errors.username && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="create-firstName" className="text-xs font-semibold text-slate-700">First Name</Label>
                  <Input
                    id="create-firstName"
                    {...createForm.register('firstName')}
                    placeholder="John"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                  />
                  {createForm.formState.errors.firstName && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="create-lastName" className="text-xs font-semibold text-slate-700">Last Name</Label>
                  <Input
                    id="create-lastName"
                    {...createForm.register('lastName')}
                    placeholder="Doe"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                  />
                  {createForm.formState.errors.lastName && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                <Input
                  id="create-email"
                  type="email"
                  {...createForm.register('email')}
                  placeholder="john.doe@example.com"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                />
                {createForm.formState.errors.email && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-phone" className="text-xs font-semibold text-slate-700">Phone Number</Label>
                <Input
                  id="create-phone"
                  {...createForm.register('phone')}
                  placeholder="+1 234-567-8900"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                />
                {createForm.formState.errors.phone && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Role & Access Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                  Role & Permissions
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Access Level</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-role" className="text-xs font-semibold text-slate-700">System Role</Label>
                <Select
                  value={createForm.watch('role')}
                  onValueChange={(value: RoleNameKey) => {
                    createForm.setValue('role', value, { shouldDirty: true, shouldValidate: true });
                    if (!WAREHOUSE_ASSIGNMENT_ROLES.includes(value)) {
                      createForm.setValue('warehouseIds', []);
                    }
                  }}
                >
                  <SelectTrigger id="create-role" className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-medium">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.role && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.role.message}</p>
                )}
              </div>

              {showWarehousePicker && (
                <div className="grid gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">Assigned Warehouses</Label>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {selectedWarehouseIds.length} Selected
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-1.5 bg-slate-50/50">
                    {warehouses.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No warehouses available</p>
                    ) : (
                      warehouses.map((wh) => {
                        const isChecked = selectedWarehouseIds.includes(wh.id);
                        return (
                          <label
                            key={wh.id}
                            className={`flex items-center gap-3 text-xs cursor-pointer py-2 px-2.5 rounded-xl transition-all ${
                              isChecked ? 'bg-indigo-50/70 border border-indigo-200/60 font-semibold text-indigo-900' : 'hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleWarehouse(wh.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="truncate">{wh.code} — {wh.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-amber-600" />
                  Account Security
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Initial Password</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-password" className="text-xs font-semibold text-slate-700">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  {...createForm.register('password')}
                  placeholder="Set account password"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                />
                {createForm.formState.errors.password && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.password.message}</p>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Drawer Sticky Footer Actions */}
        <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shadow-md z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateDialogOpen(false)}
            className="rounded-xl h-10 px-5 text-slate-700 border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl h-10 px-6 text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create User
          </Button>
        </div>

      </div>

      {/* ===== Edit User Profile — Right Slide-Over Drawer ===== */}
      {/* Backdrop */}
      <div
        onClick={() => setIsEditDialogOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          isEditDialogOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-Over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-slate-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-200/80 ${
          isEditDialogOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 shrink-0 text-white border-b border-slate-800 shadow-sm">
          <div className="relative flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/15 px-3 py-1 rounded-full border border-blue-400/20">
              <Users className="h-3 w-3 text-blue-400" />
              Edit User Profile
            </span>
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Integrated User Avatar + Info */}
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-0.5 shadow-lg shadow-blue-900/40 shrink-0 ring-2 ring-white/10">
                <div className="w-full h-full rounded-[14px] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center text-lg font-black tracking-wider">
                  {editInitials || <Users className="w-6 h-6" />}
                </div>
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${editIsActive ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-rose-500 ring-2 ring-rose-500/30'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-extrabold text-white truncate">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  editIsActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {editIsActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                <span className="font-mono text-slate-400">{selectedUser?.employeeCode ? `ID: ${selectedUser.employeeCode}` : selectedUser?.email}</span>
                <span className="text-slate-600">•</span>
                <span className="text-blue-300 font-semibold uppercase text-[10px]">{selectedUser?.roleName?.replaceAll('_', ' ') || 'USER'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          <form id="edit-user-form" onSubmit={createForm.handleSubmit(handleEditSubmit)} className="space-y-4 pb-4">

            {/* Identity Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  Identity & Contact
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Personal Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-firstName" className="text-xs font-semibold text-slate-700">First Name</Label>
                  <Input
                    id="edit-firstName"
                    {...createForm.register('firstName')}
                    placeholder="First Name"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-lastName" className="text-xs font-semibold text-slate-700">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    {...createForm.register('lastName')}
                    placeholder="Last Name"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Primary Login</span>
                </div>
                <div className="relative">
                  <Input
                    id="edit-email"
                    type="email"
                    {...createForm.register('email')}
                    placeholder="Email"
                    className="h-10 rounded-xl bg-slate-100/80 text-slate-600 cursor-not-allowed border-slate-200 pr-10 text-xs font-medium"
                    disabled
                  />
                  <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone" className="text-xs font-semibold text-slate-700">Phone Number</Label>
                <Input
                  id="edit-phone"
                  {...createForm.register('phone')}
                  placeholder="+1 234 567 890"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
                />
              </div>
            </div>

            {/* Role & Access Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  Role & Warehouse Access
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Access Control</span>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">System Role</Label>
                <Select
                  value={createForm.watch('role')}
                  onValueChange={(value: RoleNameKey) => {
                    createForm.setValue('role', value, { shouldDirty: true, shouldValidate: true });
                    if (!WAREHOUSE_ASSIGNMENT_ROLES.includes(value)) {
                      createForm.setValue('warehouseIds', []);
                    }
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-medium">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {WAREHOUSE_ASSIGNMENT_ROLES.includes(createForm.watch('role')) && (
                <div className="grid gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">Assigned Warehouses</Label>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {(createForm.watch('warehouseIds') || []).length} Selected
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-1.5 bg-slate-50/50">
                    {warehouses.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No warehouses found</p>
                    ) : (
                      warehouses.map((wh) => {
                        const isChecked = (createForm.watch('warehouseIds') || []).includes(wh.id);
                        return (
                          <label
                            key={wh.id}
                            className={`flex items-center gap-3 text-xs cursor-pointer py-2 px-2.5 rounded-xl transition-all ${
                              isChecked ? 'bg-blue-50/70 border border-blue-200/60 font-semibold text-blue-900' : 'hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleWarehouse(wh.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="truncate">{wh.code} — {wh.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Status & Security Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Account Status & Security
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Access Control</span>
              </div>

              {/* Status Switch Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Account Access</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      editIsActive 
                        ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-300/60' 
                        : 'bg-rose-100/80 text-rose-800 border border-rose-300/60'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${editIsActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {editIsActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {editIsActive ? 'User can log in and perform warehouse operations' : 'User access is temporarily deactivated'}
                  </p>
                </div>

                {/* iOS/Tailwind Style Toggle Switch */}
                <button
                  type="button"
                  onClick={() => selectedUser && updateMutation.mutate({ id: selectedUser.id, data: { isActive: !editIsActive } })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    editIsActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={editIsActive}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      editIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Password Management Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Password & Credentials</h5>
                    <p className="text-[11px] text-slate-500">Reset or set a new password for this user</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedUser) {
                      setIsPasswordDialogOpen(true);
                    }
                  }}
                  className="rounded-xl h-8 px-3 text-xs font-bold border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 hover:text-indigo-800 transition-all shadow-xs"
                >
                  Reset Password
                </Button>
              </div>
            </div>

          </form>
        </div>

        {/* Drawer Sticky Footer Actions */}
        <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shadow-md z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditDialogOpen(false)}
            className="rounded-xl h-10 px-5 text-slate-700 border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl h-10 px-6 text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>

      </div>


      {/* Password Reset Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.firstName} {selectedUser?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                required
                placeholder="Enter new password (min 8 chars)"
                className="h-10 rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={passwordMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6">
                {passwordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDelete.title}
        description={confirmDelete.description}
        isLoading={deactivateMutation.isPending}
      />

      {/* SLIDE-OVER DRAWER: User Details */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">User Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedUserForDetail && (
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md mb-3">
                    {`${selectedUserForDetail.firstName?.[0] || ''}${selectedUserForDetail.lastName?.[0] || ''}`.toUpperCase()}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {selectedUserForDetail.firstName} {selectedUserForDetail.lastName}
                  </h4>
                  <span className="text-xs text-slate-400 mt-1 font-mono">
                    {selectedUserForDetail.employeeCode || 'No Employee Code'}
                  </span>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mt-3 ${
                    (selectedUserForDetail.isActive ?? selectedUserForDetail.status === 'ACTIVE')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {(selectedUserForDetail.isActive ?? selectedUserForDetail.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Info</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Username</span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">{selectedUserForDetail.username || selectedUserForDetail.employeeCode}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Email</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedUserForDetail.email}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Phone</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedUserForDetail.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Role</span>
                      <span className="text-xs font-semibold text-slate-700 uppercase">{selectedUserForDetail.roleName || 'Operator'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Warehouses</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedUserForDetail.warehousesCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500">Created At</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(selectedUserForDetail.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    onClick={() => {
                      setSelectedUser(selectedUserForDetail);
                      createForm.reset({
                        username: selectedUserForDetail.username || selectedUserForDetail.employeeCode,
                        email: selectedUserForDetail.email,
                        firstName: selectedUserForDetail.firstName,
                        lastName: selectedUserForDetail.lastName,
                        phone: selectedUserForDetail.phone || '',
                        role: (selectedUserForDetail.roleKey || 'OPERATOR') as RoleNameKey,
                        warehouseIds: selectedUserForDetail.warehouseIds || [],
                        password: '',
                      });
                      setIsDetailsOpen(false);
                      setIsEditDialogOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-bold"
                  >
                    Edit User
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedUser(selectedUserForDetail);
                      setIsDetailsOpen(false);
                      setIsPasswordDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full text-slate-700 hover:bg-slate-50 border-slate-200 rounded-xl h-11 text-xs font-bold"
                  >
                    Reset Password
                  </Button>
                  <Button
                    onClick={() => {
                      handleDeactivate(selectedUserForDetail);
                      setIsDetailsOpen(false);
                    }}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Deactivate Account
                  </Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
