"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getStoredSession,
  isAuthenticated,
  getCurrentUser,
  switchWarehouse as apiSwitchWarehouse,
  switchBranch as apiSwitchBranch,
  switchCompany as apiSwitchCompany,
  hydrateSessionFromMe,
} from '@/lib/api/auth';
import { LoginRequest, AuthSession, EntityRef } from '@/lib/types/auth';
import { isAdminRole, normalizeRoleName } from '@/lib/permissions';
import { clearPersistedSession } from '@/lib/session';

interface AuthContextType {
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  company: EntityRef | null;
  branch: EntityRef | null;
  warehouse: EntityRef | null;
  permissions: string[];
  availableCompanies: EntityRef[];
  availableBranches: EntityRef[];
  availableWarehouses: EntityRef[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchWarehouse: (warehouseId: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeSessionUser(user: AuthSession['user']) {
  return {
    ...user,
    roleName: normalizeRoleName(user.roleName) || user.roleName || 'OPERATOR',
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const applySession = useCallback((next: AuthSession) => {
    const normalized = {
      ...next,
      user: normalizeSessionUser(next.user),
      permissions: next.permissions ?? next.user.permissions ?? [],
    };
    setSession(normalized);
  }, []);

  useEffect(() => {
    setMounted(true);

    async function hydrateUser() {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      const stored = getStoredSession();
      if (stored?.user && stored.company && stored.warehouse) {
        applySession({
          accessToken: stored.accessToken!,
          refreshToken: stored.refreshToken || '',
          expiresAt: stored.expiresAt,
          user: stored.user,
          company: stored.company,
          branch: stored.branch ?? null,
          warehouse: stored.warehouse,
          permissions: stored.permissions || stored.user.permissions || [],
          availableCompanies: stored.availableCompanies,
          availableBranches: stored.availableBranches,
          availableWarehouses: stored.availableWarehouses,
        });
      }

      try {
        const me = await getCurrentUser();
        const hydrated = hydrateSessionFromMe(me, stored ?? undefined);
        applySession(hydrated);
      } catch {
        const storedUser = stored?.user;
        if (storedUser && ((storedUser.permissions?.length ?? 0) > 0 || isAdminRole(storedUser))) {
          if (stored?.company && stored?.warehouse && stored?.accessToken) {
            applySession({
              accessToken: stored.accessToken,
              refreshToken: stored.refreshToken || '',
              expiresAt: stored.expiresAt,
              user: storedUser,
              company: stored.company,
              branch: stored.branch ?? null,
              warehouse: stored.warehouse,
              permissions: stored.permissions || storedUser.permissions || [],
              availableCompanies: stored.availableCompanies,
              availableBranches: stored.availableBranches,
              availableWarehouses: stored.availableWarehouses,
            });
          }
        } else {
          clearPersistedSession();
          setSession(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    hydrateUser();
  }, [applySession]);

  const handleLogin = async (data: LoginRequest) => {
    const response = await apiLogin(data);
    applySession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
      user: response.user,
      company: response.company!,
      branch: response.branch ?? null,
      warehouse: response.warehouse!,
      permissions: response.permissions ?? response.user.permissions,
      availableCompanies: response.availableCompanies,
      availableBranches: response.availableBranches,
      availableWarehouses: response.availableWarehouses,
    });
  };

  const handleLogout = async () => {
    await apiLogout();
    setSession(null);
  };

  const refreshSession = async () => {
    const me = await getCurrentUser();
    const stored = getStoredSession();
    const hydrated = hydrateSessionFromMe(me, stored ?? undefined);
    applySession(hydrated);
  };

  const handleSwitchWarehouse = async (warehouseId: string) => {
    const next = await apiSwitchWarehouse(warehouseId);
    applySession(next);
  };

  const handleSwitchBranch = async (branchId: string) => {
    const next = await apiSwitchBranch(branchId);
    applySession(next);
  };

  const handleSwitchCompany = async (companyId: string) => {
    const next = await apiSwitchCompany(companyId);
    applySession(next);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        company: session?.company ?? null,
        branch: session?.branch ?? null,
        warehouse: session?.warehouse ?? null,
        permissions: session?.permissions ?? session?.user?.permissions ?? [],
        availableCompanies: session?.availableCompanies ?? [],
        availableBranches: session?.availableBranches ?? [],
        availableWarehouses: session?.availableWarehouses ?? [],
        isLoading: isLoading || !mounted,
        isAuthenticated: !!session,
        login: handleLogin,
        logout: handleLogout,
        refreshSession,
        switchWarehouse: handleSwitchWarehouse,
        switchBranch: handleSwitchBranch,
        switchCompany: handleSwitchCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
