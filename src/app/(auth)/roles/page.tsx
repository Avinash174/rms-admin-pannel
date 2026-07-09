"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, Loader2, AlertCircle, RefreshCw, Shield, 
  CheckCircle2, Info, Sparkles, X, Calendar, 
  ShieldAlert, ShieldCheck, KeyRound, Check, Edit2, Search, Trash2
} from 'lucide-react';
import { getRoles, createRole, updateRole, deleteRole, getPermissions, assignPermissions } from '@/lib/api/role';
import { Role, Permission } from '@/lib/types/role';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RolesPage() {
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Detail & Permission Checklist drawer
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<Role | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeRolePermissions, setActiveRolePermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: rolesData, isLoading: isRolesLoading, error: rolesError, refetch: refetchRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const { data: permissionsData, isLoading: isPermissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsFormDrawerOpen(false);
      resetForm();
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsFormDrawerOpen(false);
      setSelectedRole(null);
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => 
      assignPermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleDeleteRole = (role: Role) => {
    if (confirm(`Are you sure you want to delete role "${role.label}"?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      label: '',
    }
  });

  const handleFormSubmit = (data: any) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(data);
    } else if (selectedRole) {
      updateMutation.mutate({ id: selectedRole.id, data: { label: data.label } });
    }
  };

  const handleTogglePermission = (permissionName: string) => {
    if (!selectedRoleForDetail) return;
    let newPermissions: string[];
    if (activeRolePermissions.includes(permissionName)) {
      newPermissions = activeRolePermissions.filter(p => p !== permissionName);
    } else {
      newPermissions = [...activeRolePermissions, permissionName];
    }
    setActiveRolePermissions(newPermissions);
    
    // Resolve UUIDs for the names
    const allPermissions = permissionsData?.data || [];
    const permissionIds = newPermissions.map(pName => {
      return allPermissions.find(p => p.name === pName)?.id || '';
    }).filter(id => id !== '');

    assignPermissionsMutation.mutate({ roleId: selectedRoleForDetail.id, permissionIds });
  };

  if (isRolesLoading || isPermissionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Shield className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading roles registry...</span>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load roles</h3>
        <Button onClick={() => refetchRoles()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  const roles = rolesData?.data || [];
  const permissions = permissionsData?.data || [];

  // Group permissions by category for visual structure
  const groupedPermissions: Record<string, Permission[]> = {};
  permissions.forEach(p => {
    const category = p.category || 'General';
    if (!groupedPermissions[category]) {
      groupedPermissions[category] = [];
    }
    groupedPermissions[category].push(p);
  });

  const totalRoles = roles.length;
  const totalPermissions = permissions.length;
  const systemAccessPercent = 100;

  const filteredRoles = roles.filter((r) =>
    !searchTerm ||
    r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> RBAC Engine
            </span>
          </div>
          <p className="text-sm text-slate-500">Configure authorization boundaries, assign system capabilities, and map access policies.</p>
        </div>
        <Button
          onClick={() => {
            setFormMode('CREATE');
            setSelectedRole(null);
            resetForm({ name: '', label: '' });
            setIsFormDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 self-start sm:self-center h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
          Create Role
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Roles */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-50 to-indigo-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Roles</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalRoles}</h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
              <Shield className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-blue-500" /> Active security roles registered
          </div>
        </div>

        {/* Total System Capabilities */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-teal-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Privileges</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalPermissions}</h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
              <KeyRound className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Granular action permission parameters
          </div>
        </div>

        {/* Policy Verification */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-50 to-red-50/30 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coverage Index</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{systemAccessPercent}%</h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
            <Info className="w-4 h-4 text-rose-500" /> Fully aligned access guidelines
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search roles by name or label..." className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl text-sm" />
        </div>
      </div>

      {/* Grid of Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          const permCount = role.permissions?.length || 0;
          return (
            <div 
              key={role.id}
              onClick={() => {
                setSelectedRoleForDetail(role);
                setActiveRolePermissions(role.permissions?.map(p => p.name) || []);
                setIsDetailsOpen(true);
              }}
              className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-indigo-50/20 rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {role.label}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">slug: {role.name}</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
                    <Shield className="w-5 h-5 stroke-[2]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-50 pt-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Privileges:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                    {permCount} active
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3 relative z-25 gap-2">
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRole(role);
                    setFormMode('EDIT');
                    resetForm({
                      name: role.name,
                      label: role.label,
                    });
                    setIsFormDrawerOpen(true);
                  }}
                  className="h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2.5"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                {!['SUPER_ADMIN', 'COMPANY_ADMIN', 'WAREHOUSE_MANAGER', 'SUPERVISOR', 'OPERATOR', 'VIEWER'].includes(role.name.toUpperCase()) && (
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRole(role);
                    }}
                    className="h-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SLIDE-OVER DRAWER: Add/Edit Role */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isFormDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isFormDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'CREATE' ? 'Add Custom Role' : 'Edit Role Details'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define user-levels and access limits.
                </p>
              </div>
              <Button onClick={() => setIsFormDrawerOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formMode === 'CREATE' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role Slug Name</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Slug is required' })}
                    placeholder="e.g. warehouse_manager"
                    className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-mono tracking-wider transition-all"
                  />
                  {errors.name && <p className="text-xs font-semibold text-rose-500">{errors.name.message}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="label" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Label</Label>
                <Input
                  id="label"
                  {...register('label', { required: 'Label is required' })}
                  placeholder="e.g. Warehouse Manager"
                  className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
                {errors.label && <p className="text-xs font-semibold text-rose-500">{errors.label.message}</p>}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/10 transition-all"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    formMode === 'CREATE' ? 'Save Role' : 'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: Role Details & Permission Checklist */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isDetailsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Configure Permissions</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {selectedRoleForDetail && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Meta Summary */}
                <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Slug</span>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white border px-2 py-0.5 rounded-lg">{selectedRoleForDetail.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Label Name</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedRoleForDetail.label}</span>
                  </div>
                </div>

                {/* Permission Checklist */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Actions</h4>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={() => {
                          const allNames = permissions.map(p => p.name);
                          setActiveRolePermissions(allNames);
                          const allIds = permissions.map(p => p.id);
                          assignPermissionsMutation.mutate({ roleId: selectedRoleForDetail.id, permissionIds: allIds });
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                        onClick={() => {
                          setActiveRolePermissions([]);
                          assignPermissionsMutation.mutate({ roleId: selectedRoleForDetail.id, permissionIds: [] });
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {Object.keys(groupedPermissions).map((category) => (
                    <div key={category} className="space-y-2.5">
                      <h5 className="text-[11px] font-extrabold text-blue-600 bg-blue-50/30 border border-blue-100/30 rounded-lg px-2 py-1 uppercase tracking-wider">{category}</h5>
                      <div className="space-y-1.5 pl-1">
                        {groupedPermissions[category].map((perm) => {
                          const isChecked = activeRolePermissions.includes(perm.name);
                          return (
                            <div 
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.name)}
                              className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-50/50 hover:bg-slate-50/60 transition-colors cursor-pointer select-none group"
                            >
                              <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-lg border transition-all ${
                                isChecked 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-slate-200 group-hover:border-slate-350'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">{perm.name}</span>
                                <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{perm.description || 'No description provided'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
