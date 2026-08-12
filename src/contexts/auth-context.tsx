"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, logout, getStoredUser, isAuthenticated, getCurrentUser } from '@/lib/api/auth';
import { LoginRequest } from '@/lib/types/auth';
import { isAdminRole, normalizeRoleName } from '@/lib/permissions';

function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

function normalizeStoredUser(user: any) {
  if (!user) return null;
  return {
    ...user,
    roleName: normalizeRoleName(user.roleName) || user.roleName || 'OPERATOR',
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapMeToUser(me: any, existing?: any) {
  const names = me.fullName ? me.fullName.split(' ') : ['Admin', 'User'];
  const mePermissions = Array.isArray(me.role?.permissions) ? me.role.permissions : [];
  const existingPermissions = Array.isArray(existing?.permissions) ? existing.permissions : [];

  return {
    id: me.id,
    email: me.email || existing?.email,
    firstName: names[0],
    lastName: names.slice(1).join(' ') || '',
    companyId: me.company?.id || existing?.companyId,
    roleId: me.role?.id || existing?.roleId,
    roleName: normalizeRoleName(me.role?.name || existing?.roleName) || 'OPERATOR',
    permissions: mePermissions.length > 0 ? mePermissions : existingPermissions,
    companyName: me.company?.name || existing?.companyName,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function hydrateUser() {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      const storedUser = normalizeStoredUser(getStoredUser());

      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const me = await getCurrentUser();
        const hydrated = mapMeToUser(me, storedUser ?? undefined);
        const normalized = normalizeStoredUser(hydrated);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch {
        if (storedUser && ((storedUser.permissions?.length ?? 0) > 0 || isAdminRole(storedUser))) {
          setUser(storedUser);
        } else {
          clearSession();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    hydrateUser();
  }, []);

  const handleLogin = async (data: LoginRequest) => {
    const response = await login(data);
    const normalized = normalizeStoredUser(response.user);
    setUser(normalized);
    if (normalized) {
      localStorage.setItem('user', JSON.stringify(normalized));
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || !mounted,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
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
