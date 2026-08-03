"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, logout, getStoredUser, isAuthenticated, getCurrentUser } from '@/lib/api/auth';
import { LoginRequest } from '@/lib/types/auth';

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
  return {
    id: me.id,
    email: me.email,
    firstName: names[0],
    lastName: names.slice(1).join(' ') || '',
    companyId: me.company?.id || existing?.companyId,
    roleId: me.role?.id || existing?.roleId,
    roleName: me.role?.name || existing?.roleName || 'Operator',
    permissions: me.role?.permissions || existing?.permissions || [],
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
      const storedUser = getStoredUser();
      if (!storedUser || !isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      setUser(storedUser);

      try {
        const me = await getCurrentUser();
        const hydrated = mapMeToUser(me, storedUser);
        setUser(hydrated);
        localStorage.setItem('user', JSON.stringify(hydrated));
      } catch {
        // Keep stored user if /me fails transiently
      } finally {
        setIsLoading(false);
      }
    }

    hydrateUser();
  }, []);

  const handleLogin = async (data: LoginRequest) => {
    const response = await login(data);
    setUser(response.user);
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
