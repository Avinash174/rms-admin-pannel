"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Plus, Trash2, Check, X, ChevronDown, ChevronRight,
  Loader2, Search, Save, AlertTriangle, ShieldCheck,
  Sparkles, Key
} from 'lucide-react';
import { getRoles, getPermissions, createRole, deleteRole, assignPermissions } from '@/lib/api/role';
import { toast } from 'sonner';
import { PageHeaderCard } from '@/components/page-header-card';

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  dashboard:  { label: 'Dashboard',   color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200'   },
  user:       { label: 'Users',       color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'        },
  role:       { label: 'Roles',       color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200'    },
  permission: { label: 'Permissions', color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200'    },
  company:    { label: 'Company',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200'  },
  branch:     { label: 'Branch',      color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200'        },
  site:       { label: 'Site',        color: 'text-cyan-700',    bg: 'bg-cyan-50 border-cyan-200'        },
  warehouse:  { label: 'Warehouse',   color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200'          },
  storage:    { label: 'Storage',     color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'      },
  box:        { label: 'Boxes',       color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200'    },
  file:       { label: 'Files',       color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200'        },
  client:     { label: 'Clients',     color: 'text-pink-700',    bg: 'bg-pink-50 border-pink-200'        },
  device:     { label: 'Devices',     color: 'text-slate-700',   bg: 'bg-slate-50 border-slate-200'      },
  report:     { label: 'Reports',     color: 'text-lime-700',    bg: 'bg-lime-50 border-lime-200'        },
  settings:   { label: 'Settings',    color: 'text-gray-700',    bg: 'bg-gray-50 border-gray-200'        },
  audit:      { label: 'Audit',       color: 'text-red-700',     bg: 'bg-red-50 border-red-200'          },
};

function getCategoryMeta(key: string) {
  const cat = key.split(':')[0];
  return CATEGORY_META[cat] ?? { label: cat.charAt(0).toUpperCase() + cat.slice(1), color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
}

const ROLE_NAME_OPTIONS = [
  'SUPER_ADMIN','COMPANY_ADMIN','WAREHOUSE_MANAGER','SUPERVISOR','OPERATOR','VIEWER','CUSTOM'
];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [pendingPermissions, setPendingPermissions] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState('OPERATOR');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({ queryKey: ['roles'], queryFn: getRoles });
  const { data: permissionsData, isLoading: permLoading } = useQuery({ queryKey: ['all-permissions'], queryFn: getPermissions });

  const roles = rolesData?.data ?? [];
  const allPermissions = permissionsData?.data ?? [];
  const selectedRole = roles.find((r: any) => r.id === selectedRoleId);

  const handleSelectRole = (roleId: string) => {
    const role = roles.find((r: any) => r.id === roleId);
    if (!role) return;
    setSelectedRoleId(roleId);
    setPendingPermissions(new Set(role.permissions?.map((p: any) => p.id) ?? []));
    setIsDirty(false);
    setSearch('');
  };

  const grouped = useMemo(() => {
    const filtered = allPermissions.filter((p: any) =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    );
    const map = new Map<string, any[]>();
    for (const p of filtered) {
      const cat = p.name.split(':')[0];
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [allPermissions, search]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  const togglePermission = (permId: string) => {
    setPendingPermissions(prev => { const n = new Set(prev); n.has(permId) ? n.delete(permId) : n.add(permId); return n; });
    setIsDirty(true);
  };

  const toggleCategoryPerms = (permIds: string[]) => {
    const allSelected = permIds.every(id => pendingPermissions.has(id));
    setPendingPermissions(prev => {
      const n = new Set(prev);
      if (allSelected) permIds.forEach(id => n.delete(id)); else permIds.forEach(id => n.add(id));
      return n;
    });
    setIsDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => assignPermissions(selectedRoleId!, Array.from(pendingPermissions)),
    onSuccess: () => { toast.success('Permissions saved'); setIsDirty(false); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  const createMutation = useMutation({
    mutationFn: () => createRole({ name: newRoleName, label: newRoleLabel || newRoleName }),
    onSuccess: (role: any) => {
      toast.success(`Role "${role.label}" created`);
      setShowCreate(false); setNewRoleLabel('');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setTimeout(() => handleSelectRole(role.id), 300);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to create role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      toast.success('Role deleted'); setDeleteConfirmId(null);
      if (selectedRoleId === deleteConfirmId) { setSelectedRoleId(null); setPendingPermissions(new Set()); }
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete role'),
  });

  const isLoading = rolesLoading || permLoading;

  return (
    <div className="h-full flex flex-col gap-0 p-6" style={{ minHeight: 0 }}>
      {/* Header Hero Banner */}
      <div className="mb-6">
        <PageHeaderCard
          title="Roles & Permissions Master"
          description="Manage role-based access control, security policies, and granular system permissions."
          badge="System Live · RBAC Security"
          icon={Shield}
          showAccessScope={true}
        >
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Role
          </button>
        </PageHeaderCard>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <span className="text-sm text-slate-400">Loading roles & permissions…</span>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
          {/* Left Panel */}
          <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1">{roles.length} Roles</p>
            {roles.map((role: any) => {
              const isSelected = selectedRoleId === role.id;
              const isSystem = !role.companyId;
              return (
                <button key={role.id} onClick={() => handleSelectRole(role.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${isSelected ? 'border-violet-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                  style={isSelected ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-violet-50'}`}>
                        <ShieldCheck className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-violet-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{role.label || role.name}</div>
                        <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>{role.permissions?.length ?? 0} permissions</div>
                      </div>
                    </div>
                    {isSystem && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>SYS</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Panel */}
          <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: 0 }}>
            {!selectedRole ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center p-12">
                <div className="p-4 bg-violet-50 rounded-2xl mb-4"><Key className="h-8 w-8 text-violet-400" /></div>
                <h3 className="text-sm font-semibold text-slate-700">Select a Role</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Choose a role from the left to view and edit its permissions</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-50 rounded-xl"><ShieldCheck className="h-4 w-4 text-violet-600" /></div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{selectedRole.label || selectedRole.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{pendingPermissions.size} of {allPermissions.length} permissions granted</div>
                    </div>
                    {isDirty && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3" /> Unsaved changes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deleteConfirmId === selectedRole.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs text-red-700 font-medium">Delete?</span>
                        <button onClick={() => deleteMutation.mutate(selectedRole.id)} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md ml-1">Yes</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] font-bold text-slate-600 hover:bg-slate-100 px-2 py-0.5 rounded-md">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(selectedRole.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete role">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search permissions…"
                        className="pl-8 pr-3 h-8 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition w-48" />
                    </div>
                    <button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: '#7c3aed' }} onMouseEnter={e => { if (!saveMutation.isPending && isDirty) e.currentTarget.style.background = '#6d28d9'; }} onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}>
                      {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${allPermissions.length ? (pendingPermissions.size / allPermissions.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {allPermissions.length ? Math.round((pendingPermissions.size / allPermissions.length) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Permission groups */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {grouped.size === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-12">No permissions match your search.</div>
                  ) : (
                    Array.from(grouped.entries()).map(([cat, perms]) => {
                      const meta = getCategoryMeta(perms[0].name);
                      const isCollapsed = collapsedCategories.has(cat);
                      const permIds = perms.map((p: any) => p.id);
                      const selectedCount = permIds.filter(id => pendingPermissions.has(id)).length;
                      const allSelected = selectedCount === permIds.length;
                      const someSelected = selectedCount > 0 && !allSelected;
                      return (
                        <div key={cat} className={`rounded-xl border overflow-hidden ${meta.bg}`}>
                          <div className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none`} onClick={() => toggleCategory(cat)}>
                            <div className="flex items-center gap-2">
                              <button onClick={e => { e.stopPropagation(); toggleCategoryPerms(permIds); }}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${allSelected ? 'bg-violet-600 border-violet-600' : someSelected ? 'bg-violet-200 border-violet-400' : 'bg-white border-slate-300'}`}>
                                {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                {someSelected && <div className="w-2 h-0.5 bg-violet-600 rounded" />}
                              </button>
                              <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.color} bg-white/60`}>{selectedCount}/{permIds.length}</span>
                            </div>
                            {isCollapsed ? <ChevronRight className={`h-3.5 w-3.5 ${meta.color}`} /> : <ChevronDown className={`h-3.5 w-3.5 ${meta.color}`} />}
                          </div>
                          {!isCollapsed && (
                            <div className="bg-white border-t border-inherit">
                              {perms.map((perm: any, i: number) => {
                                const granted = pendingPermissions.has(perm.id);
                                return (
                                  <div key={perm.id} onClick={() => togglePermission(perm.id)}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-violet-50/50 transition-colors ${i < perms.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${granted ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-300'}`}>
                                      {granted && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[11px] font-semibold text-slate-700 font-mono">{perm.name}</span>
                                      {perm.description && <span className="text-[10px] text-slate-400 ml-2">{perm.description}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-50 rounded-xl"><Plus className="h-4 w-4 text-violet-600" /></div>
                <h3 className="text-sm font-bold text-slate-900">Create New Role</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Role Type</label>
                <select value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:outline-none focus:border-violet-400">
                  {ROLE_NAME_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Display Label</label>
                <input type="text" placeholder="e.g. Warehouse Supervisor" value={newRoleLabel} onChange={e => setNewRoleLabel(e.target.value)}
                  className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs focus:outline-none focus:border-violet-400" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newRoleName}
                className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                style={{ background: '#7c3aed' }}>
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
