"use client";

import { Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  isSuperAdmin,
  isWarehouseManager,
  usesWarehouseScope,
} from "@/lib/permissions";
import { SuperAdminDashboard } from "./super-admin-dashboard";
import { CompanyAdminDashboard } from "./company-admin-dashboard";
import { WarehouseManagerDashboard } from "./warehouse-manager-dashboard";

export default function DashboardPage() {
  const { user, company, branch, warehouse, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <XCircle className="mb-3 h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">Access denied</h2>
        <p className="mt-1 text-sm text-slate-500">You do not have permission to view the dashboard.</p>
      </div>
    );
  }

  if (isWarehouseManager(user)) {
    if (!warehouse?.id) {
      return (
        <div className="flex h-96 flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Warehouse Assigned</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md">
            Your account is configured as a Warehouse Administrator, but no warehouse has been assigned to you yet. Please contact your Super Administrator.
          </p>
        </div>
      );
    }
    return (
      <WarehouseManagerDashboard company={company} branch={branch} warehouse={warehouse} />
    );
  }

  if (usesWarehouseScope(user, warehouse?.id)) {
    return (
      <WarehouseManagerDashboard company={company} branch={branch} warehouse={warehouse} />
    );
  }

  if (isSuperAdmin(user)) {
    return <SuperAdminDashboard company={company} />;
  }

  return <CompanyAdminDashboard company={company} branch={branch} />;
}
