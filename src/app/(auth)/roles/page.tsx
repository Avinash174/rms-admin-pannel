"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Shield, Info, Check, Minus } from 'lucide-react';
import { getPermissionsMatrix } from '@/lib/api/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator',
  VIEWER: 'Viewer',
};

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['permissions-matrix'],
    queryFn: getPermissionsMatrix,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">Loading permissions matrix...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-semibold text-slate-900">Failed to load permissions</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const filteredPermissions = data.permissions.filter(
    (p) =>
      !searchTerm ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-0 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Roles & Permissions</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              <Shield className="w-3.5 h-3.5" /> Read Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5">
            System-defined role permissions. Role permissions cannot be changed from the admin panel.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Role permissions are system-defined and cannot be changed. Contact your system administrator
          if you need custom access policies.
        </p>
      </div>

      <div className="flex items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search permissions..."
          className="max-w-sm h-10 rounded-xl"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs tracking-wider min-w-[220px] sticky left-0 bg-slate-50 z-10">
                  Permission
                </th>
                {data.roles.map((role) => (
                  <th
                    key={role}
                    className="px-3 py-3 font-bold text-slate-600 text-xs text-center min-w-[100px] whitespace-nowrap"
                  >
                    {ROLE_LABELS[role] || role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((permission, idx) => (
                <tr
                  key={permission.key}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                >
                  <td className="px-4 py-3 sticky left-0 bg-inherit z-10 border-r border-slate-100">
                    <div className="font-semibold text-slate-800 font-mono text-xs">{permission.key}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{permission.description}</div>
                  </td>
                  {data.roles.map((role) => {
                    const granted = data.matrix[permission.key]?.[role];
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        {granted ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPermissions.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">No permissions match your search.</div>
        )}
      </div>
    </div>
  );
}
