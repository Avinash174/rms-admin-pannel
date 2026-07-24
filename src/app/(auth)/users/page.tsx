"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, AlertCircle, RefreshCw, Key, Search, Users, UserCheck, UserX, Info, Sparkles, X } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { columns } from './columns';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '@/lib/api/user';
import { getRoles } from '@/lib/api/role';
import { User } from '@/lib/types/user';
import { CreateUserData, createUserSchema } from '@/lib/validations/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INVITED'>('ALL');
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
    queryKey: ['users', page],
    queryFn: () => getUsers(page, 20),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-all'],
    queryFn: getRoles,
  });
  const roles = rolesData?.data || [];

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

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (selectedUserForDetail?.id) {
        setIsDetailsOpen(false);
        setSelectedUserForDetail(null);
      }
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
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
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
      warehouseId: '',
      password: '',
    },
  });

  const handleCreateSubmit = (data: CreateUserData) => {
    const { firstName, lastName, ...rest } = data;
    const employeeCode = 'EMP-' + Math.floor(100000 + Math.random() * 900000);
    const apiData = {
      ...rest,
      fullName: `${firstName} ${lastName}`.trim(),
      employeeCode,
    };
    createMutation.mutate(apiData as any);
  };

  const handleEditSubmit = (data: any) => {
    if (selectedUser) {
      const { firstName, lastName, email, password, ...rest } = data;
      const apiData = {
        ...rest,
        fullName: `${firstName} ${lastName}`.trim(),
      };
      updateMutation.mutate({ id: selectedUser.id, data: apiData });
    }
  };

  const handleDelete = (user: User) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete User',
      description: `Are you sure you want to delete user ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(user.id);
      },
    });
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

  // Local filtering for responsive UI
  const filteredUsers = users.filter((user: User) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalCount = meta?.total || users.length;
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const suspendedCount = users.filter(u => u.status === 'SUSPENDED').length;

  // Active state for the Edit modal's segmented status control (UI only).
  const editStatus = ((createForm.watch as any)('status') as string) || selectedUser?.status || 'ACTIVE';
  const editInitials = `${selectedUser?.firstName?.[0] || ''}${selectedUser?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-0 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              <Sparkles className="w-3.5 h-3.5" /> Accounts Dashboard
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5">Manage system access, assign roles, assign warehouses, and reset passwords.</p>
        </div>
        <Button
          onClick={() => {
            createForm.reset({
              email: '',
              firstName: '',
              lastName: '',
              phone: '',
              roleId: '',
              warehouseId: '',
              password: '',
            });
            setIsCreateDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Add User
        </Button>
      </div>

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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suspended Users</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{suspendedCount}</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <UserX className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Account locks active
          </div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, phone..."
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/25 transition-all rounded-xl"
          />
        </div>

        {/* Status Filter Tab-like buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'INVITED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
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
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-slate-400 p-6 space-y-2">
            <Users className="w-12 h-12 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No users found matching your search</p>
            <Button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              variant="ghost"
              className="text-blue-600 text-xs font-semibold hover:bg-slate-50"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredUsers}
            meta={meta}
            onPageChange={setPage}
            onEdit={(user, isToggle) => {
              if (isToggle) {
                updateMutation.mutate({ id: user.id, data: { status: user.status } });
              } else {
                setSelectedUser(user);
                createForm.reset({
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  phone: user.phone || '',
                  roleId: user.roleId || '',
                  warehouseId: user.warehouseId || '',
                  password: '',
                });
                setIsEditDialogOpen(true);
              }
            }}
            onCustomAction={(user) => {
              setSelectedUserForDetail(user);
              setIsDetailsOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new user account. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...createForm.register('firstName')}
                    placeholder="John"
                    className="h-10 rounded-xl"
                  />
                  {createForm.formState.errors.firstName && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...createForm.register('lastName')}
                    placeholder="Doe"
                    className="h-10 rounded-xl"
                  />
                  {createForm.formState.errors.lastName && (
                    <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...createForm.register('email')}
                  placeholder="john.doe@example.com"
                  className="h-10 rounded-xl"
                />
                {createForm.formState.errors.email && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...createForm.register('phone')}
                  placeholder="+1 234-567-8900"
                  className="h-10 rounded-xl"
                />
                {createForm.formState.errors.phone && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="roleId">Role</Label>
                <Select onValueChange={(value) => createForm.setValue('roleId', value)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.roleId && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.roleId.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...createForm.register('password')}
                  placeholder="••••••••"
                  className="h-10 rounded-xl"
                />
                {createForm.formState.errors.password && (
                  <p className="text-xs font-semibold text-rose-500">{createForm.formState.errors.password.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl bg-white">
          {/* Gradient profile banner (inner card) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 px-5 pt-5 pb-14 mt-1">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
            <div className="relative space-y-1">
              <h2 className="text-white text-lg font-bold tracking-tight">Edit Profile</h2>
              <p className="text-blue-100/90 text-xs">Update account information and access status.</p>
            </div>
          </div>

          {/* Avatar + identity, overlapping the banner */}
          <div className="-mt-10">
            <div className="flex items-end gap-4">
              <div className="w-[68px] h-[68px] rounded-2xl bg-white p-1 shadow-lg ring-1 ring-slate-100 shrink-0">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-extrabold">
                  {editInitials || <Users className="w-6 h-6" />}
                </div>
              </div>
              <div className="pb-1 min-w-0">
                <h4 className="text-base font-extrabold text-slate-900 truncate">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </h4>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {selectedUser?.employeeCode || 'No employee code'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={createForm.handleSubmit(handleEditSubmit)} className="pt-6 space-y-5">
            {/* Identity section */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identity</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-firstName" className="text-xs text-slate-500">First Name</Label>
                  <Input
                    id="edit-firstName"
                    {...createForm.register('firstName')}
                    placeholder="First Name"
                    className="h-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-lastName" className="text-xs text-slate-500">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    {...createForm.register('lastName')}
                    placeholder="Last Name"
                    className="h-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-email" className="text-xs text-slate-500">Email</Label>
                <div className="relative">
                  <Input
                    id="edit-email"
                    type="email"
                    {...createForm.register('email')}
                    placeholder="Email"
                    className="h-10 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200 pr-10"
                    disabled
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone" className="text-xs text-slate-500">Phone</Label>
                <Input
                  id="edit-phone"
                  {...createForm.register('phone')}
                  placeholder="Phone"
                  className="h-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/25"
                />
              </div>
            </div>

            {/* Access / status section */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Access Status</h5>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'ACTIVE', label: 'Active', active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30' },
                  { value: 'SUSPENDED', label: 'Suspended', active: 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30' },
                  { value: 'INVITED', label: 'Invited', active: 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/30' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => (createForm.setValue as any)('status', opt.value)}
                    className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                      editStatus === opt.value
                        ? opt.active
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 shadow-md hover:shadow-blue-500/25">
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
        isLoading={deleteMutation.isPending}
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
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
                    selectedUserForDetail.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : selectedUserForDetail.status === 'SUSPENDED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {selectedUserForDetail.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Info</h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
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
                      <span className="text-xs font-semibold text-slate-500">Warehouse Assignment</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedUserForDetail.warehouseName || 'Global Access'}</span>
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
                        email: selectedUserForDetail.email,
                        firstName: selectedUserForDetail.firstName,
                        lastName: selectedUserForDetail.lastName,
                        phone: selectedUserForDetail.phone || '',
                        roleId: selectedUserForDetail.roleId || '',
                        warehouseId: selectedUserForDetail.warehouseId || '',
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
                      handleDelete(selectedUserForDetail);
                      setIsDetailsOpen(false);
                    }}
                    variant="outline"
                    className="w-full text-red-650 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-xl h-11 text-xs font-bold border-red-200"
                  >
                    Delete Account
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
